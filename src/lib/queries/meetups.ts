"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useMeetups(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["meetups", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetups")
        .select("*")
        .eq("group_id", groupId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

export function useMeetup(meetupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["meetups", "detail", meetupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetups")
        .select("*")
        .eq("id", meetupId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!meetupId,
  });
}

export function useMeetupParticipants(meetupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["meetup_participants", meetupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetup_participants")
        .select(
          `*,
          group_members:member_id(id, display_name, avatar_url),
          guests:guest_id(id, name, avatar_url)`
        )
        .eq("meetup_id", meetupId!);
      if (error) throw error;
      return data;
    },
    enabled: !!meetupId,
  });
}

export function useCreateMeetup() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      title,
      date,
      participantMemberIds,
      participantGuestIds,
    }: {
      groupId: string;
      title: string;
      date: string;
      participantMemberIds: string[];
      participantGuestIds: string[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: meetup, error: meetupError } = await supabase
        .from("meetups")
        .insert({
          group_id: groupId,
          title,
          date,
          status: "planned",
        })
        .select()
        .single();
      if (meetupError) throw meetupError;

      const participants = [
        ...participantMemberIds.map((id) => ({
          meetup_id: meetup.id,
          member_id: id,
        })),
        ...participantGuestIds.map((id) => ({
          meetup_id: meetup.id,
          guest_id: id,
        })),
      ];

      if (participants.length > 0) {
        const { error: participantError } = await supabase
          .from("meetup_participants")
          .insert(participants);
        if (participantError) throw participantError;
      }

      return meetup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetups"] });
    },
  });
}

export function useUpdateMeetupStatus() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetupId,
      status,
    }: {
      meetupId: string;
      status: "planned" | "active" | "complete";
    }) => {
      const { data, error } = await supabase
        .from("meetups")
        .update({ status })
        .eq("id", meetupId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meetups"] });
      queryClient.invalidateQueries({
        queryKey: ["meetups", "detail", data.id],
      });
    },
  });
}
