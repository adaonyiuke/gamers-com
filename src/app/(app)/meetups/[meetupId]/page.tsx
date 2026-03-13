"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  Play,
  CheckCircle2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
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

  const router = useRouter();
  const [showInactiveModal, setShowInactiveModal] = useState(false);

  const isLoading = meetupLoading;
  const isAdmin = role === "admin" || role === "owner";

  function handleRecordGame() {
    if (meetup?.status === "active") {
      router.push(`/meetups/${meetupId}/sessions/new`);
    } else {
      setShowInactiveModal(true);
    }
  }

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
      <PageHeader title="Meetup" backLabel="Meetups" backHref="/meetups" />

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
          <button
            onClick={handleRecordGame}
            className={cn(
              "w-full rounded-[14px] py-4 text-[17px] font-semibold transition-all",
              meetup.status === "active"
                ? "bg-[#007AFF] text-white active:scale-[0.98]"
                : "bg-[#007AFF]/30 text-white/60 cursor-default"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Record Game
            </span>
          </button>
        )}

        {/* Inactive meetup modal */}
        {showInactiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowInactiveModal(false)}
            />
            <div className="relative w-full max-w-[400px] bg-white rounded-[24px] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-bold text-gray-900">
                  Meetup Not Started
                </h3>
                <button
                  onClick={() => setShowInactiveModal(false)}
                  className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <p className="text-[15px] text-gray-500 mb-6">
                You can't record games until the meetup is active. Start the meetup to begin recording.
              </p>
              {isAdmin && (
                <button
                  onClick={async () => {
                    setShowInactiveModal(false);
                    await handleStatusUpdate("active");
                  }}
                  disabled={updateStatus.isPending}
                  className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 mb-3"
                >
                  {updateStatus.isPending ? "Starting..." : "Start Meetup"}
                </button>
              )}
              <button
                onClick={() => setShowInactiveModal(false)}
                className="w-full bg-gray-100 text-gray-700 rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
              >
                Dismiss
              </button>
            </div>
          </div>
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
