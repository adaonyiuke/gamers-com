"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Users, Trophy, ChevronRight } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useGroupMembers, useMemberStats } from "@/lib/queries/members";
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

export default function ProfilesPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: members, isLoading: membersLoading } =
    useGroupMembers(groupId);
  const { data: stats, isLoading: statsLoading } = useMemberStats(groupId);

  const isLoading = groupLoading || membersLoading || statsLoading;

  const membersWithStats = useMemo(() => {
    if (!members) return [];
    return members.map((m: any) => {
      const memberStat = stats?.find((s: any) => s.member_id === m.id);
      return {
        ...m,
        totalWins: memberStat?.total_wins ?? 0,
      };
    });
  }, [members, stats]);

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
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          Players
        </h1>
      </div>

      <div className="px-5 mt-2">
        {isLoading ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="divide-y divide-gray-100">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <SkeletonBlock className="h-11 w-11 !rounded-full" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="h-3 w-16" />
                  </div>
                  <SkeletonBlock className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>
        ) : membersWithStats.length === 0 ? (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-10 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[17px] font-semibold text-gray-900 mb-1">
              No players yet
            </p>
            <p className="text-[15px] text-gray-500">
              Invite friends to your group to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="divide-y divide-gray-100">
              {membersWithStats.map((member: any) => (
                <Link
                  key={member.id}
                  href={`/profiles/${member.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
                >
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center text-white text-[17px] font-bold shrink-0"
                    style={{
                      backgroundColor: getAvatarColor(
                        member.display_name ?? ""
                      ),
                    }}
                  >
                    {(member.display_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[17px] font-semibold text-gray-900 truncate">
                        {member.display_name}
                      </p>
                      {member.role === "owner" && (
                        <span className="text-[11px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Trophy className="h-3 w-3 text-gray-400" />
                      <p className="text-[13px] text-gray-500">
                        {member.totalWins}{" "}
                        {member.totalWins === 1 ? "win" : "wins"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
