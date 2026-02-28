"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getScoringLabel, isGameScoringType, getGameScoringMode } from "@/lib/utils/game-rules";

export function useMeetups(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["meetups", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetups")
        .select("*")
        .eq("group_id", groupId!)
        .is("deleted_at", null)
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

// ---------------------------------------------------------------------------
// Normalized meetup plays — single query for all session results in a meetup
// ---------------------------------------------------------------------------

export type MeetupPlayResult = {
  sessionId: string;
  gameId: string;
  gameName: string;
  scoringType: string;
  scoringLabel: string;
  playedAt: string;
  finalizedAt: string | null;
  status: string;
  winnerName: string | null;
  entries: {
    participantName: string;
    score: number | null;
    placement: number | null;
    isWinner: boolean;
  }[];
};

export function useMeetupPlays(meetupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["meetup_plays", meetupId],
    queryFn: async (): Promise<MeetupPlayResult[]> => {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `id,
          played_at,
          finalized_at,
          status,
          winner_participant_id,
          games:game_id(id, name, scoring_type),
          score_entries(
            score, is_winner, placement, participant_id,
            meetup_participants:participant_id(
              group_members:member_id(display_name),
              guests:guest_id(name)
            )
          )`
        )
        .eq("meetup_id", meetupId!)
        .order("played_at", { ascending: true });
      if (error) throw error;

      return (data ?? []).map((session) => {
        const game = session.games as unknown as {
          id: string;
          name: string;
          scoring_type: string;
        } | null;

        const scoringType = game?.scoring_type ?? "highest_wins";
        const isPlacement =
          isGameScoringType(scoringType) &&
          getGameScoringMode(scoringType as any) === "placement";

        const entries = ((session.score_entries ?? []) as unknown as {
          score: number | null;
          is_winner: boolean;
          placement: number | null;
          participant_id: string;
          meetup_participants: {
            group_members: { display_name: string } | null;
            guests: { name: string } | null;
          } | null;
        }[]).map((e) => ({
          participantName:
            e.meetup_participants?.group_members?.display_name ??
            e.meetup_participants?.guests?.name ??
            "Unknown",
          score: e.score,
          placement: e.placement,
          isWinner: e.is_winner,
        }));

        // Sort entries: by placement if placement mode, by score otherwise
        if (isPlacement) {
          entries.sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999));
        } else {
          entries.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        }

        const winnerEntry = entries.find((e) => e.isWinner);

        return {
          sessionId: session.id,
          gameId: game?.id ?? "",
          gameName: game?.name ?? "Unknown",
          scoringType,
          scoringLabel: getScoringLabel(scoringType),
          playedAt: session.played_at,
          finalizedAt: session.finalized_at,
          status: session.status,
          winnerName: winnerEntry?.participantName ?? null,
          entries,
        };
      });
    },
    enabled: !!meetupId,
  });
}

// ---------- Update meetup title (admin only — enforced via RLS) ----------
export function useUpdateMeetupTitle() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetupId,
      title,
    }: {
      meetupId: string;
      title: string;
    }) => {
      const { data, error } = await supabase
        .from("meetups")
        .update({ title })
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

// ---------- Soft-delete meetups (admin only — enforced via RLS) ----------
export function useSoftDeleteMeetups() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetupIds }: { meetupIds: string[] }) => {
      const { error } = await supabase
        .from("meetups")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", meetupIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetups"] });
    },
  });
}
