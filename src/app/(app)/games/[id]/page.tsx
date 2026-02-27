"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trophy, Clock, Calendar, ChevronDown, ChevronUp, User, Medal, Star } from "lucide-react";
import { useGameById, useGameStats, useGamePlayHistory, useGameTopPerformers } from "@/lib/queries/games";
import type { PlayHistoryEntry, TopPerformer } from "@/lib/queries/games";
import { getRelativeTime, formatDate } from "@/lib/utils/dates";
import { getScoringLabel, getGameScoringMode, isGameScoringType } from "@/lib/utils/game-rules";
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

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

function TopPerformerDisplay({
  leaders,
  isPlacement,
  showAll,
  onToggleShowAll,
}: {
  leaders: TopPerformer[];
  isPlacement: boolean;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const isTied = leaders.length > 1;
  const INITIAL_LEADER_LIMIT = 3;
  const displayLeaders = showAll ? leaders : leaders.slice(0, INITIAL_LEADER_LIMIT);
  const metricLabel = isPlacement ? "1st place" : (leaders[0]?.primary_count === 1 ? "win" : "wins");
  const metricLabelPlacement = leaders[0]?.primary_count === 1 ? "1st place" : "1st places";

  return (
    <div>
      {displayLeaders.map((leader, idx) => (
        <div
          key={leader.participant_key}
          className={cn(
            "flex items-center gap-3 py-2.5",
            idx > 0 && "border-t border-gray-100"
          )}
        >
          {/* Avatar / medal */}
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            {idx === 0 && !isTied ? (
              <Trophy className="h-[18px] w-[18px] text-amber-500" />
            ) : (
              <Medal className="h-[18px] w-[18px] text-amber-400" />
            )}
          </div>

          {/* Name + stat */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 truncate">
              {leader.display_name}
            </p>
            <p className="text-[13px] text-gray-500">
              {leader.primary_count} {isPlacement ? metricLabelPlacement : metricLabel}
              {isPlacement && leader.podium_count > leader.primary_count && (
                <span className="text-gray-400">
                  {" · "}{leader.podium_count} podium
                </span>
              )}
            </p>
          </div>

          {/* Tie badge */}
          {isTied && idx === 0 && (
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
              Tied for #1
            </span>
          )}
        </div>
      ))}

      {/* See all co-leaders */}
      {leaders.length > INITIAL_LEADER_LIMIT && (
        <button
          onClick={onToggleShowAll}
          className="w-full mt-1 pt-2.5 border-t border-gray-100 flex items-center justify-center gap-1 text-[15px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
        >
          {showAll ? (
            <>
              Show less
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              See all ({leaders.length} tied)
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const { data: game, isLoading: gameLoading } = useGameById(gameId);
  const { data: stats, isLoading: statsLoading } = useGameStats(gameId);
  const { data: playHistory, isLoading: historyLoading } =
    useGamePlayHistory(gameId);
  const { data: topPerformers, isLoading: performersLoading } =
    useGameTopPerformers(gameId, game?.scoring_type ?? null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAllLeaders, setShowAllLeaders] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const INITIAL_HISTORY_LIMIT = 6;
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
                    {getScoringLabel(game.scoring_type)}
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

            {/* Top Performer section */}
            <div className="mt-4">
              <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[17px] font-semibold text-gray-900 mb-3">
                  Top Performer
                </h3>

                {performersLoading ? (
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-10 w-10 !rounded-full shrink-0" />
                    <div className="flex-1">
                      <SkeletonBlock className="h-4 w-28 mb-1.5" />
                      <SkeletonBlock className="h-3 w-20" />
                    </div>
                  </div>
                ) : !topPerformers || topPerformers.leaders.length === 0 ? (
                  <div className="py-3 text-center">
                    <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-[15px] text-gray-400">
                      No results yet.
                    </p>
                  </div>
                ) : (
                  <TopPerformerDisplay
                    leaders={topPerformers.leaders}
                    isPlacement={isGameScoringType(game.scoring_type) && getGameScoringMode(game.scoring_type) === "placement"}
                    showAll={showAllLeaders}
                    onToggleShowAll={() => setShowAllLeaders(!showAllLeaders)}
                  />
                )}
              </div>
            </div>

            {/* Play History section */}
            <div className="mt-3">
              <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-[17px] font-semibold text-gray-900 mb-3">
                  Play History
                </h3>

                {historyLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <SkeletonBlock className="h-10 w-10 !rounded-[10px] shrink-0" />
                        <div className="flex-1">
                          <SkeletonBlock className="h-4 w-28 mb-1.5" />
                          <SkeletonBlock className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !playHistory || playHistory.length === 0 ? (
                  <div className="py-4 text-center">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-[15px] text-gray-400">
                      No plays recorded yet.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-0">
                      {(showAllHistory
                        ? playHistory
                        : playHistory.slice(0, INITIAL_HISTORY_LIMIT)
                      ).map((entry: PlayHistoryEntry, idx: number) => (
                        <div
                          key={entry.session_id}
                          className={cn(
                            "flex items-center gap-3 py-3",
                            idx > 0 && "border-t border-gray-100"
                          )}
                        >
                          {/* Date icon tile */}
                          <div className="h-10 w-10 rounded-[10px] bg-gray-100 flex items-center justify-center shrink-0">
                            <Calendar className="h-[18px] w-[18px] text-gray-400" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-gray-900 truncate">
                              {entry.meetup_title}
                            </p>
                            <p className="text-[13px] text-gray-500">
                              {formatDate(entry.meetup_date)}
                              {" · "}
                              {getRelativeTime(entry.finalized_at ?? entry.played_at)}
                            </p>
                          </div>

                          {/* Winner badge */}
                          <div className="shrink-0 text-right">
                            {entry.winner_name ? (
                              <div className="flex items-center gap-1 text-[13px] font-medium text-amber-600">
                                <Trophy className="h-3.5 w-3.5" />
                                <span className="max-w-[80px] truncate">
                                  {entry.winner_name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[13px] text-gray-400">
                                <User className="h-3.5 w-3.5" />
                                <span>No winner</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* See more / See less */}
                    {playHistory.length > INITIAL_HISTORY_LIMIT && (
                      <button
                        onClick={() => setShowAllHistory(!showAllHistory)}
                        className="w-full mt-2 pt-3 border-t border-gray-100 flex items-center justify-center gap-1 text-[15px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
                      >
                        {showAllHistory ? (
                          <>
                            Show less
                            <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            See more ({playHistory.length - INITIAL_HISTORY_LIMIT} more)
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
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
