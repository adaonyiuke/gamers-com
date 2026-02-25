"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Users } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useMeetups } from "@/lib/queries/meetups";
import { useMeetupParticipants } from "@/lib/queries/meetups";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

type Filter = "all" | "upcoming" | "completed";

export default function MeetupsPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: meetups, isLoading: meetupsLoading } = useMeetups(groupId);
  const [filter, setFilter] = useState<Filter>("all");

  const isLoading = groupLoading || meetupsLoading;

  const filteredMeetups = useMemo(() => {
    if (!meetups) return [];
    if (filter === "all") return meetups;
    if (filter === "upcoming")
      return meetups.filter(
        (m: any) => m.status === "planned" || m.status === "active"
      );
    return meetups.filter((m: any) => m.status === "complete");
  }, [meetups, filter]);

  const statusPill = (status: string) => {
    const base = "text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full";
    if (status === "planned")
      return <span className={cn(base, "bg-blue-100 text-[#007AFF]")}>Planned</span>;
    if (status === "active")
      return <span className={cn(base, "bg-green-100 text-green-600")}>Active</span>;
    return <span className={cn(base, "bg-gray-100 text-gray-500")}>Complete</span>;
  };

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Completed", value: "completed" },
  ];

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
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          Meetups
        </h1>

        {/* Segmented control */}
        <div className="flex mt-3 bg-gray-200/80 rounded-[10px] p-[3px]">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex-1 py-[7px] text-[13px] font-semibold rounded-[8px] transition-all",
                filter === f.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-2">
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <SkeletonBlock className="h-5 w-40" />
                  <SkeletonBlock className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMeetups.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center pt-24">
            <CalendarDays className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-[17px] font-semibold text-gray-400 mb-1">
              No meetups yet
            </p>
            <p className="text-[15px] text-gray-400 text-center">
              Tap the + button to schedule your first game night.
            </p>
          </div>
        ) : (
          /* Meetup list */
          <div className="space-y-3">
            {filteredMeetups.map((meetup: any) => (
              <MeetupCard key={meetup.id} meetup={meetup} statusPill={statusPill} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/meetups/new"
        className="fixed bottom-24 right-5 z-50 w-14 h-14 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-[0.94] transition-transform"
      >
        <Plus className="h-7 w-7 text-white" />
      </Link>
    </div>
  );
}

function MeetupCard({
  meetup,
  statusPill,
}: {
  meetup: any;
  statusPill: (status: string) => React.ReactNode;
}) {
  const { data: participants } = useMeetupParticipants(meetup.id);

  return (
    <Link
      href={`/meetups/${meetup.id}`}
      className="block bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[17px] font-semibold text-gray-900 truncate flex-1 mr-3">
          {meetup.title}
        </h3>
        {statusPill(meetup.status)}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[15px] text-gray-500">
          {formatDate(meetup.date)}
        </p>
        <div className="flex items-center gap-1 text-gray-400">
          <Users className="h-3.5 w-3.5" />
          <span className="text-[13px] font-medium">
            {participants?.length ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
