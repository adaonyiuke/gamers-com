"use client";

import Link from "next/link";
import { Calendar, Users, Gamepad2, Trophy, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";

interface MeetupSessionCardProps {
  href: string;
  title: string;
  date: string;
  status: "active" | "complete" | "planned";
  participantCount?: number;
  gamesCount?: number;
  winnerName?: string;
}

const VARIANTS = {
  active: {
    gradient: "linear-gradient(180.59deg, rgb(91,33,182) 5.5%, rgb(168,85,247) 114%)",
    radial: "radial-gradient(ellipse at 100% 100%, rgba(236,72,153,0.8) 0%, rgba(180,65,195,0.4) 40%, rgba(124,58,236,0) 70%)",
    tagLabel: "LIVE",
    tagColor: "#4ade80" as const,
    showDot: true,
  },
  complete: {
    gradient: "linear-gradient(180.59deg, rgb(41,37,36) 5.5%, rgb(113,113,122) 114%)",
    radial: "radial-gradient(ellipse at 100% 100%, rgba(113,113,122,0.7) 0%, rgba(99,98,105,0) 70%)",
    tagLabel: "LAST MEETUP",
    tagColor: "#a3a3a3" as const,
    showDot: false,
  },
  planned: {
    gradient: "linear-gradient(180.59deg, rgb(55,48,163) 5.5%, rgb(14,165,233) 114%)",
    radial: "radial-gradient(ellipse at 100% 100%, rgba(34,211,238,0.9) 0%, rgba(57,173,238,0.5) 30%, rgba(79,135,237,0.3) 55%, rgba(124,58,236,0) 80%)",
    tagLabel: "NEXT MEETUP",
    tagColor: "rgba(255,255,255,0.6)" as const,
    showDot: false,
  },
} as const;

export function MeetupSessionCard({
  href,
  title,
  date,
  status,
  participantCount,
  gamesCount,
  winnerName,
}: MeetupSessionCardProps) {
  const v = VARIANTS[status];

  return (
    <Link href={href} className="block active:scale-[0.98] transition-transform">
      <div
        className="relative rounded-[16px] p-4 overflow-hidden"
        style={{ background: v.gradient, boxShadow: "0px 25px 50px rgba(0,0,0,0.1)" }}
      >
        {/* Radial corner overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: v.radial }} />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {/* Tag */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-[12px] self-start"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              {v.showDot && (
                <div className="h-2 w-2 rounded-full bg-[#4ade80]" />
              )}
              <span
                className="text-[12px] font-medium tracking-[1px] uppercase"
                style={{ color: v.tagColor }}
              >
                {v.tagLabel}
              </span>
            </div>

            {/* Title + info */}
            <div className="flex flex-col gap-2">
              <p className="text-[20px] font-semibold text-white leading-6 truncate">
                {title}
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/80 shrink-0" />
                  <span className="text-[14px] text-white whitespace-nowrap">{formatDate(date)}</span>
                </div>

                {status !== "complete" && participantCount !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-white/80 shrink-0" />
                    <span className="text-[14px] text-white whitespace-nowrap">
                      {participantCount} {status === "planned" ? "RSVP" : "attendees"}
                    </span>
                  </div>
                )}

                {status === "complete" && winnerName && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-white/80 shrink-0" />
                    <span className="text-[14px] text-white whitespace-nowrap truncate max-w-[100px]">{winnerName}</span>
                  </div>
                )}

                {status === "complete" && !!gamesCount && (
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-white/80 shrink-0" />
                    <span className="text-[14px] text-white whitespace-nowrap">{gamesCount} games</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="h-6 w-6 text-white/50 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
