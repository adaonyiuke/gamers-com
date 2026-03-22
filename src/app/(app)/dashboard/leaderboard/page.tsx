"use client";

import { useState } from "react";
import { Trophy, Gamepad2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useGroupId } from "@/components/providers/group-provider";
import { useLeaderboard, type LeaderboardEntry } from "@/lib/queries/members";
import { useGroupSettings } from "@/lib/queries/settings";
import { cn } from "@/lib/utils/cn";

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

type Period = "month" | "year" | "all";

const SEGMENTS: { label: string; value: Period }[] = [
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
];

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function LeaderboardPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const [period, setPeriod] = useState<Period>("all");
  const { data: settings } = useGroupSettings(groupId);
  const [showGuests, setShowGuests] = useState<boolean | null>(null);

  // Use group setting as default, allow local override
  const includeGuests = showGuests ?? settings?.leaderboard_include_guests ?? false;

  const { data: rawEntries, isLoading: entriesLoading } = useLeaderboard(
    groupId,
    period,
    includeGuests
  );

  const entries = rawEntries?.filter((e) => e.total_sessions > 0) ?? undefined;
  const isLoading = groupLoading || entriesLoading;

  return (
    <div className="pb-28">
      <PageHeader
        title="Leaderboard"
        backLabel="Dashboard"
        backHref="/dashboard"
        variant="large"
      />

      <div className="px-5 space-y-5 mt-2">
        {/* Segmented Control */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-[12px]">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.value}
              onClick={() => setPeriod(seg.value)}
              className={cn(
                "flex-1 py-2 text-[14px] font-semibold rounded-[10px] transition-all",
                period === seg.value
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 active:bg-gray-200"
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>

        {/* Guest toggle */}
        <button
          onClick={() => setShowGuests((prev) => !(prev ?? includeGuests))}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all",
            includeGuests
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-500"
          )}
        >
          <span className="text-[15px]">👤</span>
          Guests {includeGuests ? "ON" : "OFF"}
        </button>

        {/* Table Header */}
        <div className="flex items-center gap-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Player</span>
          <span className="w-12 text-center">
            <TrendingUp className="h-3 w-3 mx-auto" />
          </span>
          <span className="w-12 text-center">
            <Gamepad2 className="h-3 w-3 mx-auto" />
          </span>
          <span className="w-12 text-center">
            <Trophy className="h-3 w-3 mx-auto" />
          </span>
        </div>

        {/* Table Body */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBlock className="h-8 w-8 rounded-full" />
                  <SkeletonBlock className="h-4 w-28 flex-1" />
                  <SkeletonBlock className="h-4 w-10" />
                  <SkeletonBlock className="h-4 w-10" />
                  <SkeletonBlock className="h-4 w-10" />
                </div>
              ))}
            </div>
          ) : !entries || entries.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-[15px] text-gray-500">
                The arena is empty. Start playing games to see your name rise to the top of the ranks.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {entries.map((entry: LeaderboardEntry, idx: number) => {
                const avatarColor = entry.avatar_url ?? getAvatarColor(entry.display_name);
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5",
                      idx === 0 && "bg-amber-50",
                    )}
                  >
                    <div className="w-8 shrink-0 flex items-center justify-center">
                      {idx === 0 ? (
                        <span className="text-[20px]">🥇</span>
                      ) : idx === 1 ? (
                        <span className="text-[20px]">🥈</span>
                      ) : idx === 2 ? (
                        <span className="text-[20px]">🥉</span>
                      ) : (
                        <span className="text-[13px] font-semibold text-gray-400">{idx + 1}</span>
                      )}
                    </div>
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {entry.display_name[0].toUpperCase()}
                    </div>
                    <p className="flex-1 min-w-0 text-[15px] font-semibold text-gray-900 truncate">
                      {entry.display_name}
                      {entry.is_guest && (
                        <span className="ml-1.5 text-[11px] font-medium text-gray-400 align-middle">
                          GUEST
                        </span>
                      )}
                    </p>
                    <span className="w-12 text-center text-[14px] font-medium text-gray-500">
                      {entry.win_rate}%
                    </span>
                    <span className="w-12 text-center text-[14px] font-medium text-gray-500">
                      {entry.total_sessions}
                    </span>
                    <span className="w-12 text-center text-[14px] font-bold text-gray-900">
                      {entry.total_wins}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
