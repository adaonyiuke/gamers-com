-- Recreate member_stats view with current_streak
-- current_streak = number of consecutive most-recent finalized sessions where the member won
CREATE OR REPLACE VIEW public.member_stats AS
WITH session_results AS (
  SELECT
    mp.member_id,
    se.session_id,
    se.is_winner,
    s.finalized_at,
    ROW_NUMBER() OVER (
      PARTITION BY mp.member_id
      ORDER BY s.finalized_at DESC
    ) AS rn
  FROM meetup_participants mp
  JOIN score_entries se ON se.participant_id = mp.id
  JOIN sessions s ON s.id = se.session_id
  WHERE mp.member_id IS NOT NULL
    AND s.status = 'finalized'
),
streak_calc AS (
  SELECT
    member_id,
    COALESCE(
      MIN(CASE WHEN NOT is_winner THEN rn END) - 1,
      MAX(rn)
    ) AS current_streak
  FROM session_results
  GROUP BY member_id
)
SELECT
  gm.id AS member_id,
  gm.group_id,
  gm.user_id,
  gm.display_name,
  gm.avatar_url,
  COUNT(DISTINCT mp.meetup_id) AS total_meetups,
  COUNT(DISTINCT se.session_id) AS total_sessions,
  COUNT(*) FILTER (WHERE se.is_winner) AS total_wins,
  CASE
    WHEN COUNT(DISTINCT se.session_id) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE se.is_winner)::numeric
      / COUNT(DISTINCT se.session_id)::numeric * 100, 1
    )
    ELSE 0
  END AS win_rate,
  COALESCE(sc.current_streak, 0) AS current_streak
FROM group_members gm
LEFT JOIN meetup_participants mp ON mp.member_id = gm.id
LEFT JOIN score_entries se ON se.participant_id = mp.id
LEFT JOIN streak_calc sc ON sc.member_id = gm.id
GROUP BY gm.id, gm.group_id, gm.user_id, gm.display_name, gm.avatar_url, sc.current_streak;
