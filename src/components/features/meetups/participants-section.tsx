"use client";

import { useState } from "react";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const INITIAL_LIMIT = 4;

const getName = (p: Record<string, unknown>) => {
  const gm = p.group_members as { display_name: string } | null;
  const g = p.guests as { name: string } | null;
  return gm?.display_name ?? g?.name ?? "Unknown";
};

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

interface ParticipantsSectionProps {
  participants: Record<string, unknown>[] | undefined;
  isLoading: boolean;
}

export function ParticipantsSection({
  participants,
  isLoading,
}: ParticipantsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const total = participants?.length ?? 0;
  const showToggle = total > INITIAL_LIMIT;
  const displayed = expanded
    ? participants
    : participants?.slice(0, INITIAL_LIMIT);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
          Participants{!isLoading && total > 0 ? ` (${total})` : ""}
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
            {displayed?.map((p: Record<string, unknown>) => {
              const name = getName(p);
              const isGuest = !!p.guest_id;
              return (
                <div
                  key={p.id as string}
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
  );
}
