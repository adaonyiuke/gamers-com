"use client";

import { useState } from "react";
import { Gamepad2, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const INITIAL_LIMIT = 6;

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

function getSessionWinnerName(session: Record<string, unknown>) {
  const entries = session.score_entries as Record<string, unknown>[] | null;
  const winnerEntry = entries?.find((e) => e.is_winner);
  if (!winnerEntry) return null;
  const participant = winnerEntry.meetup_participants as Record<string, unknown> | null;
  const gm = participant?.group_members as { display_name: string } | null;
  const g = participant?.guests as { name: string } | null;
  return gm?.display_name ?? g?.name ?? null;
}

interface GamesSectionProps {
  sessions: Record<string, unknown>[] | undefined;
  isLoading: boolean;
}

export function GamesSection({ sessions, isLoading }: GamesSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const total = sessions?.length ?? 0;
  const showToggle = total > INITIAL_LIMIT;
  const displayed = expanded ? sessions : sessions?.slice(0, INITIAL_LIMIT);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
          Games Played{!isLoading && total > 0 ? ` (${total})` : ""}
        </p>
        {showToggle && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-[13px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
          >
            {expanded ? (
              <>
                See less
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                See more
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Card */}
      <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBlock className="h-10 w-10 rounded-[10px]" />
                <div className="space-y-2 flex-1">
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="p-8 text-center">
            <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-[15px] text-gray-500">
              No games recorded yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayed?.map((session) => {
              const games = session.games as { name: string } | null;
              const gameName = games?.name ?? "Unknown Game";
              const winnerName = getSessionWinnerName(session);
              const entries = session.score_entries as Record<string, unknown>[] | null;
              const topScores = entries
                ?.slice()
                .sort(
                  (a, b) =>
                    ((b.score as number) ?? 0) - ((a.score as number) ?? 0)
                )
                .slice(0, 3);

              return (
                <div key={session.id as string} className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[10px] bg-indigo-100 flex items-center justify-center">
                      <Gamepad2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-semibold text-gray-900 truncate">
                        {gameName}
                      </p>
                      {winnerName ? (
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-amber-500" />
                          <p className="text-[13px] text-gray-500">
                            {winnerName}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[13px] text-gray-400">
                          In progress
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Score summary */}
                  {topScores && topScores.length > 0 && (
                    <div className="mt-2 ml-[52px] flex flex-wrap gap-2">
                      {topScores.map((entry) => {
                        const participant = entry.meetup_participants as Record<string, unknown> | null;
                        const gm = participant?.group_members as { display_name: string } | null;
                        const g = participant?.guests as { name: string } | null;
                        const pName = gm?.display_name ?? g?.name ?? "?";
                        return (
                          <span
                            key={entry.id as string}
                            className={cn(
                              "text-[12px] px-2 py-0.5 rounded-full",
                              entry.is_winner
                                ? "bg-amber-100 text-amber-700 font-semibold"
                                : "bg-gray-100 text-gray-500"
                            )}
                          >
                            {pName}: {(entry.score as number) ?? "-"}
                          </span>
                        );
                      })}
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
