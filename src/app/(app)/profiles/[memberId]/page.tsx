"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Gamepad2,
  Trophy,
  Calendar,
  Flame,
  Pencil,
  LogOut,
  Settings,
  ChevronLeft,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import {
  useMemberProfile,
  useMemberStats,
  useGroupMembers,
  useUpdateMember,
  useMemberGameStats,
  useAdjustedStreak,
} from "@/lib/queries/members";
import { useGroupSettings } from "@/lib/queries/settings";
import {
  BADGES,
  computeBadges,
  type MemberBadgeInput,
  type Badge,
} from "@/lib/utils/badges";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

const AVATAR_COLORS = [
  "#007AFF", "#FF9500", "#FF2D55", "#5856D6",
  "#34C759", "#AF52DE", "#FF3B30", "#00C7BE",
];

const BADGE_GLOW: Record<string, string> = {
  champion:   "rgba(245,158,11,0.4)",
  on_fire:    "rgba(255,45,234,0.4)",
  strategist: "rgba(0,122,255,0.4)",
  wildcard:   "rgba(0,199,190,0.4)",
  regular:    "rgba(245,158,11,0.4)",
  veteran:    "rgba(75,85,99,0.4)",
};

const BADGE_IMAGES: Record<string, { front: string; back: string }> = {
  champion:   { front: "/badges/champion-front.png",   back: "/badges/champion-back.png"   },
  on_fire:    { front: "/badges/on_fire-front.png",    back: "/badges/on_fire-back.png"    },
  strategist: { front: "/badges/strategist-front.png", back: "/badges/strategist-back.png" },
  wildcard:   { front: "/badges/wildcard-front.png",   back: "/badges/wildcard-back.png"   },
  regular:    { front: "/badges/regular-front.png",    back: "/badges/regular-back.png"    },
  veteran:    { front: "/badges/veteran-front.png",    back: "/badges/veteran-back.png"    },
};

const CARD_SHADOW = "0px 4px 6px 0px rgba(0,0,0,0.1), 0px 2px 4px 0px rgba(0,0,0,0.1)";

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)} />;
}

function SectionHeader({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-1 mb-2">
      <span className="text-[14px]">{emoji}</span>
      <span className="text-[14px] font-semibold text-[#334155]">{label}</span>
    </div>
  );
}

export default function MemberProfilePage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  const { user } = useUser();
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: profile, isLoading: profileLoading } = useMemberProfile(memberId);
  const { data: allStats, isLoading: statsLoading } = useMemberStats(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: gameStats } = useMemberGameStats(memberId);
  const { data: settings } = useGroupSettings(groupId);
  const { data: adjustedStreak } = useAdjustedStreak(
    memberId,
    groupId,
    settings?.streak_window ?? 10,
    settings?.streak_include_guests ?? false
  );
  const updateMember = useUpdateMember();

  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [editName, setEditName] = useState("");
  const [flippedBadge, setFlippedBadge] = useState<string | null>(null);

  const isOwnProfile = useMemo(() => {
    if (!profile || !user) return false;
    return profile.user_id === user.id;
  }, [profile, user]);

  useEffect(() => {
    if (profile) {
      setEditBio(profile.bio || "");
      setEditColor(profile.avatar_url || getAvatarColor(profile.display_name));
      setEditName(profile.display_name || "");
    }
  }, [profile]);

  const memberStat = useMemo(() => {
    if (!allStats) return null;
    return allStats.find((s: any) => s.member_id === memberId) ?? null;
  }, [allStats, memberId]);

  const isTopWinRate = useMemo(() => {
    if (!allStats || !memberStat) return false;
    const eligible = allStats.filter((s: any) => (s.total_sessions ?? 0) >= 5);
    if (eligible.length === 0) return false;
    const maxRate = Math.max(...eligible.map((s: any) => s.win_rate ?? 0));
    return (memberStat.win_rate ?? 0) >= maxRate && (memberStat.total_sessions ?? 0) >= 5;
  }, [allStats, memberStat]);

  const badges = useMemo(() => {
    if (!memberStat) return [];
    const input: MemberBadgeInput = {
      winRate: memberStat.win_rate ?? 0,
      totalSessions: memberStat.total_sessions ?? 0,
      currentStreak: adjustedStreak ?? memberStat.current_streak ?? 0,
      uniqueGameWins: gameStats?.uniqueGameWins ?? 0,
      hasFirstPlayWin: gameStats?.hasFirstPlayWin ?? false,
      isTopWinRate,
      meetupsAttended: gameStats?.meetupsAttended ?? 0,
    };
    return computeBadges(input);
  }, [memberStat, gameStats, adjustedStreak, isTopWinRate]);

  const isLoading = groupLoading || profileLoading || statsLoading;

  const displayName = profile?.display_name ?? "Player";
  const avatarColor = profile?.avatar_url || getAvatarColor(displayName);
  const bio = profile?.bio;

  const joinYear = useMemo(() => {
    if (!profile?.joined_at) return null;
    return new Date(profile.joined_at).getFullYear();
  }, [profile]);

  const streak = adjustedStreak ?? 0;
  const winRate = memberStat?.win_rate ?? 0;
  const totalWins = memberStat?.total_wins ?? 0;
  const totalSessions = memberStat?.total_sessions ?? 0;

  async function handleSave() {
    if (!memberId) return;
    try {
      await updateMember.mutateAsync({
        memberId,
        updates: {
          display_name: editName.trim() || displayName,
          bio: editBio.trim() || null,
          avatar_url: editColor,
        },
      });
      if (isOwnProfile) localStorage.setItem("avatar_color", editColor);
      setEditing(false);
    } catch {}
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="pb-36" style={{ background: "#f2f2f7" }}>
        <div className="h-[280px] bg-gray-200 animate-pulse" />
        <div className="px-4 -mt-8 relative z-10">
          <div className="bg-white rounded-[20px] h-20 animate-pulse" style={{ boxShadow: CARD_SHADOW }} />
        </div>
        <div className="px-4 mt-5 space-y-3">
          <SkeletonBlock className="h-32" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-24" />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Edit mode ───────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="pb-36" style={{ background: "#f2f2f7" }}>
        {/* Header */}
        <div
          className="sticky top-0 z-40 px-4 pt-14 pb-3 flex items-center justify-between"
          style={{ background: "rgba(242,242,247,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <button onClick={() => setEditing(false)} className="text-[17px] text-[#007AFF] active:opacity-60">Cancel</button>
          <span className="text-[17px] font-semibold text-[#0a0a0a]">Edit Profile</span>
          <button
            onClick={handleSave}
            disabled={updateMember.isPending}
            className="text-[17px] font-semibold text-[#007AFF] active:opacity-60 disabled:opacity-40"
          >
            {updateMember.isPending ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="px-4 mt-2 space-y-4">
          {/* Avatar preview + color picker */}
          <div className="bg-white rounded-[16px] p-5" style={{ boxShadow: CARD_SHADOW, border: "0.5px solid #f5f5f5" }}>
            <div className="flex justify-center mb-5">
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center text-white text-[28px] font-bold transition-colors duration-300"
                style={{ backgroundColor: editColor }}
              >
                {(editName || displayName)[0].toUpperCase()}
              </div>
            </div>
            <label className="text-[12px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-3 block">Avatar Color</label>
            <div className="flex flex-wrap gap-3 justify-center">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setEditColor(color)}
                  className="relative w-10 h-10 rounded-full transition-transform active:scale-95"
                  style={{ backgroundColor: color }}
                >
                  {editColor === color && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div className="bg-white rounded-[16px] p-5" style={{ boxShadow: CARD_SHADOW, border: "0.5px solid #f5f5f5" }}>
            <label className="text-[12px] font-semibold text-[#a3a3a3] uppercase tracking-wide mb-2 block">Display Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[#F2F2F7] rounded-[12px] px-4 py-3 text-[17px] focus:outline-none"
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="bg-white rounded-[16px] p-5" style={{ boxShadow: CARD_SHADOW, border: "0.5px solid #f5f5f5" }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-[#a3a3a3] uppercase tracking-wide">Bio</label>
              <span className="text-[12px] text-[#a3a3a3]">{editBio.length}/200</span>
            </div>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Board game enthusiast, pizza lover…"
              rows={3}
              maxLength={200}
              className="w-full bg-[#F2F2F7] rounded-[12px] px-4 py-3 text-[17px] resize-none focus:outline-none"
            />
          </div>

          {updateMember.error && (
            <p className="text-[14px] text-red-500 text-center">
              {(updateMember.error as Error).message ?? "Failed to save changes"}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── View mode ───────────────────────────────────────────────────────────────
  return (
    <div className="pb-36" style={{ background: "#f2f2f7" }}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 288 }}>
        {/* Color wash */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(165deg, ${avatarColor} 0%, ${avatarColor}cc 55%, #f2f2f7 100%)` }}
        />
        {/* Circle pattern */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          opacity="0.5"
        >
          <defs>
            <pattern id="profileCircle" x="0" y="0" width="565" height="339" patternUnits="userSpaceOnUse">
              <circle cx="56.5"  cy="282.5" r="56.5" fill="rgba(255,255,255,0.25)" />
              <circle cx="177.5" cy="170.5" r="56.5" fill="rgba(255,255,255,0.25)" />
              <circle cx="56.5"  cy="68.5"  r="56.5" fill="rgba(255,255,255,0.25)" />
              <circle cx="277.5" cy="76.5"  r="56.5" fill="rgba(255,255,255,0.25)" />
              <circle cx="277.5" cy="263.5" r="56.5" fill="rgba(255,255,255,0.25)" />
              <circle cx="372.5" cy="170.5" r="56.5" fill="rgba(255,255,255,0.25)" />
              <circle cx="508.5" cy="282.5" r="56.5" fill="rgba(255,255,255,0.25)" />
              <circle cx="508.5" cy="68.5"  r="56.5" fill="rgba(255,255,255,0.25)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profileCircle)" />
        </svg>

        {/* Floating nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-14">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 active:opacity-60 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
            <span className="text-[17px] text-white font-medium">Back</span>
          </button>
          {isOwnProfile && (
            <Link href="/settings" className="active:opacity-60 transition-opacity">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                <Settings className="h-[18px] w-[18px] text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Avatar + Identity */}
        <div className="relative flex flex-col items-center pt-[88px] pb-14 px-6">
          {/* Avatar ring */}
          <div
            className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-white text-[26px] font-bold mb-3"
            style={{
              backgroundColor: avatarColor,
              boxShadow: `0 0 0 4px rgba(255,255,255,0.35), 0 0 0 8px rgba(255,255,255,0.12)`,
            }}
          >
            {displayName[0].toUpperCase()}
          </div>

          <h1 className="text-[26px] font-bold text-white">{displayName}</h1>

          {bio && (
            <p className="text-[14px] text-white/70 text-center mt-1 leading-snug max-w-[260px]">
              {bio}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {joinYear && (
              <span
                className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.75)" }}
              >
                Member since {joinYear}
              </span>
            )}
            {isOwnProfile && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full active:opacity-60 transition-opacity"
                style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.75)" }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── FLOATING STATS CARD ── */}
      <div className="px-4 -mt-9 relative z-10 mb-5">
        <div
          className="bg-white rounded-[20px] grid grid-cols-3 divide-x divide-[#f5f5f5]"
          style={{ boxShadow: CARD_SHADOW, border: "0.5px solid #f5f5f5" }}
        >
          {[
            { label: "Wins", value: totalWins, icon: <Trophy className="h-3.5 w-3.5 text-yellow-500" /> },
            { label: "Played", value: totalSessions, icon: <Gamepad2 className="h-3.5 w-3.5 text-blue-500" /> },
            { label: "Win %", value: `${Math.round(winRate)}%`, icon: <TrendingUp className="h-3.5 w-3.5 text-green-500" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex flex-col items-center py-4 gap-1">
              <div className="flex items-center gap-1">
                {icon}
                <span className="text-[11px] text-[#737373] uppercase tracking-wide">{label}</span>
              </div>
              <span className="text-[22px] font-bold text-[#0a0a0a] leading-none">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STREAK CARD (only if active) ── */}
      {streak > 0 && (
        <div className="px-4 mb-5">
          <div
            className="relative rounded-[16px] p-4 overflow-hidden flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)", boxShadow: CARD_SHADOW }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" opacity="0.3">
              <defs>
                <pattern id="streakTri" x="0" y="0" width="80" height="200" patternUnits="userSpaceOnUse">
                  <polygon points="0,200 40,0 80,200" fill="rgba(255,255,255,0.3)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#streakTri)" />
            </svg>
            <div className="relative h-12 w-12 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "rgba(0,0,0,0.2)" }}>
              <span className="text-[24px] leading-none">🔥</span>
            </div>
            <div className="relative">
              <p className="text-[22px] font-bold text-white leading-none">{streak}-game streak</p>
              <p className="text-[13px] text-white/70 mt-0.5">On a roll — keep it going!</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MEETUPS + TOP GAME ── */}
      <div className="px-4 mb-5">
        <SectionHeader emoji="📊" label="Activity" />
        <div
          className="bg-white rounded-[16px] overflow-hidden"
          style={{ boxShadow: CARD_SHADOW, border: "0.5px solid #f5f5f5" }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f5f5]">
            <div className="h-9 w-9 rounded-[10px] bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-[15px] text-[#737373] flex-1">Meetups attended</span>
            <span className="text-[17px] font-bold text-[#0a0a0a]">{gameStats?.meetupsAttended ?? 0}</span>
          </div>
          {gameStats?.topGame && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-9 w-9 rounded-[10px] bg-purple-50 flex items-center justify-center shrink-0">
                <span className="text-[18px]">🎮</span>
              </div>
              <span className="text-[15px] text-[#737373] flex-1">Top game</span>
              <span className="text-[15px] font-semibold text-[#0a0a0a] max-w-[140px] truncate text-right">{gameStats.topGame}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── BADGES ── */}
      <div className="px-4 mb-5">
        <SectionHeader emoji="🎖️" label="Badges" />
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((badge: Badge) => {
            const earned = badges.some((b) => b.id === badge.id);
            const isFlipped = flippedBadge === badge.id;
            const glow = BADGE_GLOW[badge.type];
            const imgs = BADGE_IMAGES[badge.type];

            return (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
                onClick={() => setFlippedBadge(isFlipped ? null : badge.id)}
              >
                {/* Flip card */}
                <div className="w-full aspect-square" style={{ perspective: "900px" }}>
                  <div
                    style={{
                      transformStyle: "preserve-3d",
                      transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      position: "relative",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {/* ── Front ── */}
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        position: "absolute",
                        inset: 0,
                        filter: earned
                          ? `drop-shadow(0 8px 20px ${glow})`
                          : "grayscale(1) opacity(0.35)",
                      }}
                    >
                      <img src={imgs.front} alt={badge.label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>

                    {/* ── Back ── */}
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        position: "absolute",
                        inset: 0,
                        transform: "rotateY(180deg)",
                        filter: earned ? "none" : "grayscale(1) opacity(0.35)",
                      }}
                    >
                      <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <img src={imgs.back} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        <div style={{ position: "absolute", inset: "20% 12%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <p style={{ fontSize: 11, textAlign: "center", lineHeight: 1.35, color: earned ? "rgba(0,0,0,0.75)" : "#1a1a1a", margin: 0 }}>
                            {badge.description}
                          </p>
                          {!earned && (
                            <p style={{ fontSize: 10, textAlign: "center", color: "#333333", margin: 0 }}>Not yet earned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Label */}
                <span
                  className="text-[12px] font-semibold text-center leading-tight"
                  style={{ color: earned ? "#0a0a0a" : "#d4d4d4" }}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SIGN OUT ── */}
      {isOwnProfile && (
        <div className="px-4">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-[15px] text-red-500 font-medium active:opacity-60 transition-opacity disabled:opacity-40"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}
