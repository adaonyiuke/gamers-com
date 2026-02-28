"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  Users,
  Trash2,
  Check,
  Ellipsis,
  Gamepad2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import {
  useMeetups,
  useSoftDeleteMeetups,
  useMeetupParticipants,
  useMeetupGamesCount,
} from "@/lib/queries/meetups";
import { useCurrentMemberRole } from "@/lib/queries/members";
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
  const { data: role } = useCurrentMemberRole(groupId);
  const softDelete = useSoftDeleteMeetups();

  const [filter, setFilter] = useState<Filter>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showMenu]);

  const isLoading = groupLoading || meetupsLoading;
  const isAdmin = role === "admin" || role === "owner";
  const hasMeetups = !!meetups && meetups.length > 0;

  const filteredMeetups = useMemo(() => {
    if (!meetups) return [];

    if (filter === "upcoming") {
      return meetups
        .filter(
          (m: Record<string, unknown>) =>
            m.status === "planned" || m.status === "active"
        )
        .sort(
          (a: Record<string, unknown>, b: Record<string, unknown>) =>
            new Date(a.date as string).getTime() -
            new Date(b.date as string).getTime()
        );
    }

    if (filter === "completed") {
      return meetups.filter(
        (m: Record<string, unknown>) => m.status === "complete"
      );
      // Already date DESC from query
    }

    // "all" — date DESC from query
    return meetups;
  }, [meetups, filter]);

  const statusPill = (status: string) => {
    const base =
      "text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full";
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

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Completed", value: "completed" },
  ];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setShowConfirm(false);
  };

  const handleDeleteConfirmed = async () => {
    if (selectedIds.size === 0) return;
    try {
      await softDelete.mutateAsync({ meetupIds: Array.from(selectedIds) });
      exitSelectMode();
    } catch {
      // Error handled by mutation state
    }
  };

  const emptyState = () => {
    if (!hasMeetups) {
      return (
        <div className="flex flex-col items-center justify-center pt-24">
          <CalendarDays className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-[17px] font-semibold text-gray-400 mb-1">
            No meetups yet
          </p>
          <p className="text-[15px] text-gray-400 text-center max-w-[260px]">
            Tap the + button to schedule your first game night.
          </p>
        </div>
      );
    }

    if (filter === "upcoming") {
      return (
        <div className="flex flex-col items-center justify-center pt-24">
          <Sparkles className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-[17px] font-semibold text-gray-400 mb-1">
            Nothing on the horizon
          </p>
          <p className="text-[15px] text-gray-400 text-center max-w-[260px]">
            All caught up! Schedule a new meetup when you&apos;re ready.
          </p>
        </div>
      );
    }

    if (filter === "completed") {
      return (
        <div className="flex flex-col items-center justify-center pt-24">
          <CheckCircle2 className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-[17px] font-semibold text-gray-400 mb-1">
            No completed meetups
          </p>
          <p className="text-[15px] text-gray-400 text-center max-w-[260px]">
            Completed meetups will appear here after you wrap up a game night.
          </p>
        </div>
      );
    }

    return null;
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
        <div className="flex items-center justify-between">
          <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
            Meetups
          </h1>
          {isAdmin && !selectMode && filteredMeetups.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="h-9 w-9 rounded-full bg-gray-200/80 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Ellipsis className="h-5 w-5 text-gray-600" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-11 bg-white rounded-[14px] shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-hidden min-w-[160px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setSelectMode(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-gray-900 active:bg-gray-50 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    Select
                  </button>
                </div>
              )}
            </div>
          )}
          {selectMode && (
            <button
              onClick={exitSelectMode}
              className="text-[15px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Segmented control */}
        {!selectMode && (
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
        )}

        {/* Select mode toolbar */}
        {selectMode && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-[15px] text-gray-500">
              {selectedIds.size === 0
                ? "Select meetups to delete"
                : `${selectedIds.size} selected`}
            </p>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={selectedIds.size === 0 || softDelete.isPending}
              className={cn(
                "flex items-center gap-1.5 text-[15px] font-semibold text-red-500 active:opacity-60 transition-opacity",
                (selectedIds.size === 0 || softDelete.isPending) && "opacity-40"
              )}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
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
          emptyState()
        ) : (
          /* Meetup list */
          <div className="space-y-3">
            {filteredMeetups.map((meetup: Record<string, unknown>) => (
              <MeetupCard
                key={meetup.id as string}
                meetup={meetup}
                statusPill={statusPill}
                selectMode={selectMode}
                isSelected={selectedIds.has(meetup.id as string)}
                onToggleSelect={() => toggleSelect(meetup.id as string)}
              />
            ))}
          </div>
        )}

        {/* Delete error */}
        {softDelete.isError && (
          <div className="bg-red-50 rounded-[14px] px-4 py-3 mt-4">
            <p className="text-red-600 text-[15px]">
              Failed to delete meetups. Please try again.
            </p>
          </div>
        )}
      </div>

      {/* FAB — hidden in select mode */}
      {!selectMode && (
        <Link
          href="/meetups/new"
          className="fixed bottom-24 right-5 z-50 w-14 h-14 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-[0.94] transition-transform"
        >
          <Plus className="h-7 w-7 text-white" />
        </Link>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative w-full max-w-[430px] mx-5 mb-8 space-y-2">
            <div className="bg-white rounded-[14px] overflow-hidden">
              <div className="px-4 pt-5 pb-3 text-center">
                <p className="text-[13px] text-gray-500">
                  Delete {selectedIds.size}{" "}
                  {selectedIds.size === 1 ? "meetup" : "meetups"}? This can be
                  undone by an administrator.
                </p>
              </div>
              <button
                onClick={handleDeleteConfirmed}
                disabled={softDelete.isPending}
                className="w-full py-3.5 text-[17px] font-semibold text-red-500 border-t border-gray-200 active:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {softDelete.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full py-3.5 text-[17px] font-semibold text-[#007AFF] bg-white rounded-[14px] active:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MeetupCard({
  meetup,
  statusPill,
  selectMode,
  isSelected,
  onToggleSelect,
}: {
  meetup: Record<string, unknown>;
  statusPill: (status: string) => React.ReactNode;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const meetupId = meetup.id as string;
  const isComplete = meetup.status === "complete";
  const { data: participants } = useMeetupParticipants(meetupId);
  const { data: gamesCount } = useMeetupGamesCount(meetupId);

  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3
          className={cn(
            "text-[17px] font-semibold truncate flex-1 mr-3",
            isComplete ? "text-gray-500" : "text-gray-900"
          )}
        >
          {meetup.title as string}
        </h3>
        {statusPill(meetup.status as string)}
      </div>
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-[15px]",
            isComplete ? "text-gray-400" : "text-gray-500"
          )}
        >
          {formatDate(meetup.date as string)}
        </p>
        <div
          className={cn(
            "flex items-center gap-3",
            isComplete ? "text-gray-300" : "text-gray-400"
          )}
        >
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[13px] font-medium">
              {participants?.length ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Gamepad2 className="h-3.5 w-3.5" />
            <span className="text-[13px] font-medium">{gamesCount ?? 0}</span>
          </div>
        </div>
      </div>
    </>
  );

  if (selectMode) {
    return (
      <button
        onClick={onToggleSelect}
        className={cn(
          "w-full text-left rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.97] active:bg-gray-50 transition-all duration-150 flex items-start gap-3",
          isComplete ? "bg-white/70" : "bg-white",
          isSelected && "ring-2 ring-[#007AFF]"
        )}
      >
        <div
          className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center border-2 mt-0.5 shrink-0 transition-colors",
            isSelected
              ? "bg-[#007AFF] border-[#007AFF]"
              : "border-gray-300"
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">{cardContent}</div>
      </button>
    );
  }

  return (
    <Link
      href={`/meetups/${meetupId}`}
      className={cn(
        "block rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.97] active:bg-gray-50 transition-all duration-150",
        isComplete ? "bg-white/70" : "bg-white"
      )}
    >
      {cardContent}
    </Link>
  );
}
