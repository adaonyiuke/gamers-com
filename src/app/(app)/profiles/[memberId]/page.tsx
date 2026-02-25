"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Gamepad2,
  Trophy,
  TrendingUp,
  Flame,
  Pencil,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import {
  useMemberProfile,
  useMemberStats,
  useGroupMembers,
  useUpdateMember,
} from "@/lib/queries/members";
import {
  computeBadges,
  type MemberBadgeInput,
  type Badge,
} from "@/lib/utils/badges";
import { cn } from "@/lib/utils/cn";

const AVATAR_COLORS = [
  "#007AFF",
  "#FF9500",
  "#FF2D55",
  "#5856D6",
  "#34C759",
  "#AF52DE",
  "#FF3B30",
  "#00C7BE",
];

const BADGE_GRADIENTS: Record<string, string> = {
  champion: "linear-gradient(135deg, #FFD700, #FFA500)",
  on_fire: "linear-gradient(135deg, #FF6B6B, #FF2D55)",
  strategist: "linear-gradient(135deg, #5856D6, #007AFF)",
  wildcard: "linear-gradient(135deg, #34C759, #00C7BE)",
};

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MemberProfilePage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;

  const { user } = useUser();
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: profile, isLoading: profileLoading } =
    useMemberProfile(memberId);
  const { data: allStats, isLoading: statsLoading } = useMemberStats(groupId);
  const { data: members } = useGroupMembers(groupId);
  const updateMember = useUpdateMember();

  // Check if this is the current user's profile
  const isOwnProfile = useMemo(() => {
    if (!profile || !user) return false;
    return profile.user_id === user.id;
  }, [profile, user]);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [editName, setEditName] = useState("");

  // Initialize edit state when profile loads
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
    const eligible = allStats.filter(
      (s: any) => (s.total_sessions ?? 0) >= 5
    );
    if (eligible.length === 0) return false;
    const maxRate = Math.max(...eligible.map((s: any) => s.win_rate ?? 0));
    return (
      (memberStat.win_rate ?? 0) >= maxRate &&
      (memberStat.total_sessions ?? 0) >= 5
    );
  }, [allStats, memberStat]);

  const badges = useMemo(() => {
    if (!memberStat) return [];
    const input: MemberBadgeInput = {
      winRate: memberStat.win_rate ?? 0,
      totalSessions: memberStat.total_sessions ?? 0,
      currentStreak: 0,
      uniqueGameWins: 0,
      hasFirstPlayWin: false,
      isTopWinRate,
    };
    return computeBadges(input);
  }, [memberStat, isTopWinRate]);

  const isLoading = groupLoading || profileLoading || statsLoading;

  const displayName = profile?.display_name ?? "Player";
  const avatarColor =
    profile?.avatar_url || getAvatarColor(displayName);
  const bio = profile?.bio;
  const role = profile?.role;

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
      // Also update localStorage for dashboard avatar
      if (isOwnProfile) {
        localStorage.setItem("avatar_color", editColor);
      }
      setEditing(false);
    } catch {
      // Error shown via mutation state
    }
  }

  const statCards = [
    {
      icon: Gamepad2,
      label: "Sessions",
      value: memberStat?.total_sessions ?? 0,
    },
    {
      icon: Trophy,
      label: "Wins",
      value: memberStat?.total_wins ?? 0,
    },
    {
      icon: TrendingUp,
      label: "Win Rate",
      value:
        memberStat?.win_rate != null
          ? `${Math.round(memberStat.win_rate)}%`
          : "0%",
    },
    {
      icon: Flame,
      label: "Streak",
      value: 0,
    },
  ];

  return (
    <div className="pb-28">
      {/* Glass header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3 flex items-center gap-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center text-[#007AFF] -ml-1 active:opacity-60 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px]">Back</span>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900 flex-1 text-center mr-14 truncate">
          {isLoading ? "" : displayName}
        </h1>
      </div>

      <div className="px-5 mt-4 space-y-5">
        {isLoading ? (
          <>
            <div className="flex flex-col items-center gap-3">
              <SkeletonBlock className="h-[72px] w-[72px] !rounded-full" />
              <SkeletonBlock className="h-6 w-32" />
              <SkeletonBlock className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <SkeletonBlock className="h-3 w-16 mb-3" />
                  <SkeletonBlock className="h-8 w-12" />
                </div>
              ))}
            </div>
          </>
        ) : editing ? (
          /* ---- EDIT MODE ---- */
          <>
            {/* Avatar color picker */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
              <div className="flex justify-center mb-6">
                <div
                  className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-white text-[28px] font-bold transition-colors duration-300"
                  style={{ backgroundColor: editColor }}
                >
                  {(editName || displayName)[0].toUpperCase()}
                </div>
              </div>

              {/* Display name */}
              <div className="mb-5">
                <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Display Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  placeholder="Your name"
                />
              </div>

              {/* Color palette */}
              <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                Avatar Color
              </label>
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
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                  Bio
                </label>
                <span className="text-[13px] text-gray-400">
                  {editBio.length}/200
                </span>
              </div>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Board game enthusiast, pizza lover..."
                rows={3}
                maxLength={200}
                className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
              />
            </div>

            {/* Save / Cancel buttons */}
            {updateMember.error && (
              <div className="bg-red-50 rounded-[14px] px-4 py-3">
                <p className="text-[15px] text-red-600">
                  {(updateMember.error as Error).message ??
                    "Failed to save changes"}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-gray-200 text-gray-900 rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMember.isPending}
                className={cn(
                  "flex-1 bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
                  updateMember.isPending && "opacity-50"
                )}
              >
                {updateMember.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          /* ---- VIEW MODE ---- */
          <>
            {/* Avatar + Name + Bio */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-white text-[28px] font-bold"
                style={{ backgroundColor: avatarColor }}
              >
                {displayName[0].toUpperCase()}
              </div>
              <div className="text-center">
                <h2 className="text-[22px] font-bold text-gray-900">
                  {displayName}
                </h2>
                {role && (
                  <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mt-0.5 capitalize">
                    {role === "owner" ? "Admin" : role}
                  </p>
                )}
                {bio && (
                  <p className="text-[15px] text-gray-500 mt-2 max-w-[280px]">
                    {bio}
                  </p>
                )}
              </div>

              {/* Edit button — only on own profile */}
              {isOwnProfile && (
                <button
                  onClick={() => setEditing(true)}
                  className="mt-2 flex items-center gap-1.5 text-[#007AFF] text-[15px] font-medium active:opacity-60 transition-opacity"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Stats Grid */}
            <div>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Stats
              </p>
              <div className="grid grid-cols-2 gap-3">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <stat.icon className="h-3.5 w-3.5 text-[#007AFF]" />
                      <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-[28px] font-bold tracking-tight text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Badges
              </p>
              {badges.length === 0 ? (
                <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 text-center">
                  <p className="text-[15px] text-gray-400">
                    Play more to earn badges
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge: Badge) => (
                    <div
                      key={badge.id}
                      className="px-4 py-2 rounded-full text-white text-[13px] font-bold shadow-sm"
                      style={{
                        background: BADGE_GRADIENTS[badge.type],
                      }}
                    >
                      {badge.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
