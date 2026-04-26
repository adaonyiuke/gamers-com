"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/supabase-provider";

/**
 * Returns the set of badge IDs that have already been shown to the current
 * user within the given group (i.e. they're stored in badge_notifications).
 */
export function useBadgeNotifications(groupId: string | null) {
  const supabase = createClient();
  const { user } = useUser();

  return useQuery({
    queryKey: ["badge_notifications", user?.id, groupId],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("badge_notifications")
        .select("badge_id")
        .eq("user_id", user!.id)
        .eq("group_id", groupId!);
      if (error) throw error;
      return new Set<string>((data ?? []).map((n: any) => n.badge_id as string));
    },
    enabled: !!user?.id && !!groupId,
    staleTime: 60_000,
  });
}

/**
 * Marks one or more badges as notified for the current user in the given group.
 * Duplicate inserts are silently ignored (unique constraint on the table).
 */
export function useMarkBadgesNotified() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      groupId,
      badgeIds,
    }: {
      groupId: string;
      badgeIds: string[];
    }) => {
      if (!user?.id || !badgeIds.length) return;
      const { error } = await supabase.from("badge_notifications").insert(
        badgeIds.map((badgeId) => ({
          user_id: user.id,
          group_id: groupId,
          badge_id: badgeId,
        }))
      );
      // Ignore unique-constraint violations — already notified is fine
      if (error && !error.message.includes("unique")) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: ["badge_notifications", user?.id, groupId],
      });
    },
  });
}
