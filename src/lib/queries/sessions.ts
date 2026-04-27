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

export function useRecentSessions(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["recent_sessions", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `*,
          games:game_id(id, name, abbreviation, icon, scoring_type, image_url, thumbnail_url, image_status),
          meetups:meetup_id!inner(id, group_id, title),
          score_entries(
            id, score, is_winner, participant_id,
            meetup_participants:participant_id(
              id,
              group_members:member_id(display_name, avatar_url),
              guests:guest_id(name, avatar_url)
            )
          )`
        )
        .eq("meetups.group_id", groupId!)
        .eq("status", "finalized")
        .order("finalized_at", { ascending: false, nullsFirst: false })
        .order("played_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

// Sessions from the last 3 meetups, grouped by meetup
export function useRecentMeetupSessions(groupId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["recent_meetup_sessions", groupId],
    queryFn: async () => {
      // Get the 3 most recent meetups
      const { data: meetups, error: meetupsError } = await supabase
        .from("meetups")
        .select("id, title, date, status")
        .eq("group_id", groupId!)
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .limit(3);
      if (meetupsError) throw meetupsError;
      if (!meetups || meetups.length === 0) return [];

      const meetupIds = meetups.map((m) => m.id);

      // Get all finalized sessions for those meetups
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select(
          `*,
          games:game_id(id, name, abbreviation, icon, scoring_type, image_url, thumbnail_url, image_status),
          meetups:meetup_id(id, title, date),
          score_entries(
            id, score, is_winner, participant_id,
            meetup_participants:participant_id(
              id,
              group_members:member_id(display_name, avatar_url),
              guests:guest_id(name, avatar_url)
            )
          )`
        )
        .in("meetup_id", meetupIds)
        .eq("status", "finalized")
        .order("finalized_at", { ascending: false, nullsFirst: false })
        .order("played_at", { ascending: false });
      if (sessionsError) throw sessionsError;

      // Group sessions by meetup, preserving meetup order
      return meetups.map((meetup) => ({
        meetup,
        sessions: (sessions ?? []).filter(
          (s: any) => s.meetup_id === meetup.id
        ),
      }));
    },
    enabled: !!groupId,
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
      placements = [],
      winnerParticipantId,
    }: {
      sessionId: string;
      meetupId: string;
      scores: { participantId: string; score: number | null }[];
      placements?: { participantId: string; placement: number }[];
      winnerParticipantId: string | null;
    }) => {
      // Build a placement lookup for merging into score entries
      const placementMap: Record<string, number> = {};
      for (const p of placements) {
        placementMap[p.participantId] = p.placement;
      }

      // Upsert score entries (with optional placement)
      const scoreEntries = scores.map((s) => ({
        session_id: sessionId,
        participant_id: s.participantId,
        score: s.score,
        is_winner: s.participantId === winnerParticipantId,
        placement: placementMap[s.participantId] ?? null,
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
      queryClient.invalidateQueries({ queryKey: ["recent_sessions"] });
      queryClient.invalidateQueries({ queryKey: ["member_stats"] });
      queryClient.invalidateQueries({ queryKey: ["game_leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["games_with_stats"] });
      queryClient.invalidateQueries({ queryKey: ["game_stats"] });
      queryClient.invalidateQueries({ queryKey: ["game_top_performers"] });
      queryClient.invalidateQueries({ queryKey: ["game_play_history"] });
    },
  });
}
