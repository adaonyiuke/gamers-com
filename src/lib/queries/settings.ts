"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface GroupSettings {
  id: string;
  group_id: string;
  // Group: Identity
  default_meetup_name_format: string;
  // Group: Guest policy
  guest_include_in_stats: boolean;
  guest_allow_recurring: boolean;
  // Group: Meetup defaults
  auto_include_all_members: boolean;
  default_meetup_status: string;
  // Game: Session rules
  allow_edit_finalized: boolean;
  lock_sessions_after_complete: boolean;
  // Game: Animations
  confetti_intensity: string;
  winner_animation: boolean;
  reduced_motion: boolean;
  // Dashboard: Leaderboards
  leaderboard_default_sort: string;
  leaderboard_include_guests: boolean;
  // Dashboard: Streaks
  streak_window: number;
  streak_include_guests: boolean;
  // Dashboard: Highlights
  show_most_improved: boolean;
  show_rivalry_stats: boolean;
  show_fun_stats: boolean;
}

export function useGroupSettings(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["group_settings", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_settings")
        .select("*")
        .eq("group_id", groupId!)
        .single();
      if (error) throw error;
      return data as GroupSettings;
    },
    enabled: !!groupId,
  });
}

export function useUpdateGroupSettings() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      updates,
    }: {
      groupId: string;
      updates: Partial<Omit<GroupSettings, "id" | "group_id">>;
    }) => {
      const { data, error } = await supabase
        .from("group_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("group_id", groupId)
        .select()
        .single();
      if (error) throw error;
      return data as GroupSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["group_settings", data.group_id], data);
    },
  });
}
