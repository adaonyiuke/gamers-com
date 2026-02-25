"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Gamepad2,
  Flame,
  Trophy,
  ChevronRight,
  Calendar,
  X,
  MapPin,
  Users,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useMemberStats } from "@/lib/queries/members";
import { useMeetups, useMeetupParticipants } from "@/lib/queries/meetups";
import { useRecentSessions, useMeetupSessions } from "@/lib/queries/sessions";
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
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId);
  const { data: meetups, isLoading: meetupsLoading } = useMeetups(groupId);

  const [showNoMeetupModal, setShowNoMeetupModal] = useState(false);

  const activeMeetup = useMemo(() => {
    if (!meetups) return null;
    return meetups.find((m: any) => m.status === "active") ?? null;
  }, [meetups]);

  const { data: recentSessions } = useRecentSessions(groupId);

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

  // Featured meetup callout
  const featuredMeetup = useMemo(() => {
    if (!meetups || meetups.length === 0) return null;
    const active = meetups.find((m: any) => m.status === "active");
    if (active) return { ...active, label: "Current Meetup", gradient: "from-blue-500 to-indigo-600" };
    const planned = meetups.find((m: any) => m.status === "planned");
    if (planned) return { ...planned, label: "Next Meetup", gradient: "from-violet-500 to-purple-600" };
    // Most recent completed
    const completed = meetups.find((m: any) => m.status === "complete");
    if (completed) return { ...completed, label: "Last Meetup", gradient: "from-slate-600 to-gray-800" };
    return null;
  }, [meetups]);

  // Fetch participants & sessions for the featured meetup card
  const { data: featuredParticipants } = useMeetupParticipants(featuredMeetup?.id ?? null);
  const { data: featuredSessions } = useMeetupSessions(
    featuredMeetup?.status === "complete" ? featuredMeetup?.id : null
  );

  // Compute "winner of night" for completed meetups
  const featuredWinner = useMemo(() => {
    if (!featuredSessions || featuredMeetup?.status !== "complete") return null;
    const winCounts: Record<string, { name: string; count: number }> = {};
    for (const session of featuredSessions) {
      const winner = session.score_entries?.find((e: any) => e.is_winner);
      if (!winner) continue;
      const name =
        winner.meetup_participants?.group_members?.display_name ??
        winner.meetup_participants?.guests?.name ??
        "Unknown";
      const pid = winner.participant_id;
      if (!winCounts[pid]) winCounts[pid] = { name, count: 0 };
      winCounts[pid].count++;
    }
    const sorted = Object.values(winCounts).sort((a, b) => b.count - a.count);
    return sorted[0] ?? null;
  }, [featuredSessions, featuredMeetup?.status]);

  const featuredGamesPlayed = useMemo(() => {
    if (!featuredSessions) return 0;
    return featuredSessions.filter((s: any) => s.status === "finalized").length;
  }, [featuredSessions]);

  const isLoading = groupLoading || statsLoading || meetupsLoading || membersLoading;

  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m: any) => m.user_id === user.id) ?? null;
  }, [members, user]);

  const [avatarColor, setAvatarColor] = useState("#007AFF");
  useEffect(() => {
    if (currentMember?.avatar_url) {
      setAvatarColor(currentMember.avatar_url);
    } else {
      const saved = localStorage.getItem("avatar_color");
      if (saved) setAvatarColor(saved);
    }
  }, [currentMember]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function handleRecordNewGame() {
    if (activeMeetup) {
      router.push(`/meetups/${activeMeetup.id}/sessions/new`);
    } else {
      setShowNoMeetupModal(true);
    }
  }

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
            href={currentMember ? `/profiles/${currentMember.id}` : "/profiles"}
            className="mt-1 active:scale-95 transition-transform"
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
        {/* Featured Meetup Callout Card */}
        {!isLoading && featuredMeetup && (
          <Link
            href={`/meetups/${featuredMeetup.id}`}
            className="block active:scale-[0.98] transition-transform"
          >
            <div
              className={cn(
                "bg-gradient-to-br rounded-[20px] p-5 shadow-lg relative overflow-hidden",
                featuredMeetup.gradient
              )}
            >
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-white/70">
                    {featuredMeetup.label}
                  </span>
                  {featuredMeetup.status === "active" && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[12px] font-bold uppercase tracking-wider text-green-300">
                        Live
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-[22px] font-bold text-white mb-1">
                  {featuredMeetup.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[14px]">
                      {formatDate(featuredMeetup.date)}
                    </span>
                  </div>
                  {featuredMeetup.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-[14px]">
                        {featuredMeetup.location}
                      </span>
                    </div>
                  )}
                  {(featuredMeetup.status === "active" || featuredMeetup.status === "planned") && featuredParticipants && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-[14px]">
                        {featuredParticipants.length} {featuredMeetup.status === "planned" ? "RSVP" : "attendees"}
                      </span>
                    </div>
                  )}
                  {featuredMeetup.status === "complete" && featuredWinner && (
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5" />
                      <span className="text-[14px]">
                        {featuredWinner.name}
                      </span>
                    </div>
                  )}
                  {featuredMeetup.status === "complete" && featuredGamesPlayed > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Gamepad2 className="h-3.5 w-3.5" />
                      <span className="text-[14px]">
                        {featuredGamesPlayed} games
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            </div>
          </Link>
        )}

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
                {recentSessions.map((session: any) => {
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
                          {getRelativeTime(session.finalized_at ?? session.played_at)}
                        </p>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Record New Game */}
        <button
          onClick={handleRecordNewGame}
          className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
        >
          Record New Game
        </button>
      </div>

      {/* No Active Meetup Modal */}
      {showNoMeetupModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowNoMeetupModal(false)}
          />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-[24px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-bold text-gray-900">
                No Active Meetup
              </h3>
              <button
                onClick={() => setShowNoMeetupModal(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-[15px] text-gray-500 mb-6">
              You need an active meetup to record a game. Create a new meetup to
              get started.
            </p>
            <div className="space-y-3">
              <Link
                href="/meetups/new"
                onClick={() => setShowNoMeetupModal(false)}
                className="block w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold text-center active:scale-[0.98] transition-transform"
              >
                Create Meetup
              </Link>
              <button
                onClick={() => setShowNoMeetupModal(false)}
                className="w-full bg-gray-100 text-gray-700 rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
