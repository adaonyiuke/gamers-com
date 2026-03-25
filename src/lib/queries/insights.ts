"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MostImprovedPlayer = {
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
  recentWinRate: number; // percentage, last 3 meetups
  allTimeWinRate: number;
  delta: number; // recentWinRate - allTimeWinRate
};

export type RivalryPair = {
  playerA: { id: string; name: string; avatarUrl: string | null; wins: number };
  playerB: { id: string; name: string; avatarUrl: string | null; wins: number };
  totalGames: number;
};

export type FunStats = {
  longestLosingStreak: { name: string; avatarUrl: string | null; streak: number } | null;
  mostGamesInOneNight: { name: string; avatarUrl: string | null; count: number; meetupTitle: string } | null;
  luckyFirstTimer: { name: string; avatarUrl: string | null; gameName: string } | null;
};

export type DashboardInsights = {
  mostImproved: MostImprovedPlayer | null;
  rivalry: RivalryPair | null;
  funStats: FunStats;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDashboardInsights(groupId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard_insights", groupId],
    queryFn: async (): Promise<DashboardInsights> => {
      // 1. Fetch all members in group
      const { data: members, error: mErr } = await supabase
        .from("group_members")
        .select("id, display_name, avatar_url")
        .eq("group_id", groupId!);
      if (mErr) throw mErr;
      const memberMap = new Map(
        (members ?? []).map((m) => [m.id, m])
      );

      // 2. Fetch recent meetups (ordered by date desc)
      const { data: meetups, error: mtErr } = await supabase
        .from("meetups")
        .select("id, title, date")
        .eq("group_id", groupId!)
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .limit(50);
      if (mtErr) throw mtErr;
      if (!meetups || meetups.length === 0) {
        return { mostImproved: null, rivalry: null, funStats: { longestLosingStreak: null, mostGamesInOneNight: null, luckyFirstTimer: null } };
      }

      const meetupIds = meetups.map((m) => m.id);
      const recentMeetupIds = new Set(meetups.slice(0, 3).map((m) => m.id));

      // 3. Fetch all finalized sessions with score entries for these meetups
      const { data: sessions, error: sErr } = await supabase
        .from("sessions")
        .select(
          `id, meetup_id, status, finalized_at,
          games:game_id(id, name),
          score_entries(
            participant_id, is_winner,
            meetup_participants:participant_id(
              id, member_id, guest_id
            )
          )`
        )
        .in("meetup_id", meetupIds)
        .eq("status", "finalized")
        .order("finalized_at", { ascending: true, nullsFirst: false });
      if (sErr) throw sErr;
      if (!sessions || sessions.length === 0) {
        return { mostImproved: null, rivalry: null, funStats: { longestLosingStreak: null, mostGamesInOneNight: null, luckyFirstTimer: null } };
      }

      // ── Most Improved ──────────────────────────────────────────────────
      // Compare win rate in last 3 meetups vs all-time
      const allTimeStats: Record<string, { wins: number; total: number }> = {};
      const recentStats: Record<string, { wins: number; total: number }> = {};

      for (const session of sessions) {
        const isRecent = recentMeetupIds.has(session.meetup_id);
        for (const entry of (session.score_entries ?? []) as any[]) {
          const memberId = entry.meetup_participants?.member_id;
          if (!memberId) continue;

          if (!allTimeStats[memberId]) allTimeStats[memberId] = { wins: 0, total: 0 };
          allTimeStats[memberId].total++;
          if (entry.is_winner) allTimeStats[memberId].wins++;

          if (isRecent) {
            if (!recentStats[memberId]) recentStats[memberId] = { wins: 0, total: 0 };
            recentStats[memberId].total++;
            if (entry.is_winner) recentStats[memberId].wins++;
          }
        }
      }

      let mostImproved: MostImprovedPlayer | null = null;
      for (const [memberId, recent] of Object.entries(recentStats)) {
        const allTime = allTimeStats[memberId];
        if (!allTime || allTime.total < 3 || recent.total < 2) continue; // need enough data
        const recentWinRate = Math.round((recent.wins / recent.total) * 100);
        const allTimeWinRate = Math.round((allTime.wins / allTime.total) * 100);
        const delta = recentWinRate - allTimeWinRate;
        if (delta > 0 && (!mostImproved || delta > mostImproved.delta)) {
          const member = memberMap.get(memberId);
          if (member) {
            mostImproved = {
              memberId,
              displayName: member.display_name,
              avatarUrl: member.avatar_url,
              recentWinRate,
              allTimeWinRate,
              delta,
            };
          }
        }
      }

      // ── Rivalry Stats ──────────────────────────────────────────────────
      // Find pairs of members who appear in the most sessions together
      const pairGames: Record<string, { aWins: number; bWins: number; total: number }> = {};

      for (const session of sessions) {
        const entries = (session.score_entries ?? []) as any[];
        const memberEntries = entries
          .filter((e: any) => e.meetup_participants?.member_id)
          .map((e: any) => ({
            memberId: e.meetup_participants.member_id as string,
            isWinner: e.is_winner as boolean,
          }));

        // For each pair of members in this session
        for (let i = 0; i < memberEntries.length; i++) {
          for (let j = i + 1; j < memberEntries.length; j++) {
            const [a, b] = [memberEntries[i], memberEntries[j]].sort((x, y) =>
              x.memberId.localeCompare(y.memberId)
            );
            const key = `${a.memberId}|${b.memberId}`;
            if (!pairGames[key]) pairGames[key] = { aWins: 0, bWins: 0, total: 0 };
            pairGames[key].total++;
            if (a.isWinner) pairGames[key].aWins++;
            if (b.isWinner) pairGames[key].bWins++;
          }
        }
      }

      let rivalry: RivalryPair | null = null;
      let maxPairGames = 0;
      for (const [key, pair] of Object.entries(pairGames)) {
        if (pair.total > maxPairGames && pair.total >= 3) {
          const [aId, bId] = key.split("|");
          const memberA = memberMap.get(aId);
          const memberB = memberMap.get(bId);
          if (memberA && memberB) {
            maxPairGames = pair.total;
            rivalry = {
              playerA: { id: aId, name: memberA.display_name, avatarUrl: memberA.avatar_url, wins: pair.aWins },
              playerB: { id: bId, name: memberB.display_name, avatarUrl: memberB.avatar_url, wins: pair.bWins },
              totalGames: pair.total,
            };
          }
        }
      }

      // ── Fun Stats ──────────────────────────────────────────────────────

      // Longest losing streak (most consecutive non-wins for any member)
      const memberResults: Record<string, boolean[]> = {};
      for (const session of sessions) {
        for (const entry of (session.score_entries ?? []) as any[]) {
          const memberId = entry.meetup_participants?.member_id;
          if (!memberId) continue;
          if (!memberResults[memberId]) memberResults[memberId] = [];
          memberResults[memberId].push(!!entry.is_winner);
        }
      }

      let longestLosingStreak: FunStats["longestLosingStreak"] = null;
      for (const [memberId, results] of Object.entries(memberResults)) {
        if (results.length < 3) continue;
        let maxStreak = 0;
        let currentStreak = 0;
        for (const won of results) {
          if (!won) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }
        if (maxStreak > (longestLosingStreak?.streak ?? 0)) {
          const member = memberMap.get(memberId);
          if (member) {
            longestLosingStreak = {
              name: member.display_name,
              avatarUrl: member.avatar_url,
              streak: maxStreak,
            };
          }
        }
      }

      // Most games in a single meetup (by any individual member)
      const memberMeetupCounts: Record<string, number> = {};
      const memberMeetupKey = (memberId: string, meetupId: string) => `${memberId}|${meetupId}`;
      for (const session of sessions) {
        for (const entry of (session.score_entries ?? []) as any[]) {
          const memberId = entry.meetup_participants?.member_id;
          if (!memberId) continue;
          const key = memberMeetupKey(memberId, session.meetup_id);
          memberMeetupCounts[key] = (memberMeetupCounts[key] ?? 0) + 1;
        }
      }

      let mostGamesInOneNight: FunStats["mostGamesInOneNight"] = null;
      let maxNightGames = 0;
      for (const [key, count] of Object.entries(memberMeetupCounts)) {
        if (count > maxNightGames) {
          const [memberId, meetupId] = key.split("|");
          const member = memberMap.get(memberId);
          const meetup = meetups.find((m) => m.id === meetupId);
          if (member && meetup) {
            maxNightGames = count;
            mostGamesInOneNight = {
              name: member.display_name,
              avatarUrl: member.avatar_url,
              count,
              meetupTitle: meetup.title,
            };
          }
        }
      }

      // Lucky first-timer: find a member who won their very first game ever
      const firstGamePerMember: Record<string, { won: boolean; gameName: string; finalizedAt: string }> = {};
      for (const session of sessions) {
        for (const entry of (session.score_entries ?? []) as any[]) {
          const memberId = entry.meetup_participants?.member_id;
          if (!memberId) continue;
          const existing = firstGamePerMember[memberId];
          const finalizedAt = session.finalized_at ?? "";
          if (!existing || finalizedAt < existing.finalizedAt) {
            firstGamePerMember[memberId] = {
              won: !!entry.is_winner,
              gameName: (session.games as any)?.name ?? "Unknown",
              finalizedAt,
            };
          }
        }
      }

      let luckyFirstTimer: FunStats["luckyFirstTimer"] = null;
      for (const [memberId, info] of Object.entries(firstGamePerMember)) {
        if (info.won) {
          const member = memberMap.get(memberId);
          if (member) {
            luckyFirstTimer = {
              name: member.display_name,
              avatarUrl: member.avatar_url,
              gameName: info.gameName,
            };
            break; // Just find one
          }
        }
      }

      return {
        mostImproved,
        rivalry,
        funStats: { longestLosingStreak, mostGamesInOneNight, luckyFirstTimer },
      };
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
