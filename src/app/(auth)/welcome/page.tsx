"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(132,42,235,0) 0%, rgb(10,10,10) 72%), linear-gradient(180deg, rgb(22,7,40) 0%, rgb(132,42,235) 100%)",
      }}
    >
      {/* Header: Club Play + (app) */}
      <div className="relative z-10 flex w-full max-w-[372px] items-center justify-between px-6 pt-[env(safe-area-inset-top,48px)] mt-2">
        <Image
          src="/welcome/clubplay-logo.svg"
          alt="Club Play"
          width={140}
          height={20}
          priority
        />
        <Image
          src="/welcome/app-badge.svg"
          alt="app"
          width={65}
          height={22}
        />
      </div>

      {/* Combined splash image: trophy + Game Night title */}
      <div
        className="relative z-0 flex flex-1 w-full items-center justify-center"
        style={{
          mixBlendMode: "lighten",
          maskImage: "linear-gradient(to bottom, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 92%, transparent 100%)",
        }}
      >
        <Image
          src="/welcome/splash-combined.png"
          alt="Game Night"
          width={1320}
          height={1669}
          className="w-full max-w-[440px] h-auto object-contain"
          priority
        />
      </div>

      {/* Bottom: Tagline + CTAs */}
      <div className="relative z-10 flex w-full flex-col items-center gap-[38px] px-8 pb-[calc(env(safe-area-inset-bottom,20px)+40px)]">
        <p className="max-w-[314px] text-center text-[20px] leading-[24px] text-[#f5f5f5]">
          Everything your game night needs, in one place.
        </p>

        <div className="flex w-full max-w-[310px] flex-col items-center gap-3.5">
          <Link
            href="/signup"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#9333ea] text-base font-medium text-[#fafafa] transition-all active:scale-[0.97] active:brightness-90"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center gap-2 text-base font-medium"
          >
            <span className="text-[#737373]">Already have an account?</span>
            <span className="text-[#f5f5f5]">&nbsp;Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
