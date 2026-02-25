"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Gamepad2,
  BarChart3,
  Wrench,
  ChevronLeft,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupMembers } from "@/lib/queries/members";

export default function SettingsHubPage() {
  const router = useRouter();
  const { user } = useUser();
  const { groupId } = useGroupId();
  const { data: members } = useGroupMembers(groupId);

  const isAdmin = useMemo(() => {
    if (!members || !user) return false;
    const me = members.find((m: any) => m.user_id === user.id);
    return me?.role === "owner";
  }, [members, user]);

  const sections = [
    {
      href: "/settings/group",
      icon: Home,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "Group Settings",
      subtitle: "Members, invites & identity",
    },
    {
      href: "/settings/games",
      icon: Gamepad2,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      title: "Game Settings",
      subtitle: "Session rules & animations",
    },
    {
      href: "/settings/dashboard",
      icon: BarChart3,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "Dashboard Settings",
      subtitle: "Leaderboards & streaks",
    },
    ...(isAdmin
      ? [
          {
            href: "/settings/developer",
            icon: Wrench,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            title: "Developer Settings",
            subtitle: "Data tools & debugging",
          },
        ]
      : []),
  ];

  return (
    <div className="pb-36">
      {/* Glass header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[#007AFF] -ml-1.5 active:opacity-60 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="text-[17px]">Back</span>
          </button>
        </div>
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          Settings
        </h1>
      </div>

      <div className="px-5 mt-2 space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-5 py-5 active:scale-[0.98] transition-transform"
            >
              <div
                className={`h-11 w-11 rounded-[13px] ${section.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`h-[22px] w-[22px] ${section.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-semibold text-gray-900">
                  {section.title}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {section.subtitle}
                </p>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-300 rotate-180 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
