"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Users,
  Gamepad2,
  Trophy,
  Play,
  CheckCircle2,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useMeetup, useMeetupParticipants, useUpdateMeetupStatus } from "@/lib/queries/meetups";
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

const getName = (p: any) =>
  p.group_members?.display_name ?? p.guests?.name ?? "Unknown";

export default function MeetupDetailPage({
  params,
}: {
  params: Promise<{ meetupId: string }>;
}) {
  const { meetupId } = use(params);
  const router = useRouter();
  const { groupId } = useGroupId();
  const { data: meetup, isLoading: meetupLoading } = useMeetup(meetupId);
  const { data: participants, isLoading: participantsLoading } =
    useMeetupParticipants(meetupId);
  const { data: sessions, isLoading: sessionsLoading } =
    useMeetupSessions(meetupId);
  const updateStatus = useUpdateMeetupStatus();

  const isLoading = meetupLoading;

  const statusBadge = (status: string) => {
    const base =
      "text-[13px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full";
    if (status === "planned")
      return (
        <span className={cn(base, "bg-blue-100 text-[#007AFF]")}>Planned</span>
      );
    if (status === "active")
      return (
        <span className={cn(base, "bg-green-100 text-green-600")}>Active</span>
      );
    return (
      <span className={cn(base, "bg-gray-100 text-gray-500")}>Complete</span>
    );
  };

  const handleStatusUpdate = async (
    newStatus: "planned" | "active" | "complete"
  ) => {
    if (!meetupId) return;
    try {
      await updateStatus.mutateAsync({ meetupId, status: newStatus });
    } catch {
      // Error handled by mutation state
    }
  };

  const getSessionWinnerName = (session: any) => {
    const winnerEntry = session.score_entries?.find(
      (e: any) => e.is_winner
    );
    if (!winnerEntry) return null;
    return (
      winnerEntry.meetup_participants?.group_members?.display_name ??
      winnerEntry.meetup_participants?.guests?.name ??
      null
    );
  };

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
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/meetups"
            className="flex items-center text-[#007AFF] -ml-1.5"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="text-[17px]">Meetups</span>
          </Link>
        </div>
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900 truncate">
          {isLoading ? (
            <SkeletonBlock className="h-10 w-48" />
          ) : (
            meetup?.title ?? "Meetup"
          )}
        </h1>
      </div>

      <div className="px-5 mt-2 space-y-5">
        {/* Status + Date */}
        {isLoading ? (
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-7 w-20 rounded-full" />
            <SkeletonBlock className="h-5 w-40" />
          </div>
        ) : (
          meetup && (
            <div className="flex items-center gap-3">
              {statusBadge(meetup.status)}
              <p className="text-[15px] text-gray-500">
                {formatDateLong(meetup.date)}
              </p>
            </div>
          )
        )}

        {/* Participants */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Participants
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {participantsLoading ? (
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-10 w-10 rounded-full" />
                    <SkeletonBlock className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : !participants || participants.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-[15px] text-gray-500">
                  No participants added yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {participants.map((p: any) => {
                  const name = getName(p);
                  const isGuest = !!p.guest_id;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-white text-[15px] font-bold",
                          isGuest ? "bg-orange-400" : "bg-[#007AFF]"
                        )}
                      >
                        {name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[17px] font-semibold text-gray-900 truncate">
                          {name}
                        </p>
                        {isGuest && (
                          <p className="text-[13px] text-gray-400">Guest</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Games Played */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Games Played
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {sessionsLoading ? (
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
                {sessions.map((session: any) => {
                  const gameName = session.games?.name ?? "Unknown Game";
                  const winnerName = getSessionWinnerName(session);
                  const topScores = session.score_entries
                    ?.slice()
                    .sort(
                      (a: any, b: any) => (b.score ?? 0) - (a.score ?? 0)
                    )
                    .slice(0, 3);

                  return (
                    <div key={session.id} className="px-4 py-3.5">
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
                          {topScores.map((entry: any) => {
                            const pName =
                              entry.meetup_participants?.group_members
                                ?.display_name ??
                              entry.meetup_participants?.guests?.name ??
                              "?";
                            return (
                              <span
                                key={entry.id}
                                className={cn(
                                  "text-[12px] px-2 py-0.5 rounded-full",
                                  entry.is_winner
                                    ? "bg-amber-100 text-amber-700 font-semibold"
                                    : "bg-gray-100 text-gray-500"
                                )}
                              >
                                {pName}: {entry.score ?? "-"}
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

        {/* Error */}
        {updateStatus.isError && (
          <div className="bg-red-50 rounded-[14px] px-4 py-3">
            <p className="text-red-600 text-[15px]">
              Failed to update status. Please try again.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {meetup && (meetup.status === "planned" || meetup.status === "active") && (
          <Link
            href={`/meetups/${meetupId}/sessions/new`}
            className="block w-full bg-[#007AFF] text-white rounded-[14px] py-4 text-[17px] font-semibold text-center active:scale-[0.98] transition-transform"
          >
            <span className="flex items-center justify-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Record Game
            </span>
          </Link>
        )}

        {meetup?.status === "planned" && (
          <button
            onClick={() => handleStatusUpdate("active")}
            disabled={updateStatus.isPending}
            className={cn(
              "w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
              updateStatus.isPending && "opacity-50"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="h-5 w-5" />
              {updateStatus.isPending ? "Starting..." : "Start Meetup"}
            </span>
          </button>
        )}

        {meetup?.status === "active" && (
          <button
            onClick={() => handleStatusUpdate("complete")}
            disabled={updateStatus.isPending}
            className={cn(
              "w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
              updateStatus.isPending && "opacity-50"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {updateStatus.isPending ? "Completing..." : "Complete Meetup"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
