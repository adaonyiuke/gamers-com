"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Gamepad2, Plus, Search, SlidersHorizontal, Check } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useGamesWithStats } from "@/lib/queries/games";
import { sortGames, filterGamesBySearch } from "@/lib/utils/game-sorting";
import type { SortMode, QuickFilter } from "@/lib/utils/game-sorting";
import { getRelativeTime } from "@/lib/utils/dates";
import { getScoringLabel } from "@/lib/utils/game-rules";
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

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "recent", label: "Recently Played" },
  { key: "most", label: "Most Played" },
  { key: "least", label: "Least Played" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "name", label: "Name (Ascending)" },
  { value: "name_desc", label: "Name (Descending)" },
  { value: "recent", label: "Recently Played" },
  { value: "most", label: "Most Played" },
  { value: "least", label: "Least Played" },
];

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function GamesPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: games, isLoading: gamesLoading } =
    useGamesWithStats(groupId);

  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilter>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const isLoading = groupLoading || gamesLoading;

  // Apply search + sort
  const displayedGames = useMemo(() => {
    if (!games) return [];
    const searched = filterGamesBySearch(games, searchText);
    return sortGames(searched, sortMode);
  }, [games, searchText, sortMode]);

  // Quick filter handler
  function handleQuickFilter(key: QuickFilter) {
    if (activeQuickFilter === key) {
      // Toggle off
      setActiveQuickFilter(null);
      setSortMode("name");
    } else {
      setActiveQuickFilter(key);
      setSortMode(key!);
    }
  }

  // Sort dropdown handler
  function handleSortChange(value: SortMode) {
    setSortMode(value);
    setShowSortDropdown(false);
    // Clear quick filter if user manually changes sort
    if (value === "recent") setActiveQuickFilter("recent");
    else if (value === "most") setActiveQuickFilter("most");
    else if (value === "least") setActiveQuickFilter("least");
    else setActiveQuickFilter(null);
  }

  const hasGames = games && games.length > 0;
  const noSearchResults = hasGames && displayedGames.length === 0;

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
        <div className="flex items-center justify-between">
          <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
            Games
          </h1>

          {/* Sort icon — only shown when games are loaded */}
          {!isLoading && hasGames && (
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center transition-colors active:scale-[0.95]",
                  showSortDropdown || activeQuickFilter !== null || sortMode !== "name"
                    ? "bg-[#007AFF] text-white"
                    : "bg-white text-gray-500 border border-gray-200"
                )}
              >
                <SlidersHorizontal className="h-[18px] w-[18px]" />
              </button>
              {showSortDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-[16px] shadow-lg border border-gray-100 py-1.5 min-w-[190px]">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 pt-1 pb-2">
                      Sort By
                    </p>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSortChange(opt.value)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-[15px] flex items-center justify-between transition-colors active:bg-gray-50",
                          sortMode === opt.value
                            ? "text-[#007AFF] font-semibold"
                            : "text-gray-700"
                        )}
                      >
                        {opt.label}
                        {sortMode === opt.value && (
                          <Check className="h-4 w-4 text-[#007AFF]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-2">
        {isLoading ? (
          <div>
            {/* Search skeleton */}
            <SkeletonBlock className="h-[46px] w-full !rounded-[14px] mb-3" />
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
          </div>
        ) : !hasGames ? (
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
          <>
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-white rounded-[14px] pl-10 pr-4 py-3 text-[15px] border border-gray-200 focus:border-[#007AFF] focus:outline-none"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 mb-4">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => handleQuickFilter(f.key)}
                  className={cn(
                    "flex-1 py-1.5 rounded-full text-[13px] font-medium transition-all active:scale-[0.97] text-center",
                    activeQuickFilter === f.key
                      ? "bg-[#007AFF] text-white"
                      : "bg-white text-gray-600 border border-gray-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* No search results */}
            {noSearchResults ? (
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10 text-center">
                <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[17px] font-semibold text-gray-900 mb-1">
                  No matches
                </p>
                <p className="text-[15px] text-gray-500">
                  Try a different search term.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {displayedGames.map((game, idx) => {
                  const color = TILE_COLORS[idx % TILE_COLORS.length];
                  const abbr = game.abbreviation || game.name.substring(0, 2).toUpperCase();

                  return (
                    <Link
                      key={game.id}
                      href={`/games/${game.id}`}
                      className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform block"
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
                        {getScoringLabel(game.scoring_type)}
                      </p>
                      <p className="text-[13px] text-gray-400 mt-0.5">
                        {game.play_count > 0 && game.last_played_at
                          ? `${game.play_count} Played · ${getRelativeTime(game.last_played_at)}`
                          : game.play_count > 0
                          ? `${game.play_count} Played`
                          : "Not Played"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
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
