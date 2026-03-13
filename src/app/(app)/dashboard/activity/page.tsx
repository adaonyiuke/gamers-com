"use client";

import Link from "next/link";
import { Gamepad2, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useGroupId } from "@/components/providers/group-provider";
import { useRecentMeetupSessions } from "@/lib/queries/sessions";
import { formatDate, getRelativeTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function ActivityPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: meetupGroups, isLoading: sessionsLoading } =
    useRecentMeetupSessions(groupId);

  const isLoading = groupLoading || sessionsLoading;

  return (
    <div className="pb-28">
      <PageHeader
        title="Recent Activity"
        backLabel="Dashboard"
        backHref="/dashboard"
        variant="large"
      />

      <div className="px-5 space-y-5 mt-2">
        {isLoading ? (
          <div className="space-y-5">
            {[0, 1].map((i) => (
              <div key={i}>
                <SkeletonBlock className="h-4 w-36 mb-2" />
                <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 space-y-4">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <SkeletonBlock className="h-10 w-10 rounded-[10px]" />
                      <div className="space-y-2 flex-1">
                        <SkeletonBlock className="h-4 w-32" />
                        <SkeletonBlock className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !meetupGroups || meetupGroups.length === 0 ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 text-center">
            <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-[15px] text-gray-500">
              No sessions recorded yet. Start a meetup to get going!
            </p>
          </div>
        ) : (
          meetupGroups.map((group: any) => {
            if (group.sessions.length === 0) return null;
            return (
              <div key={group.meetup.id}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                    {group.meetup.title}
                  </p>
                  <p className="text-[12px] text-gray-400">
                    {formatDate(group.meetup.date)}
                  </p>
                </div>
                <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {group.sessions.map((session: any) => {
                      const gameName =
                        session.games?.name ?? "Unknown Game";
                      const winnerEntry = session.score_entries?.find(
                        (e: any) => e.is_winner
                      );
                      const winnerName = winnerEntry
                        ? winnerEntry.meetup_participants?.group_members
                            ?.display_name ??
                          winnerEntry.meetup_participants?.guests?.name ??
                          "Unknown"
                        : null;
                      return (
                        <Link
                          key={session.id}
                          href={`/meetups/${session.meetup_id}/sessions/${session.id}`}
                          className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
                        >
                          <div className="h-10 w-10 rounded-[10px] bg-indigo-100 flex items-center justify-center shrink-0">
                            <Gamepad2 className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-gray-900 truncate">
                              {gameName}
                            </p>
                            <p className="text-[13px] text-gray-500">
                              {winnerName
                                ? `Won by ${winnerName}`
                                : "In progress"}
                            </p>
                          </div>
                          {(session.finalized_at || session.played_at) && (
                            <p className="text-[13px] text-gray-400 shrink-0">
                              {getRelativeTime(
                                session.finalized_at ?? session.played_at
                              )}
                            </p>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
