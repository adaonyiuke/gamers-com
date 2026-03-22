import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";

// URL-encoded paths for assets with spaces in filenames
const A = {
  trophy:    "/3D%20image%20assets/trophy-render.png",
  star:      "/3D%20image%20assets/star.png",
  starburst: "/3D%20image%20assets/starburst.png",
  rubik:     "/3D%20image%20assets/rubik.png",
  flag:      "/3D%20image%20assets/race%20flag.png",
  hourglass: "/3D%20image%20assets/hourglass.png",
  disc:      "/3D%20image%20assets/asset%2035.png",
};

const MOCK_LEADERBOARD = [
  { name: "Mojoyin", wins: 12, color: "#842AEB", medal: "🥇" },
  { name: "Ada",     wins: 9,  color: "#EBC31C", medal: "🥈" },
  { name: "Aradi",   wins: 7,  color: "#3F48EB", medal: "🥉" },
];

const FEATURES = [
  {
    asset: A.trophy,
    title: "Live Leaderboard",
    desc: "Always know who's on top. Rankings update the moment a game ends.",
  },
  {
    asset: A.hourglass,
    title: "Session Tracking",
    desc: "Record every game, every round, every score. No spreadsheet required.",
  },
  {
    asset: A.star,
    title: "Stats & Streaks",
    desc: "Win rates, hot streaks, top games — know your strengths and your rivals'.",
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#161719]"
      style={{ fontFamily: "'aktiv-grotesk', system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#161719] border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/app-icon.png"
              alt="Game Night"
              width={28}
              height={28}
              className="rounded-[7px]"
            />
            <span className="text-[16px] font-extrabold text-white tracking-tight">
              Game Night
            </span>
          </div>
          <Link
            href="/login"
            className="text-[14px] font-bold text-[#EBC31C]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative overflow-hidden text-center"
        style={{
          background: "linear-gradient(160deg, #160728 0%, #842AEB 100%)",
          paddingTop: "72px",
          paddingBottom: "260px",
        }}
      >
        {/* Confetti overlay */}
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <Image
            src="/3D%20image%20assets/confetti.png"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* 3D asset group — pinned to bottom */}
        <div
          className="absolute bottom-0 left-1/2 pointer-events-none z-20"
          style={{ transform: "translateX(-50%)", width: "130%" }}
        >
          <Image
            src="/3D%20image%20assets/3d%20asset%20group@2x.png"
            alt=""
            width={700}
            height={280}
            className="w-full h-auto"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-sm mx-auto px-5">
          {/* Trophy centerpiece */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Gold glow */}
              <div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: "#EBC31C", opacity: 0.4, transform: "scale(0.85) translateY(16px)" }}
              />
              <Image
                src="/app-icon.png"
                alt="Game Night"
                width={160}
                height={160}
                className="relative rounded-[36px]"
                style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
              />
            </div>
          </div>

          {/* Headline */}
          <h1
            className="font-black text-white tracking-tight leading-none mb-5"
            style={{ fontSize: "clamp(52px, 16vw, 68px)" }}
          >
            Game<br />Night.
          </h1>

          <p
            className="text-[17px] leading-relaxed mb-10"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            The official way to run your game nights — track scores, crown champions, and settle rivalries for good.
          </p>

          <Link
            href="/signup"
            className="block w-full rounded-[16px] py-4 text-[17px] font-black text-center text-[#161719] active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: "#EBC31C",
              boxShadow: "0 8px 32px rgba(235,195,28,0.5)",
            }}
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="block mt-4 text-[15px] font-medium text-center"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Already have an account? Sign In →
          </Link>
        </div>
      </section>

      {/* Mock leaderboard */}
      <section className="max-w-2xl mx-auto px-5 -mt-12 mb-16 relative z-30">
        <div
          className="bg-white rounded-[24px] overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
        >
          {/* Header */}
          <div
            className="px-5 pt-5 pb-4"
            style={{
              background: "linear-gradient(180deg, #3F48EB 0%, #1a1f7a 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 40px rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Leaderboard
            </p>
            <p className="text-[22px] font-black text-white">Friday Crew</p>
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {MOCK_LEADERBOARD.map(({ name, wins, color, medal }) => (
              <div key={name} className="flex items-center gap-3 px-5 py-3.5">
                <span className="text-[20px] w-7 text-center">{medal}</span>
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[14px] font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {name[0]}
                </div>
                <p className="flex-1 text-[16px] font-semibold text-gray-900">{name}</p>
                <div className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[15px] font-semibold text-gray-700">{wins}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Live tag */}
          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[13px] text-gray-500 font-medium">Catan · In progress</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-2xl mx-auto px-5 mb-16">
        <p className="text-[12px] font-bold uppercase tracking-widest text-center mb-2 text-[#842AEB]">
          Everything your group needs
        </p>
        <h2 className="text-[32px] font-black text-white text-center leading-tight mb-8">
          Made for how<br />you actually play
        </h2>
        <div className="space-y-3">
          {FEATURES.map(({ asset, title, desc }) => (
            <div
              key={title}
              className="rounded-[20px] p-5 flex items-center gap-4"
              style={{ backgroundColor: "#1E2023" }}
            >
              <div className="h-14 w-14 rounded-[14px] bg-white shrink-0 flex items-center justify-center overflow-hidden">
                <Image src={asset} alt={title} width={48} height={48} className="object-contain" />
              </div>
              <div>
                <p className="text-[17px] font-bold text-white mb-0.5">{title}</p>
                <p className="text-[14px] leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto px-5 mb-16">
        <div
          className="rounded-[28px] px-8 py-14 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #160728 0%, #842AEB 100%)" }}
        >
          {/* Decorative 3D assets */}
          <div
            className="absolute -top-6 -right-6 pointer-events-none"
            style={{ width: 120, height: 120, opacity: 0.25 }}
          >
            <Image src={A.hourglass} alt="" width={120} height={120} className="object-contain" />
          </div>
          <div
            className="absolute -bottom-4 -left-4 pointer-events-none"
            style={{ width: 96, height: 96, opacity: 0.18 }}
          >
            <Image src={A.starburst} alt="" width={96} height={96} className="object-contain" />
          </div>

          <div className="relative z-10">
            <p className="text-[34px] font-black text-white leading-tight mb-3">
              Game night<br />starts here.
            </p>
            <p className="text-[15px] mb-9" style={{ color: "rgba(255,255,255,0.55)" }}>
              Free to use. No app store required. Works on any phone.
            </p>
            <Link
              href="/signup"
              className="inline-block rounded-[16px] py-4 px-8 text-[17px] font-black text-[#161719] active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: "#EBC31C",
                boxShadow: "0 8px 28px rgba(235,195,28,0.45)",
              }}
            >
              Create Your Group
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image src="/app-icon.png" alt="Game Night" width={20} height={20} className="rounded-[5px]" />
          <span className="text-[14px] font-bold text-white">Game Night</span>
        </div>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          © 2026 Game Night. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
