"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trophy, Clock } from "lucide-react";
import { useGameById, useGameStats } from "@/lib/queries/games";
import { getRelativeTime, formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { GameFormModal } from "@/components/features/games/game-form-modal";

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

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const { data: game, isLoading: gameLoading } = useGameById(gameId);
  const { data: stats, isLoading: statsLoading } = useGameStats(gameId);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);

  const isLoading = gameLoading || statsLoading;

  const color = TILE_COLORS[0];
  const abbr =
    game?.abbreviation || (game?.name ?? "").substring(0, 2).toUpperCase();
  const playCount = stats?.play_count ?? 0;
  const lastPlayed = stats?.last_played_at;

  function handleEditSuccess() {
    setShowEditModal(false);
    setShowEditSuccess(true);
    setTimeout(() => setShowEditSuccess(false), 2500);
  }

  return (
    <div className="pb-36">
      {/* Glass header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3 flex items-center gap-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <button
          onClick={() => router.push("/games")}
          className="flex items-center text-[#007AFF] -ml-1 active:opacity-60 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px]">Games</span>
        </button>
        <div className="flex-1" />
        {game && (
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 text-[#007AFF] active:opacity-60 transition-opacity"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-[17px]">Edit</span>
          </button>
        )}
      </div>

      <div className="px-5 mt-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-start gap-4">
                <SkeletonBlock className="h-16 w-16 !rounded-[14px] shrink-0" />
                <div className="flex-1 pt-1">
                  <SkeletonBlock className="h-6 w-36 mb-2" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <SkeletonBlock className="h-[72px] !rounded-[14px]" />
                <SkeletonBlock className="h-[72px] !rounded-[14px]" />
              </div>
            </div>
            <SkeletonBlock className="h-20 !rounded-[20px]" />
          </div>
        ) : !game ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10 text-center">
            <p className="text-[17px] font-semibold text-gray-900 mb-1">
              Game not found
            </p>
            <p className="text-[15px] text-gray-500">
              This game may have been deleted.
            </p>
          </div>
        ) : (
          <>
            {/* Success toast */}
            {showEditSuccess && (
              <div className="mb-4 bg-green-50 rounded-[14px] px-4 py-3 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-[15px] text-green-700 font-medium">
                  Game updated successfully
                </p>
              </div>
            )}

            {/* Game info card */}
            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-start gap-4">
                <div
                  className="h-16 w-16 rounded-[14px] flex items-center justify-center text-white text-[22px] font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {abbr}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-[22px] font-bold text-gray-900 truncate">
                    {game.name}
                  </h2>
                  <p className="text-[15px] text-gray-500 mt-0.5">
                    {SCORING_LABELS[game.scoring_type] ?? game.scoring_type}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-gray-50 rounded-[14px] px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[13px] text-gray-500 font-medium">
                      Times Played
                    </span>
                  </div>
                  <p className="text-[22px] font-bold text-gray-900">
                    {playCount}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-[14px] px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[13px] text-gray-500 font-medium">
                      Last Played
                    </span>
                  </div>
                  <p className="text-[22px] font-bold text-gray-900">
                    {lastPlayed ? getRelativeTime(lastPlayed) : "Never"}
                  </p>
                  {lastPlayed && (
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {formatDate(lastPlayed)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Future: Play History section */}
            <div className="mt-4">
              <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[17px] font-semibold text-gray-900 mb-2">
                  Play History
                </h3>
                <p className="text-[15px] text-gray-400">
                  Coming soon — recent sessions will appear here.
                </p>
              </div>
            </div>

            {/* Future: Top Winner section */}
            <div className="mt-3">
              <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[17px] font-semibold text-gray-900 mb-2">
                  Top Winner
                </h3>
                <p className="text-[15px] text-gray-400">
                  Coming soon — leaderboard stats will appear here.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && game && (
        <GameFormModal
          mode="edit"
          game={game}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
