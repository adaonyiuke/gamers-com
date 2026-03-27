"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Circle, ChartSpline, Star } from "lucide-react";
import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const A = {
  trophy: "/3D%20image%20assets/trophy-render.png",
  star: "/3D%20image%20assets/star.png",
  starburst: "/3D%20image%20assets/starburst.png",
  rubik: "/3D%20image%20assets/rubik.png",
  hourglass: "/3D%20image%20assets/hourglass.png",
};

const HERO_FEATURES = [
  {
    icon: Circle,
    title: "Live Leaderboard",
    desc: "Always know who's on top.  Rankings update the moment a game ends.",
    asset: A.trophy,
    rotation: "-rotate-[15deg]",
    screen: {
      label: "Friday Crew",
      title: "Leaderboard",
      rows: [
        { name: "Mojoyin", value: "12", color: "#842AEB", badge: "🥇" },
        { name: "Ada", value: "9", color: "#FFD62A", badge: "🥈" },
        { name: "Aradi", value: "7", color: "#3F48EB", badge: "🥉" },
      ],
    },
  },
  {
    icon: ChartSpline,
    title: "Session Tracking",
    desc: "Record every game, every round, every score. No spreadsheet required.",
    asset: A.hourglass,
    rotation: "-rotate-[35deg]",
    screen: {
      label: "3 games played",
      title: "Game Night #14",
      rows: [
        { name: "Catan", value: "Final", color: "#E87040", badge: "🎲" },
        { name: "Wingspan", value: "Final", color: "#5BA67D", badge: "🐦" },
        { name: "Azul", value: "Live", color: "#4A90D9", badge: "🎨" },
      ],
    },
  },
  {
    icon: Star,
    title: "Stats & Streaks",
    desc: "Win rates, hot streaks, top games — know your strengths and your rivals'.",
    asset: A.starburst,
    rotation: "rotate-[15deg]",
    screen: {
      label: "Mojoyin",
      title: "Player Stats",
      rows: [
        { name: "Win Rate", value: "68%", color: "#842AEB", badge: "🏆" },
        { name: "Win Streak", value: "4", color: "#FFD62A", badge: "🔥" },
        { name: "Games Played", value: "31", color: "#3F48EB", badge: "🎯" },
      ],
    },
  },
];

const FEATURES = [
  {
    initials: "GL",
    title: "BGG Game Library",
    desc: "Add games with our BGG powered game library. All bases have been covered.",
  },
  {
    initials: "MO",
    title: "Meetup Organization",
    desc: 'From "who\'s coming?" to final scores, all in one place. Plan it, run it, complete it.',
  },
  {
    initials: "GP",
    title: "Guest Player Integration",
    desc: "Add a guest, track their scores, and let them in on the rivalry. Account creation not needed.",
  },
  {
    initials: "MP",
    title: "Member Promotion",
    desc: "Promote recurring guests to full members. Their history comes with them.",
  },
  {
    initials: "MG",
    title: "Multi-Group Participation",
    desc: "Play in multiple groups? Switch between them seamlessly. One account, all your game nights.",
  },
  {
    initials: "GT",
    title: "Game Night Toolkit",
    desc: "Scoring modes, round tracking, winner reveals — everything you need to run game night right.",
  },
];

/* ── Placeholder phone screen content ── */
function PhoneScreen({
  screen,
  isActive,
}: {
  screen: (typeof HERO_FEATURES)[number]["screen"];
  isActive: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col bg-[#F2F2F7] p-5 pt-14"
      initial={false}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
        {screen.label}
      </p>
      <p className="text-[22px] font-bold text-gray-900 mb-4">
        {screen.title}
      </p>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {screen.rows.map(({ name, value, color, badge }) => (
          <div
            key={name}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
          >
            <span className="text-base w-6 text-center">{badge}</span>
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {name[0]}
            </div>
            <p className="flex-1 text-sm font-semibold text-gray-900">
              {name}
            </p>
            <span className="text-sm font-semibold text-gray-500">
              {value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Unified hero + scroll-driven phone showcase ── */
function HeroAndShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // First ~25% is the headline area, remaining 75% split across features
    const featureProgress = Math.max(0, (v - 0.2) / 0.75);
    const idx = Math.min(
      HERO_FEATURES.length - 1,
      Math.floor(featureProgress * HERO_FEATURES.length)
    );
    setActiveIndex(idx);
  });

  return (
    <section
      ref={sectionRef}
      className="relative"
      // headline viewport + one viewport per feature + half for exit
      style={{ height: `${HERO_FEATURES.length * 100 + 150}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background gradient — matches Figma Frame 91 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgb(22,7,40) 0%, rgba(132,42,235,0) 50%), linear-gradient(180deg, rgba(132,42,235,0) 0%, rgb(22,23,25) 100%), #842AEB",
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center">
          {/* Headline */}
          <div className="flex flex-col items-center pt-[max(5vh,40px)] gap-3 text-center px-5 shrink-0">
            <h1 className="text-[clamp(36px,5vw,48px)] font-medium text-white leading-[1] max-w-[387px]">
              A scoreboard that settles it
            </h1>
            <p className="text-[clamp(18px,2.5vw,24px)] text-white leading-[1.2] max-w-[571px]">
              Everything your game night needs, in one place.
            </p>
            <Link
              href="/signup"
              className="mt-2 inline-flex items-center gap-2 bg-[#171717] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#171717]/90 transition-colors"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Phone + cards area */}
          <div className="flex-1 w-full max-w-[1200px] mx-auto px-5 flex items-center justify-center">
            <div className="flex items-center justify-center gap-12 lg:gap-20 w-full">
              {/* Phone mockup */}
              <div className="w-[260px] lg:w-[300px] shrink-0">
                <div className="relative rounded-[44px] lg:rounded-[48px] overflow-hidden border-[6px] lg:border-[7px] border-[#2a2a2e] shadow-2xl aspect-[9/19.3]">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[80px] lg:w-[90px] h-[22px] lg:h-[24px] bg-black rounded-full z-20" />
                  <div className="absolute inset-0 z-10">
                    {HERO_FEATURES.map((feature, i) => (
                      <PhoneScreen
                        key={feature.title}
                        screen={feature.screen}
                        isActive={activeIndex === i}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature cards — desktop */}
              <div className="hidden lg:flex flex-col gap-5 w-[420px]">
                {HERO_FEATURES.map((feature, i) => {
                  const Icon = feature.icon;
                  const isActive = activeIndex === i;
                  return (
                    <motion.div
                      key={feature.title}
                      className="flex items-center"
                      initial={false}
                      animate={{
                        opacity: isActive ? 1 : 0.25,
                        x: isActive ? 0 : 16,
                      }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <div
                        className={`bg-black/60 border rounded-xl p-4 backdrop-blur-sm shadow-md transition-colors duration-300 ${
                          isActive ? "border-white/30" : "border-white/10"
                        }`}
                      >
                        <div className="flex flex-col gap-1 w-[300px]">
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className="size-4 text-white/80"
                              {...(feature.icon === Circle
                                ? { fill: "currentColor" }
                                : {})}
                            />
                            <span className="text-lg font-medium text-white">
                              {feature.title}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`relative -ml-2 shrink-0 ${feature.rotation}`}
                      >
                        <Image
                          src={feature.asset}
                          alt=""
                          width={80}
                          height={100}
                          className="object-contain drop-shadow-lg w-auto h-auto"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GridFeatureCard({
  initials,
  title,
  desc,
}: (typeof FEATURES)[number]) {
  return (
    <div className="bg-black/60 border border-white/15 rounded-xl p-4 shadow-md flex items-start gap-3">
      <div className="size-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-white">{initials}</span>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-lg font-medium text-white">{title}</span>
        <p className="text-sm text-white/80 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#161719] overflow-x-clip"
      style={{ fontFamily: "'aktiv-grotesk', system-ui, sans-serif" }}
    >
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex justify-center pt-5 px-5">
        <div className="w-full max-w-[988px] bg-white/95 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between shadow-lg shadow-black/10">
          <div className="flex items-center gap-5">
            <Image
              src="/clubplay-logo.svg"
              alt="clubplay.io"
              width={65}
              height={30}
            />
            <div className="w-px h-[30px] bg-gray-200" />
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/app-icon.png"
                alt=""
                width={30}
                height={30}
                className="rounded-[6.5px]"
              />
              <Image
                src="/game-night-wordmark.svg"
                alt="Game Night"
                width={138}
                height={25}
                className="translate-y-[1.5px]"
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 text-sm font-medium text-white bg-[#171717] rounded-lg hover:bg-[#171717]/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-[80px]" />

      {/* ─── Hero + Scroll-driven Phone Showcase ─── */}
      <HeroAndShowcase />

      {/* ─── Mobile feature cards (stacked, no scroll animation) ─── */}
      <div className="lg:hidden relative z-10 max-w-md mx-auto px-5 -mt-[50vh] mb-16 space-y-3">
        {HERO_FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-black/60 border border-white/15 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2.5 mb-1">
              <Icon
                className="size-4 text-white/80"
                {...(Icon === Circle ? { fill: "currentColor" } : {})}
              />
              <span className="text-lg font-medium text-white">{title}</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* ─── Features Grid ─── */}
      <section className="relative z-10 max-w-[1029px] mx-auto px-5">
        <div className="flex flex-col items-center gap-4 mb-7 max-w-[571px] mx-auto text-center">
          <h2 className="text-[clamp(36px,5vw,48px)] font-medium text-white leading-[48px]">
            Features
          </h2>
          <p className="text-[clamp(18px,2.5vw,24px)] text-white leading-[1.2]">
            Everything your game night needs, in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-[18px]">
          {FEATURES.map((feature) => (
            <GridFeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA Cards ─── */}
      <section className="relative z-10 max-w-[760px] mx-auto px-5 mt-20 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="relative rounded-xl border border-white/15 p-4 h-[368px] flex flex-col overflow-hidden shadow-md"
            style={{
              background:
                "linear-gradient(205deg, #7520E4 8.5%, #030105 91.5%)",
            }}
          >
            <div className="absolute right-[-20px] bottom-[-20px] rotate-[64deg] pointer-events-none">
              <Image
                src={A.rubik}
                alt=""
                width={240}
                height={210}
                className="object-contain opacity-90 w-auto h-auto"
              />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full p-2">
              <div className="flex flex-col gap-4">
                <h3 className="text-[30px] font-semibold text-white leading-[30px] tracking-tight max-w-[274px]">
                  Game night starts here.
                </h3>
                <p className="text-lg text-white leading-6 max-w-[289px]">
                  Free to use. No app store required. Works on any phone.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#171717] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#171717]/90 transition-colors w-fit"
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div
            className="relative rounded-xl border border-white/15 p-4 h-[368px] flex flex-col overflow-hidden shadow-md"
            style={{
              background:
                "linear-gradient(205deg, #2563EB 8.5%, #010205 91.5%)",
            }}
          >
            <div className="absolute right-[-30px] bottom-[-20px] pointer-events-none">
              <Image
                src={A.star}
                alt=""
                width={260}
                height={270}
                className="object-contain opacity-90 w-auto h-auto"
              />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full p-2">
              <div className="flex flex-col gap-4">
                <h3 className="text-[30px] font-semibold text-white leading-[30px] tracking-tight">
                  Frequently Asked Questions
                </h3>
                <p className="text-base text-white leading-6">
                  Always know who&apos;s on top. Rankings update the moment a
                  game ends.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#171717] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#171717]/90 transition-colors w-fit"
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.08] py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image
            src="/app-icon.png"
            alt="Game Night"
            width={20}
            height={20}
            className="rounded-[5px]"
          />
          <span className="text-sm font-bold text-white">Game Night</span>
        </div>
        <p className="text-[13px] text-white/30">
          &copy; 2026 Game Night. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
