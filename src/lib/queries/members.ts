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

      const uniqueGameWins = Object.keys(gameCounts).length;

      // Check "Wildcard" badge: did member win the first time they played any game?
      const { data: allEntries } = await supabase
        .from("score_entries")
        .select(
          `participant_id,
          is_winner,
          sessions:session_id(
            id,
            game_id,
            created_at
          ),
          meetup_participants:participant_id(member_id)`
        )
        .order("created_at", { referencedTable: "sessions", ascending: true });

      // Group sessions by game for this member, find first session per game
      const firstSessionPerGame: Record<string, { sessionId: string; isWinner: boolean; createdAt: string }> = {};
      for (const entry of allEntries ?? []) {
        if ((entry as any).meetup_participants?.member_id !== memberId) continue;
        const session = entry.sessions as any;
        const gameId = session?.game_id;
        if (!gameId) continue;
        const existing = firstSessionPerGame[gameId];
        if (!existing || session.created_at < existing.createdAt) {
          firstSessionPerGame[gameId] = {
            sessionId: session.id,
            isWinner: entry.is_winner ?? false,
            createdAt: session.created_at,
          };
        }
      }
      const hasFirstPlayWin = Object.values(firstSessionPerGame).some((s) => s.isWinner);

      return { meetupsAttended, topGame, uniqueGameWins, hasFirstPlayWin };
    },
    enabled: !!memberId,
  });
}

// ---------- Settings-aware streak calculation ----------
export function useAdjustedStreak(
  memberId: string | null,
  groupId: string | null,
  streakWindow: number = 10,
  includeGuests: boolean = false
) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["adjusted_streak", memberId, groupId, streakWindow, includeGuests],
    queryFn: async (): Promise<number> => {
      // Get recent meetups for this group (limited by streak_window)
      const { data: meetups, error: meetupsError } = await supabase
        .from("meetups")
        .select("id")
        .eq("group_id", groupId!)
        .order("date", { ascending: false })
        .limit(streakWindow);
      if (meetupsError) throw meetupsError;
      if (!meetups || meetups.length === 0) return 0;

      const meetupIds = meetups.map((m) => m.id);

      // Get this member's participations in those meetups
      const { data: participations, error: partError } = await supabase
        .from("meetup_participants")
        .select("id, meetup_id")
        .eq("member_id", memberId!)
        .in("meetup_id", meetupIds);
      if (partError) throw partError;
      if (!participations || participations.length === 0) return 0;

      const participantIds = participations.map((p) => p.id);

      // Get score entries for these participations (finalized sessions only)
      const { data: entries, error: entriesError } = await supabase
        .from("score_entries")
        .select(
          `participant_id, is_winner, session_id,
          sessions:session_id(finalized_at, status)`
        )
        .in("participant_id", participantIds);
      if (entriesError) throw entriesError;

      // Filter to finalized sessions, sort by finalized_at descending
      const results = (entries ?? [])
        .filter((e: any) => (e.sessions as any)?.status === "finalized")
        .sort(
          (a: any, b: any) =>
            new Date((b.sessions as any).finalized_at).getTime() -
            new Date((a.sessions as any).finalized_at).getTime()
        );

      // Count consecutive wins from most recent
      let streak = 0;
      for (const entry of results) {
        if (entry.is_winner) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    },
    enabled: !!memberId && !!groupId,
  });
}

// ---------- Leaderboard with time-period filtering ----------
export type LeaderboardEntry = {
  id: string;
  member_id: string | null;
  guest_id: string | null;
  is_guest: boolean;
  display_name: string;
  avatar_url: string | null;
  total_wins: number;
  total_sessions: number;
  win_rate: number;
};

export function useLeaderboard(
  groupId: string | null,
  period: "month" | "year" | "all",
  includeGuests: boolean = false
) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["leaderboard", groupId, period, includeGuests],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (period === "all") {
        // Member stats from the view
        const { data: stats, error } = await supabase
          .from("member_stats")
          .select("*")
          .eq("group_id", groupId!);
        if (error) throw error;

        const entries: LeaderboardEntry[] = (stats ?? []).map((s: any) => ({
          id: s.member_id,
          member_id: s.member_id,
          guest_id: null,
          is_guest: false,
          display_name: s.display_name ?? "Unknown",
          avatar_url: s.avatar_url,
          total_wins: s.total_wins ?? 0,
          total_sessions: s.total_sessions ?? 0,
          win_rate: s.win_rate ?? 0,
        }));

        if (includeGuests) {
          // Fetch guests and compute their stats from score_entries
          const { data: guests, error: guestsError } = await supabase
            .from("guests")
            .select("id, name, avatar_url")
            .eq("group_id", groupId!);
          if (guestsError) throw guestsError;

          if (guests && guests.length > 0) {
            const { data: guestParticipants, error: gpError } = await supabase
              .from("meetup_participants")
              .select(
                `id, guest_id,
                score_entries(session_id, is_winner,
                  sessions:session_id(status)
                )`
              )
              .in(
                "guest_id",
                guests.map((g) => g.id)
              );
            if (gpError) throw gpError;

            const guestStatsMap: Record<
              string,
              { wins: number; sessions: Set<string> }
            > = {};
            for (const gp of guestParticipants ?? []) {
              if (!gp.guest_id) continue;
              if (!guestStatsMap[gp.guest_id]) {
                guestStatsMap[gp.guest_id] = { wins: 0, sessions: new Set() };
              }
              for (const se of (gp.score_entries ?? []) as any[]) {
                if ((se.sessions as any)?.status !== "finalized") continue;
                guestStatsMap[gp.guest_id].sessions.add(se.session_id);
                if (se.is_winner) guestStatsMap[gp.guest_id].wins++;
              }
            }

            for (const guest of guests) {
              const gs = guestStatsMap[guest.id];
              const totalSessions = gs?.sessions.size ?? 0;
              const totalWins = gs?.wins ?? 0;
              entries.push({
                id: guest.id,
                member_id: null,
                guest_id: guest.id,
                is_guest: true,
                display_name: guest.name,
                avatar_url: guest.avatar_url,
                total_wins: totalWins,
                total_sessions: totalSessions,
                win_rate:
                  totalSessions > 0
                    ? Math.round((totalWins / totalSessions) * 100)
                    : 0,
              });
            }
          }
        }

        return entries.sort((a, b) => b.total_wins - a.total_wins);
      }

      // For month/year, compute from raw session data
      const now = new Date();
      const cutoff =
        period === "month"
          ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          : new Date(now.getFullYear(), 0, 1).toISOString();

      // Get all members in the group
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("id, display_name, avatar_url")
        .eq("group_id", groupId!);
      if (membersError) throw membersError;

      // Optionally get guests
      let guests: any[] = [];
      if (includeGuests) {
        const { data: guestData, error: guestsError } = await supabase
          .from("guests")
          .select("id, name, avatar_url")
          .eq("group_id", groupId!);
        if (guestsError) throw guestsError;
        guests = guestData ?? [];
      }

      // Get finalized sessions in the time range with score entries
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select(
          `id, finalized_at,
          meetups:meetup_id!inner(group_id),
          score_entries(participant_id, is_winner,
            meetup_participants:participant_id(member_id, guest_id)
          )`
        )
        .eq("meetups.group_id", groupId!)
        .eq("status", "finalized")
        .gte("finalized_at", cutoff);
      if (sessionsError) throw sessionsError;

      // Build lookup maps
      const memberMap = new Map(
        (members ?? []).map((m: any) => [m.id, m])
      );
      const guestMap = new Map(guests.map((g: any) => [g.id, g]));

      // Compute per-player stats (members + guests)
      const statsMap: Record<string, { wins: number; plays: number }> = {};
      for (const member of members ?? []) {
        statsMap[`m:${member.id}`] = { wins: 0, plays: 0 };
      }
      for (const guest of guests) {
        statsMap[`g:${guest.id}`] = { wins: 0, plays: 0 };
      }

      for (const session of sessions ?? []) {
        const entries = (session.score_entries ?? []) as any[];
        for (const entry of entries) {
          const memberId = entry.meetup_participants?.member_id;
          const guestId = entry.meetup_participants?.guest_id;
          const key = memberId
            ? `m:${memberId}`
            : guestId
              ? `g:${guestId}`
              : null;
          if (!key || !statsMap[key]) continue;
          statsMap[key].plays++;
          if (entry.is_winner) statsMap[key].wins++;
        }
      }

      const results: LeaderboardEntry[] = [];

      for (const member of members ?? []) {
        const s = statsMap[`m:${member.id}`] ?? { wins: 0, plays: 0 };
        results.push({
          id: member.id,
          member_id: member.id,
          guest_id: null,
          is_guest: false,
          display_name: member.display_name,
          avatar_url: member.avatar_url,
          total_wins: s.wins,
          total_sessions: s.plays,
          win_rate: s.plays > 0 ? Math.round((s.wins / s.plays) * 100) : 0,
        });
      }

      for (const guest of guests) {
        const s = statsMap[`g:${guest.id}`] ?? { wins: 0, plays: 0 };
        results.push({
          id: guest.id,
          member_id: null,
          guest_id: guest.id,
          is_guest: true,
          display_name: guest.name,
          avatar_url: guest.avatar_url,
          total_wins: s.wins,
          total_sessions: s.plays,
          win_rate: s.plays > 0 ? Math.round((s.wins / s.plays) * 100) : 0,
        });
      }

      return results.sort((a, b) => b.total_wins - a.total_wins);
    },
    enabled: !!groupId,
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

export function useUpdateMemberRole() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      groupId,
      role,
    }: {
      memberId: string;
      groupId: string;
      role: "owner" | "member";
    }) => {
      const { data, error } = await supabase
        .from("group_members")
        .update({ role })
        .eq("id", memberId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["group_members", groupId] });
    },
  });
}

export function useLeaveGroup() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ groupId }: { groupId: string }) => {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_groups"] });
      queryClient.invalidateQueries({ queryKey: ["group_members"] });
    },
  });
}

export function useRemoveMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      groupId,
    }: {
      memberId: string;
      groupId: string;
    }) => {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["group_members", groupId] });
    },
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
