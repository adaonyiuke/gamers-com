-- GAM-41: Move dashboard insights computation from client-side to a single
-- server-side RPC. Eliminates O(n²) pair computation in the browser, avoids
-- fetching hundreds of sessions with nested score_entries over PostgREST,
-- and limits the time window to 50 most recent meetups.

CREATE OR REPLACE FUNCTION public.get_dashboard_insights(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH recent_meetups AS (
    SELECT id, title, date,
           ROW_NUMBER() OVER (ORDER BY date DESC) AS rn
    FROM meetups
    WHERE group_id = p_group_id
      AND deleted_at IS NULL
    ORDER BY date DESC
    LIMIT 50
  ),
  finalized_sessions AS (
    SELECT s.id AS session_id,
           s.meetup_id,
           s.finalized_at,
           g.name AS game_name,
           rm.rn AS meetup_rank,
           rm.title AS meetup_title
    FROM sessions s
    JOIN recent_meetups rm ON rm.id = s.meetup_id
    LEFT JOIN games g ON g.id = s.game_id
    WHERE s.status = 'finalized'
  ),
  entries AS (
    SELECT se.participant_id,
           se.is_winner,
           fs.session_id,
           fs.meetup_id,
           fs.finalized_at,
           fs.game_name,
           fs.meetup_rank,
           fs.meetup_title,
           mp.member_id,
           mp.guest_id
    FROM score_entries se
    JOIN finalized_sessions fs ON fs.session_id = se.session_id
    JOIN meetup_participants mp ON mp.id = se.participant_id
  ),
  -- Only member entries (not guests)
  member_entries AS (
    SELECT * FROM entries WHERE member_id IS NOT NULL
  ),

  -- ── Most Improved ──────────────────────────────────────────────────
  all_time_stats AS (
    SELECT member_id,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE is_winner) AS wins
    FROM member_entries
    GROUP BY member_id
  ),
  recent_stats AS (
    SELECT member_id,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE is_winner) AS wins
    FROM member_entries
    WHERE meetup_rank <= 3
    GROUP BY member_id
  ),
  most_improved AS (
    SELECT r.member_id,
           gm.display_name,
           gm.avatar_url,
           ROUND((r.wins::numeric / r.total) * 100)::int AS recent_win_rate,
           ROUND((a.wins::numeric / a.total) * 100)::int AS all_time_win_rate,
           ROUND((r.wins::numeric / r.total) * 100)::int
             - ROUND((a.wins::numeric / a.total) * 100)::int AS delta
    FROM recent_stats r
    JOIN all_time_stats a ON a.member_id = r.member_id
    JOIN group_members gm ON gm.id = r.member_id
    WHERE a.total >= 3
      AND r.total >= 2
      AND ROUND((r.wins::numeric / r.total) * 100)::int
        - ROUND((a.wins::numeric / a.total) * 100)::int > 0
    ORDER BY delta DESC
    LIMIT 1
  ),

  -- ── Rivalry Stats ──────────────────────────────────────────────────
  -- For each session, find all member pairs
  session_pairs AS (
    SELECT LEAST(a.member_id, b.member_id) AS member_a,
           GREATEST(a.member_id, b.member_id) AS member_b,
           a.session_id,
           (CASE WHEN a.member_id < b.member_id THEN a.is_winner ELSE b.is_winner END) AS a_won,
           (CASE WHEN a.member_id < b.member_id THEN b.is_winner ELSE a.is_winner END) AS b_won
    FROM member_entries a
    JOIN member_entries b ON a.session_id = b.session_id AND a.member_id < b.member_id
  ),
  pair_stats AS (
    SELECT member_a, member_b,
           COUNT(*) AS total_games,
           COUNT(*) FILTER (WHERE a_won) AS a_wins,
           COUNT(*) FILTER (WHERE b_won) AS b_wins
    FROM session_pairs
    GROUP BY member_a, member_b
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  rivalry AS (
    SELECT ps.member_a, ps.member_b,
           ps.total_games, ps.a_wins, ps.b_wins,
           ga.display_name AS a_name, ga.avatar_url AS a_avatar,
           gb.display_name AS b_name, gb.avatar_url AS b_avatar
    FROM pair_stats ps
    JOIN group_members ga ON ga.id = ps.member_a
    JOIN group_members gb ON gb.id = ps.member_b
  ),

  -- ── Fun Stats: Longest Losing Streak ───────────────────────────────
  -- Use window functions to compute consecutive non-wins per member
  member_results_ordered AS (
    SELECT member_id, is_winner, finalized_at,
           ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY finalized_at) AS rn
    FROM member_entries
  ),
  streak_groups AS (
    SELECT member_id, is_winner, rn,
           rn - ROW_NUMBER() OVER (PARTITION BY member_id, is_winner ORDER BY rn) AS grp
    FROM member_results_ordered
  ),
  losing_streaks AS (
    SELECT member_id,
           COUNT(*) AS streak_len
    FROM streak_groups
    WHERE NOT is_winner
    GROUP BY member_id, grp
  ),
  max_losing_streak AS (
    SELECT ls.member_id, ls.streak_len,
           gm.display_name, gm.avatar_url
    FROM losing_streaks ls
    JOIN group_members gm ON gm.id = ls.member_id
    -- Only consider members with at least 3 total games
    JOIN all_time_stats ats ON ats.member_id = ls.member_id AND ats.total >= 3
    ORDER BY ls.streak_len DESC
    LIMIT 1
  ),

  -- ── Fun Stats: Most Games in One Night ─────────────────────────────
  member_meetup_counts AS (
    SELECT member_id, meetup_id, meetup_title,
           COUNT(*) AS game_count
    FROM member_entries
    GROUP BY member_id, meetup_id, meetup_title
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  most_games_night AS (
    SELECT mmc.member_id, mmc.game_count, mmc.meetup_title,
           gm.display_name, gm.avatar_url
    FROM member_meetup_counts mmc
    JOIN group_members gm ON gm.id = mmc.member_id
  ),

  -- ── Fun Stats: Lucky First-Timer ───────────────────────────────────
  first_game_per_member AS (
    SELECT DISTINCT ON (member_id)
           member_id, is_winner, game_name
    FROM member_entries
    ORDER BY member_id, finalized_at ASC
  ),
  lucky_first_timer AS (
    SELECT fg.member_id, fg.game_name,
           gm.display_name, gm.avatar_url
    FROM first_game_per_member fg
    JOIN group_members gm ON gm.id = fg.member_id
    WHERE fg.is_winner = true
    LIMIT 1
  )

  SELECT jsonb_build_object(
    'mostImproved',
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM most_improved)
      THEN (SELECT jsonb_build_object(
        'memberId', mi.member_id,
        'displayName', mi.display_name,
        'avatarUrl', mi.avatar_url,
        'recentWinRate', mi.recent_win_rate,
        'allTimeWinRate', mi.all_time_win_rate,
        'delta', mi.delta
      ) FROM most_improved mi)
      ELSE NULL
    END),

    'rivalry',
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM rivalry)
      THEN (SELECT jsonb_build_object(
        'playerA', jsonb_build_object(
          'id', r.member_a, 'name', r.a_name,
          'avatarUrl', r.a_avatar, 'wins', r.a_wins
        ),
        'playerB', jsonb_build_object(
          'id', r.member_b, 'name', r.b_name,
          'avatarUrl', r.b_avatar, 'wins', r.b_wins
        ),
        'totalGames', r.total_games
      ) FROM rivalry r)
      ELSE NULL
    END),

    'funStats', jsonb_build_object(
      'longestLosingStreak',
      (SELECT CASE WHEN EXISTS (SELECT 1 FROM max_losing_streak)
        THEN (SELECT jsonb_build_object(
          'name', mls.display_name,
          'avatarUrl', mls.avatar_url,
          'streak', mls.streak_len
        ) FROM max_losing_streak mls)
        ELSE NULL
      END),

      'mostGamesInOneNight',
      (SELECT CASE WHEN EXISTS (SELECT 1 FROM most_games_night)
        THEN (SELECT jsonb_build_object(
          'name', mgn.display_name,
          'avatarUrl', mgn.avatar_url,
          'count', mgn.game_count,
          'meetupTitle', mgn.meetup_title
        ) FROM most_games_night mgn)
        ELSE NULL
      END),

      'luckyFirstTimer',
      (SELECT CASE WHEN EXISTS (SELECT 1 FROM lucky_first_timer)
        THEN (SELECT jsonb_build_object(
          'name', lft.display_name,
          'avatarUrl', lft.avatar_url,
          'gameName', lft.game_name
        ) FROM lucky_first_timer lft)
        ELSE NULL
      END)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
