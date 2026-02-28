"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/supabase-provider";

export function useGroupMembers(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["group_members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId!)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

export function useMemberStats(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["member_stats", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_stats")
        .select("*")
        .eq("group_id", groupId!);
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

export function useMemberProfile(memberId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["member_profile", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("id", memberId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });
}

export function useMemberGameStats(memberId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["member_game_stats", memberId],
    queryFn: async () => {
      // Get meetups attended
      const { data: participations, error: partError } = await supabase
        .from("meetup_participants")
        .select("meetup_id")
        .eq("member_id", memberId!);
      if (partError) throw partError;
      const meetupsAttended = new Set(
        participations?.map((p: any) => p.meetup_id) ?? []
      ).size;

      // Get top game (game with most wins)
      const { data: winEntries, error: winError } = await supabase
        .from("score_entries")
        .select(
          `participant_id,
          is_winner,
          sessions:session_id(
            game_id,
            games:game_id(name)
          ),
          meetup_participants:participant_id(member_id)`
        )
        .eq("is_winner", true);
      if (winError) throw winError;

      // Filter to this member's wins and count by game
      const gameCounts: Record<string, { name: string; count: number }> = {};
      for (const entry of winEntries ?? []) {
        if ((entry as any).meetup_participants?.member_id !== memberId) continue;
        const session = entry.sessions as any;
        const gameId = session?.game_id;
        const gameName = session?.games?.name;
        if (!gameId || !gameName) continue;
        if (!gameCounts[gameId]) {
          gameCounts[gameId] = { name: gameName, count: 0 };
        }
        gameCounts[gameId].count++;
      }

      let topGame: string | null = null;
      let maxWins = 0;
      for (const [, val] of Object.entries(gameCounts)) {
        if (val.count > maxWins) {
          maxWins = val.count;
          topGame = val.name;
        }
      }

      return { meetupsAttended, topGame };
    },
    enabled: !!memberId,
  });
}

// ---------- Current user's role in a group ----------
export function useCurrentMemberRole(groupId: string | null) {
  const supabase = createClient();
  const { user } = useUser();
  return useQuery({
    queryKey: ["current_member_role", groupId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data.role as string;
    },
    enabled: !!groupId && !!user?.id,
  });
}

export function useUpdateMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      updates,
    }: {
      memberId: string;
      updates: {
        display_name?: string;
        bio?: string | null;
        avatar_url?: string | null;
      };
    }) => {
      const { data, error } = await supabase
        .from("group_members")
        .update(updates)
        .eq("id", memberId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["member_profile", data.id] });
      queryClient.invalidateQueries({ queryKey: ["group_members"] });
    },
  });
}
