"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

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
