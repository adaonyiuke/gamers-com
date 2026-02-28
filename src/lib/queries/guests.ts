"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useGuests(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["guests", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*, group_members:invited_by(display_name)")
        .eq("group_id", groupId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

export function useCreateGuest() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      guestType,
      invitedBy,
    }: {
      groupId: string;
      name: string;
      guestType?: string;
      invitedBy?: string;
    }) => {
      const { data, error } = await supabase
        .from("guests")
        .insert({
          group_id: groupId,
          name,
          guest_type: guestType || "temporary",
          invited_by: invitedBy,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });
}

export function useUpdateGuest() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guestId, name }: { guestId: string; name: string }) => {
      const { data, error } = await supabase
        .from("guests")
        .update({ name })
        .eq("id", guestId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });
}

export function useDeleteGuest() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guestId }: { guestId: string }) => {
      const { error } = await supabase
        .from("guests")
        .delete()
        .eq("id", guestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });
}
