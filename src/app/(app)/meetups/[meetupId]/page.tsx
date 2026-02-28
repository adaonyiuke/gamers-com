"use client";

import { use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Gamepad2,
  Play,
  CheckCircle2,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useMeetup, useMeetupParticipants, useUpdateMeetupStatus } from "@/lib/queries/meetups";
import { useMeetupSessions } from "@/lib/queries/sessions";
import { useCurrentMemberRole } from "@/lib/queries/members";
import { cn } from "@/lib/utils/cn";
import { MeetupHeaderCard } from "@/components/features/meetups/meetup-header-card";
import { ParticipantsSection } from "@/components/features/meetups/participants-section";
import { GamesSection } from "@/components/features/meetups/games-section";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function MeetupDetailPage({
  params,
}: {
  params: Promise<{ meetupId: string }>;
}) {
  const { meetupId } = use(params);
  const { groupId } = useGroupId();
  const { data: meetup, isLoading: meetupLoading } = useMeetup(meetupId);
  const { data: participants, isLoading: participantsLoading } =
    useMeetupParticipants(meetupId);
  const { data: sessions, isLoading: sessionsLoading } =
    useMeetupSessions(meetupId);
  const updateStatus = useUpdateMeetupStatus();
  const { data: role } = useCurrentMemberRole(groupId);

  const isLoading = meetupLoading;
  const isAdmin = role === "admin" || role === "owner";

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
        <div className="flex items-center gap-2">
          <Link
            href="/meetups"
            className="flex items-center text-[#007AFF] -ml-1.5"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="text-[17px]">Meetups</span>
          </Link>
        </div>
      </div>

      <div className="px-5 mt-2 space-y-5">
        {/* Header card */}
        {isLoading ? (
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <SkeletonBlock className="h-7 w-48 mb-3" />
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-7 w-20 rounded-full" />
              <SkeletonBlock className="h-5 w-40" />
            </div>
          </div>
        ) : meetup ? (
          <MeetupHeaderCard
            meetupId={meetup.id}
            title={meetup.title}
            status={meetup.status}
            date={meetup.date}
            isAdmin={isAdmin}
          />
        ) : null}

        {/* Participants */}
        <ParticipantsSection
          participants={participants as Record<string, unknown>[] | undefined}
          isLoading={participantsLoading}
        />

        {/* Games Played */}
        <GamesSection
          sessions={sessions as Record<string, unknown>[] | undefined}
          isLoading={sessionsLoading}
        />

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
