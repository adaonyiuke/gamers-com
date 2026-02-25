"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Trophy,
  Crown,
  Clock,
  CheckCircle2,
  Gamepad2,
} from "lucide-react";
import { useMeetupSessions } from "@/lib/queries/sessions";
import { formatDateLong } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

const getName = (entry: any) =>
  entry.meetup_participants?.group_members?.display_name ??
  entry.meetup_participants?.guests?.name ??
  "Unknown";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const meetupId = params.meetupId as string;
  const sessionId = params.sessionId as string;

  const { data: sessions, isLoading, isError } = useMeetupSessions(meetupId);

  const session = useMemo(() => {
    if (!sessions) return null;
    return sessions.find((s: any) => s.id === sessionId) ?? null;
  }, [sessions, sessionId]);

  const isFinalized = session?.status === "finalized";
  const scoringType = session?.games?.scoring_type;

  const sortedEntries = useMemo(() => {
    if (!session?.score_entries) return [];
    return [...session.score_entries].sort((a: any, b: any) => {
      const aScore = a.score ?? 0;
      const bScore = b.score ?? 0;
      if (scoringType === "lowest_wins") return aScore - bScore;
      return bScore - aScore;
    });
  }, [session, scoringType]);

  const winnerEntry = useMemo(() => {
    if (!isFinalized || !sortedEntries.length) return null;
    return sortedEntries.find((e: any) => e.is_winner) ?? null;
  }, [isFinalized, sortedEntries]);

  if (isError) {
    return (
      <div className="pb-28">
        <div
          className="sticky top-0 z-40 px-5 pt-14 pb-3"
          style={{
            background: "rgba(242,242,247,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-[#007AFF] text-[17px] font-medium -ml-1 mb-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
            Session
          </h1>
        </div>
        <div className="px-5 mt-8 text-center">
          <p className="text-[17px] text-red-500">
            Failed to load session data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Glass header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[#007AFF] text-[17px] font-medium -ml-1 mb-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          {isLoading ? (
            <SkeletonBlock className="h-9 w-48 inline-block" />
          ) : (
            session?.games?.name ?? "Session"
          )}
        </h1>
      </div>

      <div className="px-5 space-y-5 mt-2">
        {isLoading ? (
          <>
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 space-y-3">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-6 w-40" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBlock className="h-8 w-8 rounded-full" />
                  <SkeletonBlock className="h-4 w-32" />
                  <div className="ml-auto">
                    <SkeletonBlock className="h-4 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : !session ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 text-center">
            <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-[15px] text-gray-500">Session not found.</p>
          </div>
        ) : (
          <>
            {/* Winner Highlight */}
            {isFinalized && winnerEntry && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-[20px] p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-yellow-700 uppercase tracking-wide">
                    Winner
                  </p>
                  <p className="text-[20px] font-bold text-gray-900">
                    {getName(winnerEntry)}
                  </p>
                </div>
              </div>
            )}

            {/* Game Info */}
            <div>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Game Info
              </p>
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[17px] font-semibold text-gray-900">
                    {session.games?.name ?? "Unknown Game"}
                  </p>
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full",
                      isFinalized
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {isFinalized ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {isFinalized ? "Finalized" : "In Progress"}
                    </span>
                  </span>
                </div>
                {session.games?.scoring_type && (
                  <p className="text-[15px] text-gray-500">
                    Scoring:{" "}
                    {scoringType === "lowest_wins"
                      ? "Lowest Wins"
                      : scoringType === "highest_wins"
                        ? "Highest Wins"
                        : scoringType}
                  </p>
                )}
                {session.played_at && (
                  <p className="text-[15px] text-gray-500">
                    Played: {formatDateLong(session.played_at)}
                  </p>
                )}
                {session.finalized_at && (
                  <p className="text-[15px] text-gray-500">
                    Finalized: {formatDateLong(session.finalized_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Scores */}
            <div>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Scores
              </p>
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                {sortedEntries.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[15px] text-gray-500">
                      No scores recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sortedEntries.map((entry: any, idx: number) => {
                      const participantName = getName(entry);
                      const initial =
                        participantName.charAt(0).toUpperCase();

                      return (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3 px-4 py-3.5"
                        >
                          <div className="w-6 text-center">
                            <span className="text-[15px] font-semibold text-gray-400">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-[15px] font-semibold text-gray-600">
                              {initial}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[17px] font-semibold text-gray-900 truncate">
                                {participantName}
                              </p>
                              {entry.is_winner && (
                                <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          <p className="text-[17px] font-bold tabular-nums text-gray-900">
                            {entry.score != null ? entry.score : "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
