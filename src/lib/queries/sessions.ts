"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useMeetupSessions(meetupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["sessions", meetupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `*,
          games:game_id(id, name, icon, scoring_type),
          score_entries(
            id, score, is_winner, participant_id,
            meetup_participants:participant_id(
              id,
              group_members:member_id(display_name, avatar_url),
              guests:guest_id(name, avatar_url)
            )
          )`
        )
        .eq("meetup_id", meetupId!)
        .order("played_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!meetupId,
  });
}

export function useCreateSession() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetupId,
      gameId,
    }: {
      meetupId: string;
      gameId: string;
    }) => {
      const { data, error } = await supabase
        .from("sessions")
        .insert({ meetup_id: meetupId, game_id: gameId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", data.meetup_id],
      });
    },
  });
}

export function useFinalizeSession() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      meetupId,
      scores,
      winnerParticipantId,
    }: {
      sessionId: string;
      meetupId: string;
      scores: { participantId: string; score: number | null }[];
      winnerParticipantId: string | null;
    }) => {
      // Upsert score entries
      const scoreEntries = scores.map((s) => ({
        session_id: sessionId,
        participant_id: s.participantId,
        score: s.score,
        is_winner: s.participantId === winnerParticipantId,
      }));

      const { error: scoreError } = await supabase
        .from("score_entries")
        .upsert(scoreEntries, {
          onConflict: "session_id,participant_id",
        });
      if (scoreError) throw scoreError;

      // Finalize session
      const { data, error } = await supabase
        .from("sessions")
        .update({
          status: "finalized",
          winner_participant_id: winnerParticipantId,
          finalized_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", data.meetup_id],
      });
      queryClient.invalidateQueries({ queryKey: ["member_stats"] });
      queryClient.invalidateQueries({ queryKey: ["game_leaderboard"] });
    },
  });
}
