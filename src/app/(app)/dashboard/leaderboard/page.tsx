"use client";

import { useState, useMemo } from "react";
import { Trophy, Gamepad2, Users, TrendingUp } from "lucide-react";
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

// Circular win-rate ring around avatar
const RING = { size: 46, stroke: 3, gap: 2 };
const RADIUS = RING.size / 2 - RING.stroke / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AvatarRing({
  name,
  color,
  winRate,
}: {
  name: string;
  color: string;
  winRate: number;
}) {
  const progress = Math.min(winRate / 100, 1);
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative shrink-0" style={{ width: RING.size, height: RING.size }}>
      <svg
        className="absolute inset-0"
        width={RING.size}
        height={RING.size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={RING.size / 2}
          cy={RING.size / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(0,0,0,0.07)"
          strokeWidth={RING.stroke}
        />
        {/* Progress */}
        <circle
          cx={RING.size / 2}
          cy={RING.size / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={RING.stroke}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {/* Avatar */}
      <div
        className="absolute rounded-full flex items-center justify-center text-white text-[13px] font-bold"
        style={{
          inset: RING.stroke + RING.gap,
          backgroundColor: color,
        }}
      >
        {name[0].toUpperCase()}
      </div>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)} />
  );
}

function PodiumCard({ entries }: { entries: LeaderboardEntry[] }) {
  const first = entries[0];
  const second = entries[1] ?? null;
  const third = entries[2] ?? null;
  const color = (e: LeaderboardEntry) => e.avatar_url ?? getAvatarColor(e.display_name);
  const firstName = (e: LeaderboardEntry) => e.display_name.split(" ")[0];

  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{ background: "linear-gradient(160deg, #160728 0%, #842AEB 100%)" }}
    >
      <div className="px-5 pt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Hall of Fame
        </p>
        <p className="text-[20px] font-black text-white leading-tight">
          {firstName(first)} is on top 🔥
        </p>
      </div>

      <div className="flex items-end justify-center px-6 pt-8 gap-3">
        {/* 2nd */}
        {second ? (
          <div className="flex flex-col items-center flex-1 gap-1">
            <div
              className="h-11 w-11 rounded-full border-2 flex items-center justify-center text-white font-bold text-[16px] shrink-0"
              style={{ backgroundColor: color(second), borderColor: "rgba(255,255,255,0.25)" }}
            >
              {second.display_name[0].toUpperCase()}
            </div>
            <p className="text-white text-[12px] font-semibold text-center truncate w-full px-1">{firstName(second)}</p>
            <p className="text-white/50 text-[11px] font-medium">{second.total_wins}W</p>
            <div className="w-full h-[68px] rounded-t-[10px] flex flex-col items-center justify-center gap-1" style={{ background: "rgba(255,255,255,0.12)" }}>
              <span className="text-[26px] leading-none">🥈</span>
              <span className="text-[10px] font-bold text-white/50">2nd</span>
            </div>
          </div>
        ) : <div className="flex-1" />}

        {/* 1st */}
        <div className="flex flex-col items-center flex-1 gap-1">
          <span className="text-[22px] leading-none -mb-1">👑</span>
          <div
            className="h-[68px] w-[68px] rounded-full border-[3px] flex items-center justify-center text-white font-bold text-[24px] shrink-0"
            style={{ backgroundColor: color(first), borderColor: "#EBC31C", boxShadow: "0 0 24px rgba(235,195,28,0.5)" }}
          >
            {first.display_name[0].toUpperCase()}
          </div>
          <p className="text-white text-[13px] font-black text-center truncate w-full px-1">{firstName(first)}</p>
          <p className="text-[12px] font-bold" style={{ color: "#EBC31C" }}>{first.total_wins}W</p>
          <div
            className="w-full h-[108px] rounded-t-[10px] flex flex-col items-center justify-center gap-1"
            style={{ background: "rgba(235,195,28,0.15)", borderTop: "1px solid rgba(235,195,28,0.35)" }}
          >
            <span className="text-[34px] leading-none">🥇</span>
            <span className="text-[11px] font-black" style={{ color: "#EBC31C" }}>1st</span>
          </div>
        </div>

        {/* 3rd */}
        {third ? (
          <div className="flex flex-col items-center flex-1 gap-1">
            <div
              className="h-11 w-11 rounded-full border-2 flex items-center justify-center text-white font-bold text-[16px] shrink-0"
              style={{ backgroundColor: color(third), borderColor: "rgba(255,255,255,0.25)" }}
            >
              {third.display_name[0].toUpperCase()}
            </div>
            <p className="text-white text-[12px] font-semibold text-center truncate w-full px-1">{firstName(third)}</p>
            <p className="text-white/50 text-[11px] font-medium">{third.total_wins}W</p>
            <div className="w-full h-[68px] rounded-t-[10px] flex flex-col items-center justify-center gap-0.5" style={{ background: "rgba(255,255,255,0.07)" }}>
              <span className="text-[22px] leading-none">🥉</span>
              <span className="text-[10px] font-bold text-white/40">3rd</span>
            </div>
          </div>
        ) : <div className="flex-1" />}
      </div>
    </div>
  );
}

type SortKey = "wins" | "win_rate" | "sessions";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Wins", value: "wins" },
  { label: "Win %", value: "win_rate" },
  { label: "Games", value: "sessions" },
];

function sortEntries(entries: LeaderboardEntry[], sortKey: SortKey): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (sortKey === "win_rate") return b.win_rate - a.win_rate || b.total_wins - a.total_wins;
    if (sortKey === "sessions") return b.total_sessions - a.total_sessions || b.total_wins - a.total_wins;
    return b.total_wins - a.total_wins;
  });
}

export default function LeaderboardPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const [period, setPeriod] = useState<Period>("all");
  const { data: settings } = useGroupSettings(groupId);
  const [showGuests, setShowGuests] = useState<boolean | null>(null);
  const [sortOverride, setSortOverride] = useState<SortKey | null>(null);

  const sortKey: SortKey = sortOverride ?? (settings?.leaderboard_default_sort as SortKey) ?? "wins";
  const includeGuests = showGuests ?? settings?.leaderboard_include_guests ?? false;

  const { data: rawEntries, isLoading: entriesLoading } = useLeaderboard(
    groupId,
    period,
    includeGuests
  );

  const entries = useMemo(() => {
    const filtered = rawEntries?.filter((e) => e.total_sessions > 0);
    if (!filtered) return undefined;
    return sortEntries(filtered, sortKey);
  }, [rawEntries, sortKey]);
  const isLoading = groupLoading || entriesLoading;

  return (
    <div className="pb-28">
      <PageHeader
        title="Leaderboard"
        backLabel="Dashboard"
        backHref="/dashboard"
        variant="large"
      />

      <div className="px-5 space-y-3 mt-2">
        {/* Segmented Control */}
        <div className="flex bg-gray-200/80 rounded-[10px] p-[3px]">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.value}
              onClick={() => setPeriod(seg.value)}
              className={cn(
                "flex-1 py-[7px] text-[13px] font-semibold rounded-[8px] transition-all",
                period === seg.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>

        {/* Guest toggle — iOS switch style */}
        <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="h-[18px] w-[18px] text-gray-400" />
            <span className="text-[15px] font-medium text-gray-900">Include Guests</span>
          </div>
          <button
            onClick={() => setShowGuests((prev) => !(prev ?? includeGuests))}
            className={cn(
              "relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0",
              includeGuests ? "bg-[#161719]" : "bg-gray-200"
            )}
          >
            <div
              className={cn(
                "absolute top-[2px] h-[27px] w-[27px] bg-white rounded-full shadow-sm transition-transform duration-200",
                includeGuests ? "translate-x-[22px]" : "translate-x-[2px]"
              )}
            />
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex bg-gray-200/80 rounded-[10px] p-[3px]">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortOverride(opt.value)}
              className={cn(
                "flex-1 py-[7px] text-[13px] font-semibold rounded-[8px] transition-all",
                sortKey === opt.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading ? (
          <>
            <div className="rounded-[24px] bg-gray-200 animate-pulse h-[280px]" />
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 space-y-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBlock className="h-4 w-6 rounded" />
                  <SkeletonBlock className="h-[46px] w-[46px] rounded-full" />
                  <SkeletonBlock className="h-4 flex-1" />
                  <SkeletonBlock className="h-4 w-8" />
                  <SkeletonBlock className="h-4 w-8" />
                </div>
              ))}
            </div>
          </>
        ) : !entries || entries.length === 0 ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 text-center">
            <Trophy className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-[15px] text-gray-500">
              The arena is empty. Start playing games to see your name rise to the top.
            </p>
          </div>
        ) : (
          <>
            <PodiumCard entries={entries} />

            {/* Rankings list */}
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 px-2 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <span className="w-8 text-center">#</span>
                <span style={{ width: RING.size }} />
                <span className="flex-1">Player</span>
                <span className="w-10 text-center">
                  <TrendingUp className="h-3 w-3 mx-auto" />
                </span>
                <span className="w-10 text-center">
                  <Gamepad2 className="h-3 w-3 mx-auto" />
                </span>
                <span className="w-10 text-center">
                  <Trophy className="h-3 w-3 mx-auto" />
                </span>
              </div>

              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-gray-100">
                {entries.map((entry: LeaderboardEntry, idx: number) => {
                  const avatarColor = entry.avatar_url ?? getAvatarColor(entry.display_name);
                  return (
                    <div
                      key={entry.id}
                      className={cn("flex items-center gap-3 px-4 py-3", idx === 0 && "bg-amber-50")}
                    >
                      {/* Rank */}
                      <div className="w-8 shrink-0 flex items-center justify-center">
                        {idx === 0 ? <span className="text-[18px]">🥇</span>
                          : idx === 1 ? <span className="text-[18px]">🥈</span>
                          : idx === 2 ? <span className="text-[18px]">🥉</span>
                          : <span className="text-[13px] font-semibold text-gray-400">{idx + 1}</span>}
                      </div>

                      {/* Avatar + win rate ring */}
                      <AvatarRing
                        name={entry.display_name}
                        color={avatarColor}
                        winRate={entry.win_rate}
                      />

                      {/* Name */}
                      <p className="flex-1 min-w-0 text-[15px] font-semibold text-gray-900 truncate">
                        {entry.display_name}
                        {entry.is_guest && (
                          <span className="ml-1.5 text-[10px] font-medium text-gray-400 align-middle">GUEST</span>
                        )}
                      </p>

                      {/* Win rate label */}
                      <span className="text-[12px] text-gray-400 tabular-nums w-10 text-center">
                        {entry.win_rate}%
                      </span>

                      {/* Games */}
                      <span className="w-10 text-center text-[14px] font-medium text-gray-500 tabular-nums">
                        {entry.total_sessions}
                      </span>

                      {/* Wins */}
                      <span className="w-10 text-center text-[15px] font-bold text-gray-900 tabular-nums">
                        {entry.total_wins}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
