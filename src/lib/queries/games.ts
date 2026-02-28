"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getGameScoringMode, isGameScoringType } from "@/lib/utils/game-rules";
import type { QueryClient } from "@tanstack/react-query";
import type { Database } from "@/lib/supabase/types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

// ---------- Fire-and-forget BGG art fetch ----------
function triggerBggArtFetch(gameId: string, queryClient: QueryClient) {
  fetch(`/api/games/${gameId}/fetch-bgg-art`, { method: "POST" })
    .then((res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["games"] });
        queryClient.invalidateQueries({ queryKey: ["games_with_stats"] });
        queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      }
    })
    .catch(() => {
      // Best-effort — silently ignore failures
    });
}

export type GameWithStats = GameRow & {
  play_count: number;
  last_played_at: string | null;
};

// ---------- Fetch all games with play stats ----------
export function useGamesWithStats(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["games_with_stats", groupId],
    queryFn: async (): Promise<GameWithStats[]> => {
      // 1. Fetch all games for group
      const { data: games, error: gamesErr } = await supabase
        .from("games")
        .select("*")
        .eq("group_id", groupId!)
        .order("name", { ascending: true });
      if (gamesErr) throw gamesErr;

      // 2. Fetch finalized sessions for group to compute play_count + last_played_at
      // Note: finalized_at may be null for older/seeded sessions — fall back to played_at
      const { data: sessions, error: sessErr } = await supabase
        .from("sessions")
        .select("game_id, played_at, finalized_at, meetups!inner(group_id)")
        .eq("meetups.group_id", groupId!)
        .eq("status", "finalized");
      if (sessErr) throw sessErr;

      // 3. Aggregate stats per game
      const statsMap: Record<
        string,
        { count: number; lastPlayed: string | null }
      > = {};
      for (const s of sessions ?? []) {
        const prev = statsMap[s.game_id] ?? { count: 0, lastPlayed: null };
        prev.count += 1;
        // Use finalized_at if available, otherwise fall back to played_at
        const effectiveDate = s.finalized_at ?? s.played_at;
        if (
          effectiveDate &&
          (!prev.lastPlayed || effectiveDate > prev.lastPlayed)
        ) {
          prev.lastPlayed = effectiveDate;
        }
        statsMap[s.game_id] = prev;
      }

      // 4. Merge into games
      return (games ?? []).map((game) => ({
        ...game,
        play_count: statsMap[game.id]?.count ?? 0,
        last_played_at: statsMap[game.id]?.lastPlayed ?? null,
      }));
    },
    enabled: !!groupId,
  });
}

// ---------- Fetch single game by ID ----------
export function useGameById(gameId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["game", gameId],
    queryFn: async (): Promise<GameRow> => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!gameId,
  });
}

// ---------- Fetch stats for a single game ----------
export function useGameStats(gameId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["game_stats", gameId],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("id, played_at, finalized_at")
        .eq("game_id", gameId!)
        .eq("status", "finalized");
      if (error) throw error;

      const count = sessions?.length ?? 0;
      let lastPlayed: string | null = null;
      for (const s of sessions ?? []) {
        // Use finalized_at if available, otherwise fall back to played_at
        const effectiveDate = s.finalized_at ?? s.played_at;
        if (effectiveDate && (!lastPlayed || effectiveDate > lastPlayed)) {
          lastPlayed = effectiveDate;
        }
      }
      return { play_count: count, last_played_at: lastPlayed };
    },
    enabled: !!gameId,
  });
}

// ---------- Legacy hooks (keep for backward compat) ----------
export function useGames(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["games", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("group_id", groupId!)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

// ---------- Create game ----------
export function useCreateGame() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      abbreviation,
      scoringType,
    }: {
      groupId: string;
      name: string;
      abbreviation: string;
      scoringType: string;
    }) => {
      const { data, error } = await supabase
        .from("games")
        .insert({
          group_id: groupId,
          name,
          abbreviation,
          scoring_type: scoringType || "highest_wins",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["games_with_stats"] });
      triggerBggArtFetch(data.id, queryClient);
    },
  });
}

// ---------- Update game ----------
export function useUpdateGame() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      abbreviation,
      scoringType,
      previousName,
    }: {
      id: string;
      name: string;
      abbreviation: string;
      scoringType: string;
      previousName?: string;
    }) => {
      const { data, error } = await supabase
        .from("games")
        .update({
          name,
          abbreviation,
          scoring_type: scoringType,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      // Attach whether name changed for onSuccess
      return { ...data, _nameChanged: previousName !== undefined && previousName !== name };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["games_with_stats"] });
      queryClient.invalidateQueries({ queryKey: ["game", data.id] });
      // Only re-fetch BGG art if the name changed
      if (data._nameChanged) {
        triggerBggArtFetch(data.id, queryClient);
      }
    },
  });
}

// ---------- Top performers for a single game ----------
export type TopPerformer = {
  participant_key: string; // member_id or guest_id for dedup
  display_name: string;
  avatar_url: string | null;
  primary_count: number; // wins or 1st-place finishes
  podium_count: number; // 1st + 2nd + 3rd (placement mode only)
};

export type TopPerformersResult = {
  leaders: TopPerformer[];
  total_plays: number;
};

export function useGameTopPerformers(
  gameId: string | null,
  scoringType: string | null
) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["game_top_performers", gameId],
    queryFn: async (): Promise<TopPerformersResult> => {
      const isPlacement =
        isGameScoringType(scoringType ?? "") &&
        getGameScoringMode(scoringType as any) === "placement";

      // Fetch all score_entries for this game's finalized sessions
      const { data, error } = await supabase
        .from("score_entries")
        .select(
          `is_winner,
          placement,
          sessions:session_id!inner(game_id, status),
          participant:participant_id(
            id,
            member_id,
            guest_id,
            group_members:member_id(display_name, avatar_url),
            guests:guest_id(name, avatar_url)
          )`
        )
        .eq("sessions.game_id", gameId!)
        .eq("sessions.status", "finalized");

      if (error) throw error;

      // Aggregate stats per unique participant
      const statsMap: Record<
        string,
        {
          display_name: string;
          avatar_url: string | null;
          primary_count: number;
          podium_count: number;
        }
      > = {};

      // Track unique session IDs for total play count
      const sessionIds = new Set<string>();

      for (const entry of data ?? []) {
        const participant = entry.participant as unknown as {
          id: string;
          member_id: string | null;
          guest_id: string | null;
          group_members: { display_name: string; avatar_url: string | null } | null;
          guests: { name: string; avatar_url: string | null } | null;
        } | null;

        if (!participant) continue;

        // Use member_id or guest_id as unique key
        const key = participant.member_id ?? participant.guest_id ?? participant.id;
        const name =
          participant.group_members?.display_name ??
          participant.guests?.name ??
          "Unknown";
        const avatar =
          participant.group_members?.avatar_url ??
          participant.guests?.avatar_url ??
          null;

        if (!statsMap[key]) {
          statsMap[key] = {
            display_name: name,
            avatar_url: avatar,
            primary_count: 0,
            podium_count: 0,
          };
        }

        if (isPlacement) {
          // Placement mode: count 1st-place and podium finishes
          if (entry.placement === 1) {
            statsMap[key].primary_count += 1;
          }
          if (entry.placement !== null && entry.placement <= 3) {
            statsMap[key].podium_count += 1;
          }
        } else {
          // Winner mode: count wins
          if (entry.is_winner) {
            statsMap[key].primary_count += 1;
          }
        }
      }

      // Convert to array, sort by primary_count desc, then podium_count desc
      const all: TopPerformer[] = Object.entries(statsMap).map(
        ([key, stats]) => ({
          participant_key: key,
          ...stats,
        })
      );

      all.sort((a, b) => {
        if (b.primary_count !== a.primary_count)
          return b.primary_count - a.primary_count;
        return b.podium_count - a.podium_count;
      });

      // Filter to only co-leaders (those matching the top primary_count)
      const maxPrimary = all[0]?.primary_count ?? 0;
      const leaders =
        maxPrimary > 0
          ? all.filter((p) => p.primary_count === maxPrimary)
          : [];

      return { leaders, total_plays: sessionIds.size };
    },
    enabled: !!gameId && !!scoringType,
  });
}

// ---------- Play history for a single game ----------
export type PlayHistoryEntry = {
  session_id: string;
  played_at: string;
  finalized_at: string | null;
  meetup_title: string;
  meetup_date: string;
  winner_name: string | null;
};

export function useGamePlayHistory(
  gameId: string | null,
  limit: number | null = null
) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["game_play_history", gameId, limit],
    queryFn: async (): Promise<PlayHistoryEntry[]> => {
      let query = supabase
        .from("sessions")
        .select(
          `id,
          played_at,
          finalized_at,
          meetups:meetup_id(title, date),
          winner:winner_participant_id(
            group_members:member_id(display_name),
            guests:guest_id(name)
          )`
        )
        .eq("game_id", gameId!)
        .eq("status", "finalized")
        .order("finalized_at", { ascending: false });

      if (limit !== null) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => {
        // Resolve meetup info — Supabase returns single object for *-to-one
        const meetup = row.meetups as unknown as {
          title: string;
          date: string;
        } | null;

        // Resolve winner name from participant → member or guest
        const winner = row.winner as unknown as {
          group_members: { display_name: string } | null;
          guests: { name: string } | null;
        } | null;

        const winnerName =
          winner?.group_members?.display_name ??
          winner?.guests?.name ??
          null;

        return {
          session_id: row.id,
          played_at: row.played_at,
          finalized_at: row.finalized_at,
          meetup_title: meetup?.title ?? "Unknown meetup",
          meetup_date: meetup?.date ?? row.played_at,
          winner_name: winnerName,
        };
      });
    },
    enabled: !!gameId,
  });
}

// ---------- Game play counts (legacy) ----------
export function useGamePlayCounts(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["game_play_counts", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("game_id, meetups!inner(group_id)")
        .eq("meetups.group_id", groupId!)
        .eq("status", "finalized");
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.game_id] = (counts[row.game_id] ?? 0) + 1;
      }
      return counts;
    },
    enabled: !!groupId,
  });
}

// ---------- Game leaderboard ----------
export function useGameLeaderboard(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["game_leaderboard", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_leaderboard")
        .select("*")
        .eq("group_id", groupId!);
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}
