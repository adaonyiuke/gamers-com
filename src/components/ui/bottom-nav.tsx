"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Users, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/meetups", label: "Meetups", icon: Layers },
  { href: "/profiles", label: "Players", icon: Users },
  { href: "/games", label: "Games", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 w-full pt-2 z-50 pb-safe"
      style={{
        background: "rgba(249, 249, 249, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "0.5px solid rgba(0,0,0,0.15)",
      }}
    >
      <div className="flex justify-around items-center px-2 pb-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center p-2 w-16 transition-colors",
                isActive ? "text-[#007AFF]" : "text-gray-400"
              )}
            >
              <tab.icon className="h-7 w-7 mb-1" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
