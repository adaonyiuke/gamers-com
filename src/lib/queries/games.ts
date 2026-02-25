"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

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

export function useCreateGame() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      minPlayers,
      maxPlayers,
      scoringType,
    }: {
      groupId: string;
      name: string;
      minPlayers?: number;
      maxPlayers?: number;
      scoringType?: string;
    }) => {
      const { data, error } = await supabase
        .from("games")
        .insert({
          group_id: groupId,
          name,
          min_players: minPlayers,
          max_players: maxPlayers,
          scoring_type: scoringType || "highest_wins",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

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
