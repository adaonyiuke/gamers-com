"use client";

import { useState, useMemo } from "react";
import { Search, Archive, ArchiveRestore, Trash2, Gamepad2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GameTile } from "@/components/features/games/game-tile";
import { useGroupId } from "@/components/providers/group-provider";
import {
  useGamesWithStats,
  useArchiveGame,
  useUnarchiveGame,
  useDeleteGame,
} from "@/lib/queries/games";
import { filterGamesBySearch } from "@/lib/utils/game-sorting";
import { getScoringLabel } from "@/lib/utils/game-rules";
import { cn } from "@/lib/utils/cn";

type Tab = "active" | "archived";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function ManageGamesPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: allGames, isLoading: gamesLoading } = useGamesWithStats(
    groupId,
    { includeArchived: true }
  );
  const archiveGame = useArchiveGame();
  const unarchiveGame = useUnarchiveGame();
  const deleteGame = useDeleteGame();

  const [tab, setTab] = useState<Tab>("active");
  const [searchText, setSearchText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isLoading = groupLoading || gamesLoading;

  // Split games into active / archived, then apply search
  const activeGames = useMemo(() => {
    if (!allGames) return [];
    const active = allGames.filter((g) => !g.archived_at);
    return filterGamesBySearch(active, searchText);
  }, [allGames, searchText]);

  const archivedGames = useMemo(() => {
    if (!allGames) return [];
    const archived = allGames.filter((g) => !!g.archived_at);
    return filterGamesBySearch(archived, searchText);
  }, [allGames, searchText]);

  const displayedGames = tab === "active" ? activeGames : archivedGames;

  function handleArchive(gameId: string) {
    archiveGame.mutate(gameId);
  }

  function handleUnarchive(gameId: string) {
    unarchiveGame.mutate(gameId);
  }

  function handleDelete(gameId: string) {
    setDeleteError(null);
    deleteGame.mutate(gameId, {
      onError: (err) => {
        setDeleteError(
          err instanceof Error ? err.message : "Failed to delete game."
        );
        setConfirmDeleteId(gameId);
      },
      onSuccess: () => {
        setConfirmDeleteId(null);
      },
    });
  }

  return (
    <div className="pb-36">
      <PageHeader
        title="Manage Games"
        backLabel="Game Settings"
        backHref="/settings/games"
        centeredTitle
      />

      <div className="px-5 mt-4 space-y-4">
        {/* Segment control */}
        <div className="flex bg-gray-200/70 rounded-[10px] p-[3px]">
          {(["active", "archived"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 text-[13px] font-semibold rounded-[8px] transition-all text-center capitalize",
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              )}
            >
              {t === "active"
                ? `Active${!isLoading && allGames ? ` (${allGames.filter((g) => !g.archived_at).length})` : ""}`
                : `Archived${!isLoading && allGames ? ` (${allGames.filter((g) => !!g.archived_at).length})` : ""}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-white rounded-[14px] pl-10 pr-4 py-3 text-[15px] border border-gray-200 focus:border-[#007AFF] focus:outline-none"
          />
        </div>

        {/* Game list */}
        {isLoading ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-gray-100">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <SkeletonBlock className="h-10 w-10 !rounded-[8px]" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedGames.length === 0 ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10 text-center">
            {tab === "active" && searchText ? (
              <>
                <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[17px] font-semibold text-gray-900 mb-1">
                  No matches
                </p>
                <p className="text-[15px] text-gray-500">
                  Try a different search term.
                </p>
              </>
            ) : tab === "archived" ? (
              <>
                <Archive className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[17px] font-semibold text-gray-900 mb-1">
                  No archived games
                </p>
                <p className="text-[15px] text-gray-500">
                  Games you archive will appear here.
                </p>
              </>
            ) : (
              <>
                <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[17px] font-semibold text-gray-900 mb-1">
                  No games yet
                </p>
                <p className="text-[15px] text-gray-500">
                  Add games from the Games tab to get started.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-gray-100">
            {displayedGames.map((game, idx) => {
              const abbr =
                game.abbreviation ||
                game.name.substring(0, 2).toUpperCase();
              const hasPlayHistory = game.play_count > 0;
              const isDeleting =
                deleteGame.isPending &&
                deleteGame.variables === game.id;
              const isArchiving =
                (archiveGame.isPending &&
                  archiveGame.variables === game.id) ||
                (unarchiveGame.isPending &&
                  unarchiveGame.variables === game.id);

              return (
                <div key={game.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Tile */}
                    <div className="shrink-0">
                      <GameTile
                        thumbnailUrl={game.thumbnail_url}
                        imageUrl={game.image_url}
                        imageStatus={game.image_status}
                        abbreviation={abbr}
                        colorIndex={idx}
                        size="sm"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-semibold text-gray-900 truncate">
                        {game.name}
                      </p>
                      <p className="text-[13px] text-gray-500">
                        {getScoringLabel(game.scoring_type)}
                        {game.play_count > 0 &&
                          ` \u00b7 ${game.play_count} played`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {tab === "active" ? (
                        <button
                          onClick={() => handleArchive(game.id)}
                          disabled={isArchiving}
                          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-40"
                          title="Archive"
                        >
                          <Archive className="h-[18px] w-[18px]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnarchive(game.id)}
                          disabled={isArchiving}
                          className="h-9 w-9 rounded-full flex items-center justify-center text-[#007AFF] hover:bg-blue-50 active:bg-blue-100 transition-colors disabled:opacity-40"
                          title="Unarchive"
                        >
                          <ArchiveRestore className="h-[18px] w-[18px]" />
                        </button>
                      )}
                      {!hasPlayHistory && (
                        <button
                          onClick={() => {
                            if (confirmDeleteId === game.id) {
                              handleDelete(game.id);
                            } else {
                              setConfirmDeleteId(game.id);
                              setDeleteError(null);
                            }
                          }}
                          disabled={isDeleting}
                          className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40",
                            confirmDeleteId === game.id
                              ? "bg-red-50 text-red-500"
                              : "text-gray-400 hover:bg-gray-100 active:bg-gray-200"
                          )}
                          title={
                            confirmDeleteId === game.id
                              ? "Tap again to confirm"
                              : "Delete"
                          }
                        >
                          <Trash2 className="h-[18px] w-[18px]" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delete confirmation hint */}
                  {confirmDeleteId === game.id && (
                    <div className="px-4 pb-3 -mt-1">
                      {deleteError ? (
                        <p className="text-[13px] text-red-500">
                          {deleteError}
                        </p>
                      ) : (
                        <p className="text-[13px] text-red-500">
                          Tap the delete button again to permanently remove
                          this game.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
