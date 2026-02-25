"use client";

import Link from "next/link";
import { Gamepad2, Plus } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useGames, useGamePlayCounts } from "@/lib/queries/games";
import { cn } from "@/lib/utils/cn";

const TILE_COLORS = [
  "#007AFF",
  "#FF9500",
  "#FF2D55",
  "#5856D6",
  "#34C759",
  "#AF52DE",
  "#FF3B30",
  "#00C7BE",
];

const SCORING_LABELS: Record<string, string> = {
  highest_wins: "Highest Wins",
  lowest_wins: "Lowest Wins",
  manual_winner: "Manual Winner",
};

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function GamesPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: games, isLoading: gamesLoading } = useGames(groupId);
  const { data: playCounts } = useGamePlayCounts(groupId);

  const isLoading = groupLoading || gamesLoading;

  return (
    <div className="pb-36">
      {/* Glass header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          Games
        </h1>
      </div>

      <div className="px-5 mt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <SkeletonBlock className="h-12 w-12 !rounded-[10px] mb-3" />
                <SkeletonBlock className="h-4 w-20 mb-2" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : !games || games.length === 0 ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10 text-center">
            <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[17px] font-semibold text-gray-900 mb-1">
              No games yet
            </p>
            <p className="text-[15px] text-gray-500">
              Add your first game to start tracking scores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {games.map((game: any, idx: number) => {
              const color = TILE_COLORS[idx % TILE_COLORS.length];
              const abbr = (game.name ?? "")
                .substring(0, 2)
                .toUpperCase();
              const count = playCounts?.[game.id] ?? 0;

              return (
                <div
                  key={game.id}
                  className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <div
                    className="h-12 w-12 rounded-[10px] flex items-center justify-center text-white text-[17px] font-bold mb-3"
                    style={{ backgroundColor: color }}
                  >
                    {abbr}
                  </div>
                  <p className="text-[17px] font-semibold text-gray-900 truncate">
                    {game.name}
                  </p>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    {SCORING_LABELS[game.scoring_type] ?? game.scoring_type}
                  </p>
                  <p className="text-[13px] text-gray-400 mt-0.5">
                    {count > 0 ? `${count} Played` : "Not Played"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/games/new"
        className="fixed bottom-28 right-5 h-14 w-14 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition-transform z-30"
        style={{
          maxWidth: "430px",
        }}
      >
        <Plus className="h-7 w-7 text-white" />
      </Link>
    </div>
  );
}
