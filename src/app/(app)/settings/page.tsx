"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Gamepad2,
  BarChart3,
  Wrench,
  Users,
  User,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupMembers } from "@/lib/queries/members";
import { createClient } from "@/lib/supabase/client";

export default function SettingsHubPage() {
  const { user } = useUser();
  const { groupId } = useGroupId();
  const { data: members } = useGroupMembers(groupId);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear any persisted group selection
    if (typeof window !== "undefined") {
      localStorage.removeItem("selected_group_id");
    }
    router.push("/login");
  }

  const isAdmin = useMemo(() => {
    if (!members || !user) return false;
    const me = members.find((m: any) => m.user_id === user.id);
    return me?.role === "owner";
  }, [members, user]);

  const sections = [
    {
      href: "/settings/account",
      icon: User,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      title: "Account",
      subtitle: "Name, email, password & avatar",
    },
    {
      href: "/settings/groups",
      icon: Users,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      title: "Your Groups",
      subtitle: "Switch, create, or join groups",
    },
    {
      href: "/settings/group",
      icon: Home,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "Group Settings",
      subtitle: isAdmin ? "Members, invites & identity" : "View members & share invite",
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
      <PageHeader title="Settings" backLabel="Profile" backHref="/profile" variant="large" />

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

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-4 bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-5 py-5 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <div className="h-11 w-11 rounded-[13px] bg-red-50 flex items-center justify-center shrink-0">
            <LogOut className="h-[22px] w-[22px] text-red-500" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[17px] font-semibold text-red-500">
              {loggingOut ? "Signing out..." : "Sign Out"}
            </p>
            <p className="text-[13px] text-gray-400 mt-0.5">
              {user?.email ?? ""}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
