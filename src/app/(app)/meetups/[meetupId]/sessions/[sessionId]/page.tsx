"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Clock,
  CheckCircle2,
  Gamepad2,
  Play,
  X,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useGroupId } from "@/components/providers/group-provider";
import { useMeetupSessions } from "@/lib/queries/sessions";
import { useMeetup, useMeetups } from "@/lib/queries/meetups";
import { formatDateLong, formatDate } from "@/lib/utils/dates";
import { getScoringLabel } from "@/lib/utils/game-rules";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

const AVATAR_COLORS = [
  "#007AFF", "#FF9500", "#FF2D55", "#5856D6",
  "#34C759", "#AF52DE", "#FF3B30", "#00C7BE",
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const getName = (entry: any) =>
  entry.meetup_participants?.group_members?.display_name ??
  entry.meetup_participants?.guests?.name ??
  "Unknown";

const getEntryAvatarColor = (entry: any, name: string): string => {
  const avatarUrl =
    entry.meetup_participants?.group_members?.avatar_url ??
    entry.meetup_participants?.guests?.avatar_url;
  return avatarUrl ?? getAvatarColor(name);
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const meetupId = params.meetupId as string;
  const sessionId = params.sessionId as string;

  const { groupId } = useGroupId();
  const { data: sessions, isLoading, isError } = useMeetupSessions(meetupId);
  const { data: meetup } = useMeetup(meetupId);
  const { data: meetups } = useMeetups(groupId);

  const [showNoMeetupModal, setShowNoMeetupModal] = useState(false);

  const activeMeetup = useMemo(() => {
    if (!meetups) return null;
    return meetups.find((m: any) => m.status === "active") ?? null;
  }, [meetups]);

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

  function handlePlayAgain() {
    if (!session?.game_id) return;
    if (activeMeetup) {
      router.push(
        `/meetups/${activeMeetup.id}/sessions/new?gameId=${session.game_id}`
      );
    } else {
      setShowNoMeetupModal(true);
    }
  }

  if (isError) {
    return (
      <div className="pb-28">
        <PageHeader title="Session" backLabel="Meetup" backHref={`/meetups/${meetupId}`} variant="large" />
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
      <PageHeader
        title={
          isLoading
            ? ""
            : session?.games?.name ?? "Session"
        }
        backLabel="Meetup"
        backHref={`/meetups/${meetupId}`}
        variant="large"
      >
        {!isLoading && (meetup || session?.played_at) && (
          <div className="flex items-center gap-3 mt-1 text-[15px] text-gray-500">
            {meetup?.title && <span>{meetup.title}</span>}
            {meetup?.title && session?.played_at && (
              <span className="text-gray-300">·</span>
            )}
            {session?.played_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(session.played_at)}</span>
              </div>
            )}
          </div>
        )}
      </PageHeader>

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
                    Scoring: {getScoringLabel(session.games.scoring_type)}
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
                      const initial = participantName.charAt(0).toUpperCase();
                      const avatarColor = getEntryAvatarColor(entry, participantName);

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
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[15px] font-semibold"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {initial}
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
                            {entry.score != null ? entry.score : "\u2014"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Play Again */}
            {isFinalized && (
              <button
                onClick={handlePlayAgain}
                className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
              >
                <Play className="h-5 w-5" />
                Play Again
              </button>
            )}
          </>
        )}
      </div>

      {/* No Active Meetup Modal */}
      {showNoMeetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowNoMeetupModal(false)}
          />
          <div className="relative w-full max-w-[400px] bg-white rounded-[24px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-bold text-gray-900">
                No Active Meetup
              </h3>
              <button
                onClick={() => setShowNoMeetupModal(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-[15px] text-gray-500 mb-6">
              You need an active meetup to record a game. Create a new meetup to
              get started.
            </p>
            <div className="space-y-3">
              <Link
                href="/meetups/new"
                onClick={() => setShowNoMeetupModal(false)}
                className="block w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold text-center active:scale-[0.98] transition-transform"
              >
                Create Meetup
              </Link>
              <button
                onClick={() => setShowNoMeetupModal(false)}
                className="w-full bg-gray-100 text-gray-700 rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
