"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Gamepad2, Flame, TrendingUp, ChevronRight } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupMembers, useMemberStats, useAdjustedStreak, useLeaderboard } from "@/lib/queries/members";
import { useGroupSettings } from "@/lib/queries/settings";
import { useGamesWithStats } from "@/lib/queries/games";
import { cn } from "@/lib/utils/cn";

const CARD_SHADOW = "0px 4px 6px 0px rgba(0,0,0,0.1), 0px 2px 4px 0px rgba(0,0,0,0.1)";
const FLASH_CARD_SHADOW = "0px 1px 4px 0px rgba(0,0,0,0.05), 0px 2px 4px 0px rgba(0,0,0,0.05)";

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

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("bg-gray-200 animate-pulse rounded-[8px]", className)} />;
}

function SectionHeader({ emoji, label, rightSlot }: { emoji: string; label: string; rightSlot?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1">
        <span className="text-[14px]">{emoji}</span>
        <span className="text-[14px] font-semibold text-[#334155]">{label}</span>
      </div>
      {rightSlot}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const bgColor = avatarUrl ?? getAvatarColor(name);
  const initial = name[0]?.toUpperCase() ?? "?";
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }}
    >
      <span className="text-white font-semibold" style={{ fontSize: size * 0.38 }}>
        {initial}
      </span>
    </div>
  );
}

type Period = "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

export default function StatsPage() {
  const { groupId } = useGroupId();
  const { user } = useUser();
  const [period, setPeriod] = useState<Period>("all");

  const { data: members } = useGroupMembers(groupId);
  const { data: stats, isLoading: statsLoading } = useMemberStats(groupId);
  const { data: settings } = useGroupSettings(groupId);
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard(groupId, period, false);
  const { data: games, isLoading: gamesLoading } = useGamesWithStats(groupId);

  const currentMemberId = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m: any) => m.user_id === user.id)?.id ?? null;
  }, [members, user]);

  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m: any) => m.user_id === user.id) ?? null;
  }, [members, user]);

  const currentMemberStat = useMemo(() => {
    if (!stats || !currentMemberId) return null;
    return stats.find((s: any) => s.member_id === currentMemberId) ?? null;
  }, [stats, currentMemberId]);

  const { data: streak } = useAdjustedStreak(
    currentMemberId,
    groupId,
    settings?.streak_window ?? 10,
    settings?.streak_include_guests ?? false
  );

  const myRank = useMemo(() => {
    if (!leaderboard || !currentMemberId) return null;
    const idx = leaderboard.findIndex((e) => e.member_id === currentMemberId);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, currentMemberId]);

  const topGames = useMemo(() => {
    if (!games) return [];
    return [...games]
      .filter((g) => g.play_count > 0)
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 5);
  }, [games]);

  const displayName = currentMember?.display_name ?? user?.user_metadata?.display_name ?? user?.email ?? "You";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">Stats</h1>
      </div>

      <div className="flex flex-col gap-5 mt-2">
        {/* Personal stats card */}
        <div className="px-4">
          <SectionHeader emoji="⭐️" label={`${firstName}'s Stats`} />
          <div
            className="rounded-[16px] overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              boxShadow: CARD_SHADOW,
            }}
          >
            <div className="p-4 flex items-center gap-3 border-b border-white/10">
              <Avatar
                name={currentMember?.display_name ?? "?"}
                avatarUrl={currentMember?.avatar_url}
                size={44}
              />
              <div>
                <p className="text-[17px] font-semibold text-white">{displayName}</p>
                {myRank && (
                  <p className="text-[13px] text-white/60">
                    #{myRank} on the leaderboard
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-white/10">
              {[
                {
                  label: "Wins",
                  value: statsLoading ? "–" : (currentMemberStat?.total_wins ?? 0),
                  icon: <Trophy className="h-3.5 w-3.5 text-yellow-400" />,
                },
                {
                  label: "Played",
                  value: statsLoading ? "–" : (currentMemberStat?.total_sessions ?? 0),
                  icon: <Gamepad2 className="h-3.5 w-3.5 text-blue-400" />,
                },
                {
                  label: "Win %",
                  value: statsLoading ? "–" : `${currentMemberStat?.win_rate ?? 0}%`,
                  icon: <TrendingUp className="h-3.5 w-3.5 text-green-400" />,
                },
                {
                  label: "Streak",
                  value: streak ?? 0,
                  icon: <Flame className="h-3.5 w-3.5 text-orange-400" />,
                },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 py-4">
                  <div className="flex items-center gap-1">
                    {icon}
                    <span className="text-[11px] text-white/50 uppercase tracking-wide">{label}</span>
                  </div>
                  <span className="text-[22px] font-bold text-white leading-none">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="px-4">
          <SectionHeader
            emoji="🏆"
            label="Leaderboard"
            rightSlot={
              <div
                className="flex rounded-full overflow-hidden"
                style={{ background: "rgba(0,0,0,0.06)" }}
              >
                {(["month", "year", "all"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "text-[11px] font-medium px-2.5 py-1 transition-all",
                      period === p
                        ? "bg-white rounded-full text-[#334155] shadow-sm"
                        : "text-[#94a3b8]"
                    )}
                  >
                    {p === "month" ? "Month" : p === "year" ? "Year" : "All"}
                  </button>
                ))}
              </div>
            }
          />

          <div
            className="bg-white rounded-[16px] overflow-hidden"
            style={{ boxShadow: CARD_SHADOW, border: "0.5px solid #f5f5f5" }}
          >
            {lbLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <SkeletonBlock key={i} className="h-12" />
                ))}
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="py-10 text-center text-[14px] text-[#a3a3a3]">
                No games played {period === "month" ? "this month" : period === "year" ? "this year" : "yet"}
              </div>
            ) : (
              <div className="divide-y divide-[#f5f5f5]">
                {leaderboard.map((entry, idx) => {
                  const isCurrentUser = entry.member_id === currentMemberId;
                  const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                  const rankColor = idx < 3 ? rankColors[idx] : undefined;
                  return (
                    <Link
                      key={entry.id}
                      href={entry.member_id ? `/profiles/${entry.member_id}` : "#"}
                      className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors"
                    >
                      <div
                        className="w-6 text-center shrink-0 text-[13px] font-bold"
                        style={{ color: rankColor ?? "#a3a3a3" }}
                      >
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </div>
                      <Avatar name={entry.display_name} avatarUrl={entry.avatar_url} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[15px] font-medium truncate", isCurrentUser ? "text-blue-600" : "text-[#0a0a0a]")}>
                          {entry.display_name}
                          {isCurrentUser && <span className="ml-1 text-[11px] font-normal text-blue-400">you</span>}
                        </p>
                        <p className="text-[12px] text-[#a3a3a3]">
                          {entry.total_sessions} game{entry.total_sessions !== 1 ? "s" : ""} · {entry.win_rate}% win rate
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-[16px] font-bold text-[#334155]">{entry.total_wins}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Games */}
        <div className="px-4">
          <SectionHeader emoji="🎲" label="Most Played Games" />
          <div
            className="bg-white rounded-[16px] overflow-hidden"
            style={{ boxShadow: CARD_SHADOW, border: "0.5px solid #f5f5f5" }}
          >
            {gamesLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-12" />)}
              </div>
            ) : topGames.length === 0 ? (
              <div className="py-10 text-center text-[14px] text-[#a3a3a3]">No games logged yet</div>
            ) : (
              <div className="divide-y divide-[#f5f5f5]">
                {topGames.map((game, idx) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors"
                  >
                    <div
                      className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0 text-[18px]"
                      style={{ background: "rgba(0,0,0,0.04)" }}
                    >
                      {game.icon ?? <Gamepad2 className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-[#0a0a0a] truncate">{game.name}</p>
                      <p className="text-[12px] text-[#a3a3a3]">
                        {game.play_count} play{game.play_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: Math.max(24, (game.play_count / (topGames[0]?.play_count || 1)) * 60),
                          opacity: 0.3 + 0.7 * (1 - idx / topGames.length),
                        }}
                      />
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#d4d4d4] shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
