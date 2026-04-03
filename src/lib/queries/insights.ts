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
      const { data, error } = await supabase.rpc("get_dashboard_insights", {
        p_group_id: groupId!,
      });
      if (error) throw error;

      const result = data as any;
      if (!result) {
        return {
          mostImproved: null,
          rivalry: null,
          funStats: { longestLosingStreak: null, mostGamesInOneNight: null, luckyFirstTimer: null },
        };
      }

      return {
        mostImproved: result.mostImproved ?? null,
        rivalry: result.rivalry ?? null,
        funStats: {
          longestLosingStreak: result.funStats?.longestLosingStreak ?? null,
          mostGamesInOneNight: result.funStats?.mostGamesInOneNight ?? null,
          luckyFirstTimer: result.funStats?.luckyFirstTimer ?? null,
        },
      };
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}
