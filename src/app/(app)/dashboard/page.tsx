"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Gamepad2, Flame, Trophy, ChevronRight } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useMemberStats } from "@/lib/queries/members";
import { useMeetups } from "@/lib/queries/meetups";
import { useMeetupSessions } from "@/lib/queries/sessions";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupMembers } from "@/lib/queries/members";
import { formatDate, getRelativeTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { groupId, loading: groupLoading } = useGroupId();
  const { user } = useUser();
  const { data: stats, isLoading: statsLoading } = useMemberStats(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: meetups, isLoading: meetupsLoading } = useMeetups(groupId);

  const activeMeetupId = useMemo(() => {
    if (!meetups) return null;
    const active = meetups.find((m: any) => m.status === "active");
    return active?.id ?? meetups[0]?.id ?? null;
  }, [meetups]);

  const { data: recentSessions } = useMeetupSessions(activeMeetupId);

  const currentMemberStat = useMemo(() => {
    if (!stats || !members || !user) return null;
    const myMember = members.find((m: any) => m.user_id === user.id);
    if (!myMember) return null;
    return stats.find((s: any) => s.member_id === myMember.id) ?? null;
  }, [stats, members, user]);

  const leaderboard = useMemo(() => {
    if (!stats || !members) return [];
    return [...stats]
      .sort((a: any, b: any) => (b.total_wins ?? 0) - (a.total_wins ?? 0))
      .slice(0, 3)
      .map((s: any) => {
        const member = members.find((m: any) => m.id === s.member_id);
        return { ...s, display_name: member?.display_name ?? "Unknown" };
      });
  }, [stats, members]);

  const isLoading = groupLoading || statsLoading || meetupsLoading;

  const [avatarColor, setAvatarColor] = useState("#007AFF");
  useEffect(() => {
    const saved = localStorage.getItem("avatar_color");
    if (saved) setAvatarColor(saved);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
              {today}
            </p>
            <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
          </div>
          <Link
            href="/settings"
            className="mt-1 relative active:scale-95 transition-transform"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[17px] font-bold shadow-sm"
              style={{ backgroundColor: avatarColor }}
            >
              {(
                user?.user_metadata?.display_name ||
                user?.email ||
                "?"
              )[0].toUpperCase()}
            </div>
          </Link>
        </div>
      </div>

      <div className="px-5 space-y-5 mt-2">
        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <SkeletonBlock className="h-3 w-12 mb-3" />
                <SkeletonBlock className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-[#007AFF]" />
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                  Win Rate
                </span>
              </div>
              <p className="text-[28px] font-bold tracking-tight text-gray-900">
                {currentMemberStat?.win_rate != null
                  ? `${Math.round(currentMemberStat.win_rate)}%`
                  : "0%"}
              </p>
            </div>
            <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-1.5 mb-2">
                <Gamepad2 className="h-3.5 w-3.5 text-[#007AFF]" />
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                  Played
                </span>
              </div>
              <p className="text-[28px] font-bold tracking-tight text-gray-900">
                {currentMemberStat?.total_sessions ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-1.5 mb-2">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                  Streak
                </span>
              </div>
              <p className="text-[28px] font-bold tracking-tight text-gray-900">
                {(currentMemberStat as any)?.current_streak ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Leaderboard
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-8 w-8 rounded-full" />
                    <SkeletonBlock className="h-4 w-24" />
                    <div className="ml-auto">
                      <SkeletonBlock className="h-4 w-10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-[15px] text-gray-500">
                  No stats yet. Play some games to see the leaderboard!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry: any, idx: number) => {
                  const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
                  return (
                    <div
                      key={entry.member_id}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                        style={{ backgroundColor: medals[idx] ?? "#999" }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[17px] font-semibold text-gray-900 truncate">
                          {entry.display_name}
                        </p>
                      </div>
                      <p className="text-[15px] font-medium text-gray-500">
                        {entry.total_wins ?? 0}W
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Recent Activity
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {isLoading ? (
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
            ) : !recentSessions || recentSessions.length === 0 ? (
              <div className="p-8 text-center">
                <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-[15px] text-gray-500">
                  No sessions recorded yet. Start a meetup to get going!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentSessions.slice(-5).reverse().map((session: any) => {
                  const gameName = session.games?.name ?? "Unknown Game";
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
                    <div
                      key={session.id}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <div className="h-10 w-10 rounded-[10px] bg-indigo-100 flex items-center justify-center">
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
                      {session.played_at && (
                        <p className="text-[13px] text-gray-400">
                          {getRelativeTime(session.played_at)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Start New Session */}
        {activeMeetupId ? (
          <button
            onClick={() =>
              router.push(`/meetups/${activeMeetupId}/sessions/new`)
            }
            className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
          >
            Start New Session
          </button>
        ) : (
          <Link
            href="/meetups/new"
            className="block w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold text-center active:scale-[0.98] transition-transform"
          >
            Create a Meetup
          </Link>
        )}
      </div>
    </div>
  );
}
