"use client";

import type { Database } from "@/lib/supabase/types";

type MeetupRow = Database["public"]["Tables"]["meetups"]["Row"];
type FeaturedMeetup = MeetupRow & { label: string; gradient: string };

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Gamepad2,
  Flame,
  Trophy,
  ChevronRight,
  ChevronDown,
  X,
  Users,
  Ellipsis,
  Settings,
  CircleHelp,
  Check,
  Plus,
  UserRoundPlus,
  LogOut,
  Swords,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MeetupSessionCard } from "@/components/ui/meetup-session-card";
import { GameTile } from "@/components/features/games/game-tile";
import { useGroupId } from "@/components/providers/group-provider";
import { useGroup } from "@/lib/queries/groups";
import { useMemberStats, useAdjustedStreak } from "@/lib/queries/members";
import { useGroupSettings } from "@/lib/queries/settings";
import { useDashboardInsights } from "@/lib/queries/insights";
import { useMeetups, useMeetupParticipants } from "@/lib/queries/meetups";
import { useRecentSessions, useMeetupSessions } from "@/lib/queries/sessions";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupMembers } from "@/lib/queries/members";
import { formatDate, getRelativeTime } from "@/lib/utils/dates";
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

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gray-200 animate-pulse rounded-[8px]", className)} />
  );
}

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-[fadeSlideIn_0.5s_ease_both]", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
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

const FLASH_CARD_SHADOW = "0px 1px 4px 0px rgba(0,0,0,0.05), 0px 2px 4px 0px rgba(0,0,0,0.05)";
const CARD_SHADOW = "0px 4px 6px 0px rgba(0,0,0,0.1), 0px 2px 4px 0px rgba(0,0,0,0.1)";

function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as any).standalone === true);
    if (isStandalone) return;
    if (localStorage.getItem("pwa_banner_dismissed")) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="mx-4 mb-3 bg-white rounded-[16px] border-[0.5px] border-[#f5f5f5] px-4 py-3.5 flex items-start gap-3" style={{ boxShadow: FLASH_CARD_SHADOW }}>
      <div className="h-9 w-9 rounded-[10px] bg-black flex items-center justify-center shrink-0 mt-0.5">
        <Gamepad2 className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-900">Add to Home Screen</p>
        <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">
          {isIOS
            ? 'Tap the Share button, then "Add to Home Screen".'
            : 'Tap the menu, then "Install App".'}
        </p>
      </div>
      <button
        onClick={() => { localStorage.setItem("pwa_banner_dismissed", "1"); setVisible(false); }}
        className="shrink-0 text-gray-400 active:opacity-60 transition-opacity mt-0.5"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { groupId, loading: groupLoading, groups, switchGroup } = useGroupId();
  const { data: group } = useGroup(groupId);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const { user } = useUser();
  const { data: stats, isLoading: statsLoading } = useMemberStats(groupId);
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId);
  const { data: meetups, isLoading: meetupsLoading } = useMeetups(groupId);

  const [showNoMeetupModal, setShowNoMeetupModal] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("selected_group_id");
    }
    router.push("/login");
  }

  const activeMeetup = useMemo(() => {
    if (!meetups) return null;
    return meetups.find((m: any) => m.status === "active") ?? null;
  }, [meetups]);

  const { data: recentSessions } = useRecentSessions(groupId);

  const currentMemberId = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m: any) => m.user_id === user.id)?.id ?? null;
  }, [members, user]);

  const currentMemberStat = useMemo(() => {
    if (!stats || !currentMemberId) return null;
    return stats.find((s: any) => s.member_id === currentMemberId) ?? null;
  }, [stats, currentMemberId]);

  const { data: settings } = useGroupSettings(groupId);
  const { data: adjustedStreak } = useAdjustedStreak(
    currentMemberId,
    groupId,
    settings?.streak_window ?? 10,
    settings?.streak_include_guests ?? false
  );

  const { data: insights } = useDashboardInsights(groupId);

  const leaderboard = useMemo(() => {
    if (!stats || !members) return [];
    return [...stats]
      .filter((s: any) => (s.total_sessions ?? 0) > 0)
      .sort((a: any, b: any) => (b.total_wins ?? 0) - (a.total_wins ?? 0))
      .slice(0, 3)
      .map((s: any) => {
        const member = members.find((m: any) => m.id === s.member_id);
        return { ...s, display_name: member?.display_name ?? "Unknown", avatar_url: member?.avatar_url ?? null };
      });
  }, [stats, members]);

  const featuredMeetup = useMemo<FeaturedMeetup | null>(() => {
    if (!meetups || meetups.length === 0) return null;
    const active = meetups.find((m) => m.status === "active");
    if (active) return { ...active, label: "Current Meetup", gradient: "from-blue-500 to-indigo-600" };
    const planned = meetups.find((m) => m.status === "planned");
    if (planned) return { ...planned, label: "Next Meetup", gradient: "from-violet-500 to-purple-600" };
    const completed = meetups.find((m) => m.status === "complete");
    if (completed) return { ...completed, label: "Last Meetup", gradient: "from-slate-600 to-gray-800" };
    return null;
  }, [meetups]);

  const { data: featuredParticipants } = useMeetupParticipants(featuredMeetup?.id ?? null);
  const { data: featuredSessions } = useMeetupSessions(
    featuredMeetup?.status === "complete" ? featuredMeetup?.id : null
  );

  const featuredWinner = useMemo(() => {
    if (!featuredSessions || featuredMeetup?.status !== "complete") return null;
    const winCounts: Record<string, { name: string; count: number }> = {};
    for (const session of featuredSessions) {
      const winner = session.score_entries?.find((e: any) => e.is_winner) as any;
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

  const firstName = (
    currentMember?.display_name ??
    user?.user_metadata?.display_name ??
    user?.email ??
    ""
  ).split(" ")[0];

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

  const hasFunStats = !isLoading && settings?.show_fun_stats && insights?.funStats &&
    (insights.funStats.longestLosingStreak || insights.funStats.mostGamesInOneNight || insights.funStats.luckyFirstTimer);

  return (
    <div className="pb-28">
      {/* Sticky top nav */}
      <div
        className="sticky top-0 z-40 px-4 pt-14 pb-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowGroupPicker(!showGroupPicker)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full active:opacity-60 transition-opacity max-w-[220px]"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "0.5px solid rgba(255,255,255,0.8)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <span className="text-base leading-none">{group?.emoji ?? "🎮"}</span>
            <span className="text-[16px] font-semibold text-gray-900 truncate">
              {group?.name ?? "Loading..."}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          </button>

          <button
            onClick={() => setShowPopover(!showPopover)}
            className="flex items-center justify-center h-9 w-9 rounded-full active:opacity-60 transition-opacity"
            style={{
              background: "rgba(255,255,255,0.1)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Ellipsis className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Group switcher bottom sheet */}
      {showGroupPicker && (
        <div className="fixed inset-0 z-[70] flex items-end" onClick={() => setShowGroupPicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-[430px] mx-auto" onClick={(e) => e.stopPropagation()}>
            <div
              className="rounded-t-[32px] px-4 pt-3 pb-6 flex flex-col gap-6"
              style={{
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.1)",
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-1 w-10 rounded-full bg-black/20" />
                <p className="text-[14px] font-medium text-black">Accounts</p>
              </div>

              <div className="rounded-[16px] overflow-hidden" style={{ background: "rgba(0,0,0,0.03)" }}>
                {groups.map((g) => {
                  const isActive = g.group_id === groupId;
                  const roleLabel = g.role === "owner" ? "Admin" : "Member";
                  return (
                    <button
                      key={g.group_id}
                      onClick={() => { switchGroup(g.group_id); setShowGroupPicker(false); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors"
                      style={isActive ? { background: "rgba(255,255,255,0.25)" } : undefined}
                    >
                      <div className="h-[38px] w-[38px] rounded-[4px] flex items-center justify-center shrink-0 text-[20px]" style={{ background: "rgba(255,255,255,0.6)" }}>
                        {g.group_emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#0a0a0a] truncate">{g.group_name}</p>
                        <p className="text-[12px] text-[#737373]">{roleLabel}</p>
                      </div>
                      {isActive && <Check className="h-4 w-4 text-[#007AFF] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[16px] overflow-hidden" style={{ background: "rgba(0,0,0,0.03)" }}>
                <Link
                  href="/settings/groups?action=create"
                  onClick={() => setShowGroupPicker(false)}
                  className="flex items-center gap-2 px-2 py-1.5 active:bg-black/5 transition-colors"
                >
                  <div className="h-[38px] w-[38px] flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4 text-[#0a0a0a]" />
                  </div>
                  <span className="text-[14px] text-[#0a0a0a]">Create new group</span>
                </Link>
                <Link
                  href="/settings/groups?action=join"
                  onClick={() => setShowGroupPicker(false)}
                  className="flex items-center gap-2 px-2 py-1.5 active:bg-black/5 transition-colors"
                >
                  <div className="h-[38px] w-[38px] flex items-center justify-center shrink-0">
                    <UserRoundPlus className="h-4 w-4 text-[#0a0a0a]" />
                  </div>
                  <span className="text-[14px] text-[#0a0a0a]">Join existing group</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-2 py-1.5 active:bg-black/5 transition-colors disabled:opacity-50"
                >
                  <div className="h-[38px] w-[38px] flex items-center justify-center shrink-0">
                    <LogOut className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-[14px] text-red-600">{loggingOut ? "Signing out…" : "Log out"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ellipsis popover */}
      {showPopover && (
        <div className="fixed inset-0 z-50" onClick={() => setShowPopover(false)}>
          <div className="max-w-[430px] mx-auto relative h-full">
            <div
              className="absolute right-4 top-[108px] min-w-[160px] rounded-[8px] overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                boxShadow: "0 25px 50px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                <Link href="/profiles" onClick={() => setShowPopover(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] active:bg-black/5 transition-colors">
                  <Users className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-[14px] text-gray-900">Members</span>
                </Link>
                <Link href="/settings/group" onClick={() => setShowPopover(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] active:bg-black/5 transition-colors">
                  <Settings className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-[14px] text-gray-900">Group Settings</span>
                </Link>
                <Link href="/support" onClick={() => setShowPopover(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] active:bg-black/5 transition-colors">
                  <CircleHelp className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="text-[14px] text-gray-900">Help & Support</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date + Greeting */}
      <div className="px-4 mt-3 mb-3">
        <p className="text-[12px] font-medium text-slate-600 uppercase tracking-[1px]">{today}</p>
        <p className="text-[18px] font-medium text-[#0a0a0a]">Hi {firstName} 👋</p>
      </div>

      <InstallBanner />

      <div className="flex flex-col gap-4">
        {/* ── Hero: Featured Meetup Card + Flash Stats ── */}
        <div className="flex flex-col gap-3">
          <div className="px-4">
            {isLoading ? (
              <div className="rounded-[16px] overflow-hidden" style={{ background: "linear-gradient(180.59deg, rgb(91,33,182) 5.5%, rgb(168,85,247) 114%)" }}>
                <div className="p-4 space-y-3">
                  <SkeletonBlock className="h-6 w-16 rounded-[12px] bg-white/20" />
                  <SkeletonBlock className="h-6 w-48 bg-white/20" />
                  <SkeletonBlock className="h-4 w-32 bg-white/20" />
                </div>
              </div>
            ) : featuredMeetup ? (
              <FadeIn>
                <MeetupSessionCard
                  href={`/meetups/${featuredMeetup.id}`}
                  title={featuredMeetup.title}
                  date={featuredMeetup.date}
                  status={featuredMeetup.status as "active" | "complete" | "planned"}
                  participantCount={featuredParticipants?.length}
                  winnerName={featuredWinner?.name}
                  gamesCount={featuredGamesPlayed}
                />
              </FadeIn>
            ) : null}
          </div>

          {/* ── Flash Stats ── */}
          <FadeIn delay={80} className="px-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Win Rate */}
            <div
              className="bg-white rounded-[8px] border-[0.5px] border-[#f5f5f5] px-2 py-[6px] flex flex-col gap-4"
              style={{ boxShadow: FLASH_CARD_SHADOW }}
            >
              <div className="flex justify-end">
                <div className="bg-green-200 rounded-[20px] p-1">
                  <TrendingUp className="h-4 w-4 text-green-700" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                {isLoading ? (
                  <SkeletonBlock className="h-7 w-12 mb-1" />
                ) : (
                  <p className="text-[30px] font-semibold tracking-[-1px] text-[#0a0a0a] leading-[30px]">
                    {currentMemberStat?.win_rate != null
                      ? `${Math.round(currentMemberStat.win_rate)}%`
                      : "0%"}
                  </p>
                )}
                <p className="text-[12px] text-[#a3a3a3]">Win Rate</p>
              </div>
            </div>

            {/* Total Wins */}
            <div
              className="bg-white rounded-[8px] border-[0.5px] border-[#f5f5f5] px-2 py-[6px] flex flex-col gap-4"
              style={{ boxShadow: FLASH_CARD_SHADOW }}
            >
              <div className="flex justify-end">
                <div className="bg-blue-200 rounded-[20px] p-1">
                  <Trophy className="h-4 w-4 text-blue-700" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                {isLoading ? (
                  <SkeletonBlock className="h-7 w-8 mb-1" />
                ) : (
                  <p className="text-[30px] font-semibold tracking-[-1px] text-[#0a0a0a] leading-[30px]">
                    {currentMemberStat?.total_wins ?? 0}
                  </p>
                )}
                <p className="text-[12px] text-[#a3a3a3]">Total Wins</p>
              </div>
            </div>

            {/* Hot Streak */}
            <div
              className="bg-white rounded-[8px] border-[0.5px] border-[#f5f5f5] px-2 py-[6px] flex flex-col gap-4"
              style={{ boxShadow: FLASH_CARD_SHADOW }}
            >
              <div className="flex justify-end">
                <div className="bg-orange-200 rounded-[20px] p-1">
                  <Flame className="h-4 w-4 text-orange-700" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                {isLoading ? (
                  <SkeletonBlock className="h-7 w-6 mb-1" />
                ) : (
                  <p className="text-[30px] font-semibold tracking-[-1px] text-[#0a0a0a] leading-[30px]">
                    {adjustedStreak ?? currentMemberStat?.current_streak ?? 0}
                  </p>
                )}
                <p className="text-[12px] text-[#a3a3a3]">Hot Streak</p>
              </div>
            </div>
          </div>
        </FadeIn>
        </div>

        {/* ── Top Rivalry ── */}
        {!isLoading && settings?.show_rivalry_stats && insights?.rivalry && (
          <FadeIn delay={120} className="px-4">
            <SectionHeader emoji="⚔️" label="Top Rivalry" />
            <div
              className="rounded-[16px] overflow-hidden relative pt-4 pb-10 px-4"
              style={{
                background: "linear-gradient(90deg, rgb(251,146,60) 0%, rgb(251,146,60) 100%)",
                boxShadow: CARD_SHADOW,
              }}
            >
              {/* Triangle pattern overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" opacity="0.5">
                <defs>
                  <pattern id="rivalryTri" x="0" y="0" width="80" height="200" patternUnits="userSpaceOnUse">
                    <polygon points="0,200 40,0 80,200" fill="rgba(255,255,255,0.25)" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#rivalryTri)" />
              </svg>

              {/* Radial glow overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(234,88,12,0.8) 0%, rgba(242,146,17,0.4) 50%, rgba(250,204,21,0) 100%)" }}
              />

              {/* Games badge */}
              <div className="relative flex justify-end mb-2">
                <div className="bg-orange-300 rounded-[12px] px-2 py-1 flex items-center gap-1">
                  <Gamepad2 className="h-4 w-4 text-stone-950" />
                  <span className="text-[12px] font-medium uppercase tracking-[1px] text-stone-950">
                    {insights.rivalry.totalGames}
                  </span>
                </div>
              </div>

              {/* Players */}
              <div className="relative flex items-center justify-center gap-5">
                {/* Player A */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-10 rounded-full border-2 border-black flex items-center justify-center text-white text-[14px] font-semibold shrink-0"
                    style={{ backgroundColor: insights.rivalry.playerA.avatarUrl ?? getAvatarColor(insights.rivalry.playerA.name) }}
                  >
                    {insights.rivalry.playerA.name[0].toUpperCase()}
                  </div>
                  <p className="text-[18px] font-semibold text-[#262626]">
                    {insights.rivalry.playerA.name.split(" ")[0]}
                  </p>
                </div>

                {/* VS + score */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="bg-orange-300 rounded-[12px] px-2 py-0.5">
                    <span className="text-[14px] font-semibold text-black">vs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-orange-950">{insights.rivalry.playerA.wins}</span>
                    <span className="text-[14px] text-orange-300">|</span>
                    <span className="text-[14px] font-semibold text-orange-950">{insights.rivalry.playerB.wins}</span>
                  </div>
                </div>

                {/* Player B */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="h-10 w-10 rounded-full border-2 border-black flex items-center justify-center text-white text-[14px] font-semibold shrink-0"
                    style={{ backgroundColor: insights.rivalry.playerB.avatarUrl ?? getAvatarColor(insights.rivalry.playerB.name) }}
                  >
                    {insights.rivalry.playerB.name[0].toUpperCase()}
                  </div>
                  <p className="text-[18px] font-semibold text-[#262626]">
                    {insights.rivalry.playerB.name.split(" ")[0]}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* ── Fun Facts ── */}
        {hasFunStats && (
          <FadeIn delay={160}>
            <div className="px-4 mb-2">
              <SectionHeader emoji="⭐️" label="Fun Facts" />
            </div>
            <div
              className="flex gap-2 pl-4 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
              {insights!.funStats!.longestLosingStreak && (
                <div
                  className="bg-white rounded-[8px] border-[0.5px] border-[#f5f5f5] px-2 py-[6px] flex flex-col gap-4 shrink-0 w-[180px] min-h-[116px]"
                  style={{ boxShadow: FLASH_CARD_SHADOW }}
                >
                  <div className="bg-red-100 rounded-[4px] p-1 self-start">
                    <span className="text-[28px] leading-none">🐔</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-medium text-black leading-[20px]">Longest Losing Streak</p>
                    <p className="text-[12px] text-[#737373]">
                      {insights!.funStats!.longestLosingStreak.name} — {insights!.funStats!.longestLosingStreak.streak} games in a row
                    </p>
                  </div>
                </div>
              )}
              {insights!.funStats!.mostGamesInOneNight && (
                <div
                  className="bg-white rounded-[8px] border-[0.5px] border-[#f5f5f5] px-2 py-[6px] flex flex-col gap-4 shrink-0 w-[180px] min-h-[116px]"
                  style={{ boxShadow: FLASH_CARD_SHADOW }}
                >
                  <div className="bg-blue-100 rounded-[4px] p-1 self-start">
                    <span className="text-[28px] leading-none">🏁</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-medium text-black leading-[20px]">Marathon Gamer</p>
                    <p className="text-[12px] text-[#737373]">
                      {insights!.funStats!.mostGamesInOneNight.name} — {insights!.funStats!.mostGamesInOneNight.count} games at {insights!.funStats!.mostGamesInOneNight.meetupTitle}
                    </p>
                  </div>
                </div>
              )}
              {insights!.funStats!.luckyFirstTimer && (
                <div
                  className="bg-white rounded-[8px] border-[0.5px] border-[#f5f5f5] px-2 py-[6px] flex flex-col gap-4 shrink-0 w-[180px] min-h-[116px] mr-4"
                  style={{ boxShadow: FLASH_CARD_SHADOW }}
                >
                  <div className="bg-green-100 rounded-[4px] p-1 self-start">
                    <span className="text-[28px] leading-none">🍀</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-medium text-black leading-[20px]">Beginner&apos;s Luck</p>
                    <p className="text-[12px] text-[#737373]">
                      {insights!.funStats!.luckyFirstTimer.name} won their first game of {insights!.funStats!.luckyFirstTimer.gameName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* ── Most Improved ── */}
        {!isLoading && settings?.show_most_improved && insights?.mostImproved && (
          <FadeIn delay={180} className="px-4">
            <SectionHeader emoji="📈" label="Most Improved" />
            <div
              className="bg-white rounded-[16px] border-[0.5px] border-[#f5f5f5] p-4"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[15px] font-bold shrink-0"
                  style={{ backgroundColor: insights.mostImproved.avatarUrl ?? getAvatarColor(insights.mostImproved.displayName) }}
                >
                  {insights.mostImproved.displayName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-semibold text-[#0a0a0a] truncate">{insights.mostImproved.displayName}</p>
                  <p className="text-[12px] text-[#a3a3a3]">
                    {insights.mostImproved.recentWinRate}% recent · {insights.mostImproved.allTimeWinRate}% all-time
                  </p>
                </div>
                <div className="bg-green-100 text-green-700 text-[13px] font-semibold rounded-full px-3 py-1 shrink-0">
                  +{insights.mostImproved.delta}%
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* ── Leaderboard ── */}
        <FadeIn delay={200} className="px-4">
          <SectionHeader
            emoji="🏆"
            label="Leaderboard"
            rightSlot={
              <Link href="/dashboard/leaderboard" className="text-[13px] font-medium text-[#007AFF] active:opacity-60 transition-opacity">
                View More
              </Link>
            }
          />
          <div className="bg-white rounded-[16px] border-[0.5px] border-[#f5f5f5] overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-8 w-8 rounded-full" />
                    <SkeletonBlock className="h-4 w-24" />
                    <div className="ml-auto"><SkeletonBlock className="h-4 w-10" /></div>
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[15px] text-[#737373] mb-4">
                  No games played yet. Start a meetup to begin climbing the ranks.
                </p>
                <Link
                  href="/meetups/new"
                  className="inline-block bg-[#0a0a0a] text-white text-[14px] font-semibold rounded-[10px] px-4 py-2 active:scale-[0.98] transition-transform"
                >
                  Schedule a Meetup
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#f5f5f5]">
                {leaderboard.map((entry: any, idx: number) => {
                  const entryColor = entry.avatar_url ?? getAvatarColor(entry.display_name ?? "");
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div
                      key={entry.member_id}
                      className={cn("flex items-center gap-3 px-4 py-3.5", idx === 0 && "bg-amber-50/60")}
                    >
                      <span className="text-[20px] w-7 text-center shrink-0">{medals[idx]}</span>
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                        style={{ backgroundColor: entryColor }}
                      >
                        {(entry.display_name ?? "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[17px] font-semibold text-[#0a0a0a] truncate">{entry.display_name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[14px] font-medium text-[#a3a3a3]">
                        <Trophy className="h-3.5 w-3.5" />
                        <span>{entry.total_wins ?? 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeIn>

        {/* ── Recent Activity ── */}
        <FadeIn delay={250} className="px-4">
          <SectionHeader
            emoji="⚡️"
            label="Recent Activity"
            rightSlot={
              <Link href="/dashboard/activity" className="text-[13px] font-medium text-[#007AFF] active:opacity-60 transition-opacity">
                View More
              </Link>
            }
          />
          <div className="bg-white rounded-[16px] border-[0.5px] border-[#f5f5f5] overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
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
                <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[15px] text-[#737373] mb-4">
                  No sessions recorded yet. Start a meetup to get going!
                </p>
                <Link
                  href="/meetups/new"
                  className="inline-block bg-[#0a0a0a] text-white text-[14px] font-semibold rounded-[10px] px-4 py-2 active:scale-[0.98] transition-transform"
                >
                  Start a Meetup
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#f5f5f5]">
                {recentSessions.map((session: any, idx: number) => {
                  const game = session.games;
                  const gameName = game?.name ?? "Unknown Game";
                  const abbr = game?.abbreviation || gameName.substring(0, 2).toUpperCase();
                  const winnerEntry = session.score_entries?.find((e: any) => e.is_winner);
                  const winnerName = winnerEntry
                    ? winnerEntry.meetup_participants?.group_members?.display_name ??
                      winnerEntry.meetup_participants?.guests?.name ??
                      "Unknown"
                    : null;
                  return (
                    <Link
                      key={session.id}
                      href={`/meetups/${session.meetup_id}/sessions/${session.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
                    >
                      <GameTile
                        thumbnailUrl={game?.thumbnail_url}
                        imageUrl={game?.image_url}
                        imageStatus={game?.image_status}
                        abbreviation={abbr}
                        colorIndex={idx}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-[#0a0a0a] truncate">{gameName}</p>
                        <p className="text-[12px] text-[#737373]">
                          {winnerName ? `Won by ${winnerName}` : "In progress"}
                        </p>
                      </div>
                      {(session.finalized_at || session.played_at) && (
                        <p className="text-[12px] text-[#a3a3a3] shrink-0">
                          {getRelativeTime(session.finalized_at ?? session.played_at)}
                        </p>
                      )}
                      <ChevronRight className="h-4 w-4 text-[#a3a3a3] shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </FadeIn>

        {/* ── Record New Game ── */}
        <FadeIn delay={300} className="px-4">
          <button
            onClick={handleRecordNewGame}
            className="w-full bg-[#0a0a0a] text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
          >
            Record New Game
          </button>
        </FadeIn>
      </div>

      {/* No Active Meetup Modal */}
      {showNoMeetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNoMeetupModal(false)} />
          <div className="relative w-full max-w-[400px] bg-white rounded-[24px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-bold text-[#0a0a0a]">No Active Meetup</h3>
              <button onClick={() => setShowNoMeetupModal(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-[15px] text-[#737373] mb-6">
              You need an active meetup to record a game. Create a new meetup to get started.
            </p>
            <div className="space-y-3">
              <Link
                href="/meetups/new"
                onClick={() => setShowNoMeetupModal(false)}
                className="block w-full bg-[#0a0a0a] text-white rounded-[14px] py-4 text-[17px] font-semibold text-center active:scale-[0.98] transition-transform"
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
