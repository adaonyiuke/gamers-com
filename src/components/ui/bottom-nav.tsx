"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Gamepad2, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupId } from "@/components/providers/group-provider";
import { useGroupMembers } from "@/lib/queries/members";

const tabs = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
    isActive: (p: string) => p === "/dashboard",
  },
  {
    href: "/stats",
    label: "Stats",
    icon: Trophy,
    isActive: (p: string) => p === "/stats",
  },
  {
    href: "/games",
    label: "Games",
    icon: Gamepad2,
    isActive: (p: string) => p.startsWith("/games"),
  },
  {
    href: "/meetups",
    label: "Meetups",
    icon: Layers,
    isActive: (p: string) => p.startsWith("/meetups"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { groupId } = useGroupId();
  const { data: members } = useGroupMembers(groupId);

  const currentMember = members?.find((m: any) => m.user_id === user?.id);

  const initial = (
    currentMember?.display_name?.[0] ||
    user?.user_metadata?.display_name?.[0] ||
    user?.email?.[0] ||
    "?"
  ).toUpperCase();

  const avatarColor = currentMember?.avatar_url ?? "#7c3aed";

  const profileActive = pathname.startsWith("/profiles") || pathname === "/profile" || pathname.startsWith("/settings");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pt-2"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
      }}
    >
      <div className="max-w-[430px] mx-auto px-6">
        <div
          className="flex h-14 items-center justify-between rounded-full px-2"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.2) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "0.5px solid rgba(255,255,255,0.6)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.05)",
          }}
        >
          {tabs.map((tab) => {
            const active = tab.isActive(pathname);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1.5 w-[72px] transition-colors",
                  active ? "text-blue-500" : "text-neutral-500"
                )}
              >
                <tab.icon className="h-6 w-6" />
                <span className="text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </Link>
            );
          })}

          <Link
            href="/profile"
            className={cn(
              "flex flex-col items-center gap-1.5 w-[72px] transition-colors",
              profileActive ? "text-blue-500" : "text-neutral-500"
            )}
          >
            <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: avatarColor }}>
              <span className="text-[11px] font-semibold text-white leading-none">
                {initial}
              </span>
            </div>
            <span className={cn("text-[10px] font-medium leading-none", profileActive ? "text-blue-500" : "text-neutral-500")}>Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
