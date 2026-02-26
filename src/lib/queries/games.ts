"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

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
      const { data: sessions, error: sessErr } = await supabase
        .from("sessions")
        .select("game_id, finalized_at, meetups!inner(group_id)")
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
        if (
          s.finalized_at &&
          (!prev.lastPlayed || s.finalized_at > prev.lastPlayed)
        ) {
          prev.lastPlayed = s.finalized_at;
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
        .select("id, finalized_at")
        .eq("game_id", gameId!)
        .eq("status", "finalized");
      if (error) throw error;

      const count = sessions?.length ?? 0;
      let lastPlayed: string | null = null;
      for (const s of sessions ?? []) {
        if (s.finalized_at && (!lastPlayed || s.finalized_at > lastPlayed)) {
          lastPlayed = s.finalized_at;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["games_with_stats"] });
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
    }: {
      id: string;
      name: string;
      abbreviation: string;
      scoringType: string;
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["games_with_stats"] });
      queryClient.invalidateQueries({ queryKey: ["game", data.id] });
    },
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
