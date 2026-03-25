"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Home,
  Gamepad2,
  Layers,
  Users,
  Trophy,
  Star,
  Settings,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ═══════════════════════════════════════════════════════════════
   Design tokens
   ═══════════════════════════════════════════════════════════════ */

const COLORS = {
  yellow: { value: "#FFD62A", label: "Yellow (Primary)" },
  purple: { value: "#842AEB", label: "Purple" },
  blue: { value: "#3F48EB", label: "Blue" },
  black: { value: "#161719", label: "Black" },
} as const;

const GRADIENTS = [
  {
    label: "Purple gradient",
    css: "linear-gradient(135deg, #160728 0%, #842AEB 100%)",
    desc: "Hero / dark sections",
  },
  {
    label: "Grey gradient",
    css: "linear-gradient(135deg, #D9D9D9 0%, #B8B8B8 100%)",
    desc: "Secondary cards",
  },
] as const;

const CHART_COLORS = [
  { var: "--chart-1", value: "#FFD62A", label: "Chart 1 — Yellow (primary)" },
  { var: "--chart-2", value: "#842AEB", label: "Chart 2 — Purple" },
  { var: "--chart-3", value: "#3F48EB", label: "Chart 3 — Blue" },
  { var: "--chart-4", value: "#FFD62A99", label: "Chart 4 — Yellow 60%" },
  { var: "--chart-5", value: "#FFD62A33", label: "Chart 5 — Yellow 20%" },
] as const;

const NEUTRALS = {
  background: { value: "#F2F2F7", label: "Background" },
  white: { value: "#FFFFFF", label: "Card / Surface" },
  gray100: { value: "#F2F2F7", label: "Gray 100 (bg)" },
  gray300: { value: "#C7C7CC", label: "Gray 300 (toggle off)" },
  gray400: { value: "#9CA3AF", label: "Gray 400 (placeholder)" },
  gray500: { value: "#6B7280", label: "Gray 500 (secondary text)" },
  gray900: { value: "#111827", label: "Gray 900 (primary text)" },
  black: { value: "#000000", label: "Foreground" },
} as const;

const RADII = [
  { value: "rounded-[10px]", label: "10px", desc: "Buttons, small pills" },
  { value: "rounded-[14px]", label: "14px", desc: "Game tiles, inputs" },
  { value: "rounded-[20px]", label: "20px", desc: "Cards, sections" },
  { value: "rounded-[24px]", label: "24px", desc: "Modals, sheets" },
  { value: "rounded-full", label: "Full", desc: "Avatars, toggles" },
] as const;

const SHADOWS = [
  {
    label: "Card",
    css: "0 2px 8px rgba(0,0,0,0.04)",
    tw: "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
  },
  {
    label: "Elevated",
    css: "0 4px 16px rgba(0,0,0,0.08)",
    tw: "shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
  },
  {
    label: "Modal",
    css: "0 25px 50px -12px rgba(0,0,0,0.25)",
    tw: "shadow-2xl",
  },
] as const;

const TYPE_SCALE = [
  { size: "34px", weight: "Bold", use: "Page title (large variant)", tw: "text-[34px] font-bold tracking-tight" },
  { size: "22px", weight: "Bold", use: "Section heading", tw: "text-[22px] font-bold" },
  { size: "17px", weight: "Regular / Semibold", use: "Body text, nav titles", tw: "text-[17px]" },
  { size: "15px", weight: "Regular / Medium", use: "Secondary body, buttons", tw: "text-[15px]" },
  { size: "13px", weight: "Regular / Semibold", use: "Captions, labels, section headers", tw: "text-[13px]" },
  { size: "10px", weight: "Medium", use: "Tab bar labels", tw: "text-[10px] font-medium" },
] as const;

const SPACING = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

/* ═══════════════════════════════════════════════════════════════
   Motion presets (codified from existing patterns)
   ═══════════════════════════════════════════════════════════════ */

const MOTION_PRESETS = {
  fadeUp: {
    label: "Fade Up",
    desc: "Content entrance — text, cards",
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  springScale: {
    label: "Spring Scale",
    desc: "Emphasis entrance — icons, badges",
    initial: { scale: 0, rotate: -20 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: "spring" as const, stiffness: 200, damping: 12 },
  },
  fadeIn: {
    label: "Fade In",
    desc: "Overlay / backdrop entrance",
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  pressScale: {
    label: "Press Scale",
    desc: "Tap feedback on interactive elements",
    whileTap: { scale: 0.96 },
    transition: { type: "spring" as const, stiffness: 400, damping: 17 },
  },
} as const;

/* ═══════════════════════════════════════════════════════════════
   Shared sub-components for the lab
   ═══════════════════════════════════════════════════════════════ */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-[22px] font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function TokenCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5">
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-[13px] bg-gray-100 text-gray-600 rounded-[6px] px-1.5 py-0.5 font-mono">
      {children}
    </code>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main lab page
   ═══════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { id: "colors", label: "Colors" },
  { id: "charts", label: "Charts" },
  { id: "typography", label: "Type" },
  { id: "spacing", label: "Spacing" },
  { id: "radii", label: "Radii" },
  { id: "shadows", label: "Shadows" },
  { id: "glass", label: "Glass" },
  { id: "components", label: "Components" },
  { id: "motion", label: "Motion" },
  { id: "patterns", label: "Patterns" },
] as const;

export function UILabContent() {
  const [activeSection, setActiveSection] = useState("colors");

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Header */}
      <div
        className="sticky top-0 z-50 border-b border-black/5"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-[10px] bg-[#FFD62A] flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#161719]" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold text-gray-900">
                UI Lab
              </h1>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                Dev only
              </p>
            </div>
          </div>

          {/* Section nav */}
          <nav className="flex gap-1 overflow-x-auto no-scrollbar -mx-5 px-5">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  activeSection === item.id
                    ? "bg-[#FFD62A] text-[#161719]"
                    : "bg-white/60 text-gray-500 hover:text-gray-700"
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-12">
        {/* ── Colors ──────────────────────────────────────────── */}
        <Section id="colors" title="Colors">
          <div className="space-y-4">
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Brand
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(COLORS).map(([key, { value, label }]) => (
                  <div key={key} className="space-y-1.5">
                    <div
                      className="h-14 rounded-[14px] border border-black/5"
                      style={{ backgroundColor: value }}
                    />
                    <p className="text-[13px] font-medium text-gray-900">
                      {label}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </TokenCard>

            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Gradients
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GRADIENTS.map((g) => (
                  <div key={g.label} className="space-y-1.5">
                    <div
                      className="h-14 rounded-[14px]"
                      style={{ background: g.css }}
                    />
                    <p className="text-[13px] font-medium text-gray-900">{g.label}</p>
                    <p className="text-[11px] text-gray-400">{g.desc}</p>
                  </div>
                ))}
              </div>
            </TokenCard>

            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Neutrals
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(NEUTRALS).map(([key, { value, label }]) => (
                  <div key={key} className="space-y-1.5">
                    <div
                      className="h-14 rounded-[14px] border border-gray-200"
                      style={{ backgroundColor: value }}
                    />
                    <p className="text-[13px] font-medium text-gray-900">
                      {label}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </TokenCard>
          </div>
        </Section>

        {/* ── Charts ──────────────────────────────────────────── */}
        <Section id="charts" title="Chart Colors">
          <div className="space-y-4">
            <TokenCard>
              <p className="text-[13px] text-gray-500 mb-4">
                CSS variables used by <Code>recharts</Code> via shadcn chart primitives. Monochromatic approach — one color per card with opacity steps for inactive bars.
              </p>
              <div className="space-y-3">
                {CHART_COLORS.map((c) => (
                  <div key={c.var} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[10px] shrink-0 border border-black/5"
                      style={{ backgroundColor: c.value }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900">{c.label}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{c.var}</p>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono shrink-0">{c.value}</p>
                  </div>
                ))}
              </div>
            </TokenCard>

            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Monochromatic Bar Pattern
              </p>
              <p className="text-[13px] text-gray-500 mb-4">
                Active bar: <Code>--chart-1</Code> · Semi-active: <Code>--chart-4</Code> (60%) · Inactive: <Code>--chart-5</Code> (20%) · Highlight: white
              </p>
              <div className="flex items-end gap-2 h-24 px-2">
                {[40, 65, 50, 100, 35, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-[6px] rounded-b-[6px]"
                    style={{
                      height: `${h}%`,
                      backgroundColor:
                        i === 3
                          ? "#ffffff"
                          : i === 1 || i === 5
                          ? "#FFD62A99"
                          : "#FFD62A33",
                      border: i === 3 ? "1.5px solid #FFD62A" : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-end gap-2 px-2 mt-1">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                  <p key={m} className="flex-1 text-center text-[10px] text-gray-400">{m}</p>
                ))}
              </div>
            </TokenCard>
          </div>
        </Section>

        {/* ── Typography ──────────────────────────────────────── */}
        <Section id="typography" title="Typography">
          <TokenCard>
            <p className="text-[13px] text-gray-500 mb-4">
              System font stack:{" "}
              <Code>-apple-system, SF Pro Text, …</Code>
            </p>
            <div className="space-y-4 divide-y divide-gray-100">
              {TYPE_SCALE.map((t) => (
                <div key={t.size} className="pt-4 first:pt-0">
                  <p className={cn(t.tw, "text-gray-900 mb-1")}>
                    The quick brown fox
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <p className="text-[13px] text-gray-400">
                      {t.size} · {t.weight}
                    </p>
                    <p className="text-[13px] text-gray-500">{t.use}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">
                    {t.tw}
                  </p>
                </div>
              ))}
            </div>
          </TokenCard>
        </Section>

        {/* ── Spacing ─────────────────────────────────────────── */}
        <Section id="spacing" title="Spacing">
          <TokenCard>
            <p className="text-[13px] text-gray-500 mb-4">
              Spacing scale used throughout the app. Standard Tailwind values.
            </p>
            <div className="space-y-2">
              {SPACING.map((px) => (
                <div key={px} className="flex items-center gap-3">
                  <span className="text-[13px] text-gray-400 font-mono w-10 text-right">
                    {px}px
                  </span>
                  <div
                    className="h-4 rounded-[4px] bg-[#FFD62A]/30"
                    style={{ width: px * 3 }}
                  />
                  <span className="text-[11px] text-gray-400 font-mono">
                    {px / 4}
                  </span>
                </div>
              ))}
            </div>
          </TokenCard>
        </Section>

        {/* ── Border Radii ────────────────────────────────────── */}
        <Section id="radii" title="Border Radii">
          <TokenCard>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {RADII.map((r) => (
                <div key={r.label} className="text-center space-y-2">
                  <div
                    className={cn(
                      "w-16 h-16 mx-auto bg-[#FFD62A]/15 border-2 border-[#FFD62A]/40",
                      r.value
                    )}
                  />
                  <p className="text-[15px] font-semibold text-gray-900">
                    {r.label}
                  </p>
                  <p className="text-[11px] text-gray-400">{r.desc}</p>
                </div>
              ))}
            </div>
          </TokenCard>
        </Section>

        {/* ── Shadows ─────────────────────────────────────────── */}
        <Section id="shadows" title="Shadows">
          <TokenCard>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {SHADOWS.map((s) => (
                <div key={s.label} className="text-center space-y-3">
                  <div
                    className="w-full h-20 rounded-[20px] bg-white"
                    style={{ boxShadow: s.css }}
                  />
                  <p className="text-[15px] font-semibold text-gray-900">
                    {s.label}
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">{s.tw}</p>
                </div>
              ))}
            </div>
          </TokenCard>
        </Section>

        {/* ── Glass ───────────────────────────────────────────── */}
        <Section id="glass" title="Glassmorphism">
          <TokenCard>
            <p className="text-[13px] text-gray-500 mb-4">
              Used on sticky headers & bottom nav. <Code>backdrop-filter: blur(20px)</Code>
            </p>
            <div className="relative h-40 rounded-[20px] overflow-hidden">
              {/* Brand color background */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-[#842AEB]" />
                <div className="flex-1 bg-[#FFD62A]" />
                <div className="flex-1 bg-[#3F48EB]" />
                <div className="flex-1 bg-[#161719]" />
              </div>
              {/* Glass overlay */}
              <div
                className="absolute inset-x-0 bottom-0 h-20 flex items-center justify-center"
                style={{
                  background: "rgba(249, 249, 249, 0.85)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderTop: "0.5px solid rgba(0,0,0,0.15)",
                }}
              >
                <p className="text-[15px] font-medium text-gray-700">
                  Glass surface
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[11px] text-gray-400 font-mono">
                background: rgba(249, 249, 249, 0.85)
              </p>
              <p className="text-[11px] text-gray-400 font-mono">
                backdrop-filter: blur(20px)
              </p>
              <p className="text-[11px] text-gray-400 font-mono">
                border-top: 0.5px solid rgba(0,0,0,0.15)
              </p>
            </div>
          </TokenCard>
        </Section>

        {/* ── Components ──────────────────────────────────────── */}
        <Section id="components" title="Components">
          <div className="space-y-6">
            {/* Buttons */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Buttons
              </p>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button className="bg-[#FFD62A] text-[#161719] text-[15px] font-semibold px-5 py-3 rounded-[14px] active:opacity-80 transition-opacity">
                    Primary
                  </button>
                  <button className="bg-[#842AEB] text-white text-[15px] font-semibold px-5 py-3 rounded-[14px] active:opacity-80 transition-opacity">
                    Purple
                  </button>
                  <button className="bg-[#F2F2F7] text-gray-700 text-[15px] font-medium px-5 py-3 rounded-[14px] active:opacity-80 transition-opacity">
                    Secondary
                  </button>
                  <button className="bg-[#FF3B30] text-white text-[15px] font-semibold px-5 py-3 rounded-[14px] active:opacity-80 transition-opacity">
                    Destructive
                  </button>
                </div>
                <div className="flex gap-3">
                  <button className="text-[#842AEB] text-[17px] active:opacity-60 transition-opacity flex items-center gap-1">
                    <ChevronLeft className="h-6 w-6" />
                    <span>Back</span>
                  </button>
                  <button className="text-[#842AEB] text-[17px] font-semibold active:opacity-60 transition-opacity">
                    Save
                  </button>
                </div>
              </div>
            </TokenCard>

            {/* Toggle */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Toggle
              </p>
              <ToggleDemo />
            </TokenCard>

            {/* Segmented control */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Segmented Control
              </p>
              <SegmentDemo />
            </TokenCard>

            {/* Stepper */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Stepper
              </p>
              <StepperDemo />
            </TokenCard>

            {/* Setting rows */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Setting Rows
              </p>
              <div className="rounded-[14px] overflow-hidden divide-y divide-gray-100 border border-gray-100">
                <button className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-gray-50 transition-colors">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] text-gray-900">General</p>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                      App preferences
                    </p>
                  </div>
                  <span className="text-[15px] text-gray-400">English</span>
                  <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180" />
                </button>
                <button className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-gray-50 transition-colors">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] text-gray-900">Members</p>
                  </div>
                  <span className="text-[15px] text-gray-400">8</span>
                  <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180" />
                </button>
                <button className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] text-red-500">Leave Group</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180" />
                </button>
              </div>
            </TokenCard>

            {/* Game tiles */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Game Tiles
              </p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { abbr: "CA", color: "#FFD62A", text: "#161719" },
                  { abbr: "TM", color: "#842AEB", text: "#ffffff" },
                  { abbr: "WS", color: "#3F48EB", text: "#ffffff" },
                  { abbr: "SC", color: "#161719", text: "#FFD62A" },
                  { abbr: "7W", color: "#842AEB", text: "#ffffff" },
                ].map(({ abbr, color, text }) => (
                  <div
                    key={abbr}
                    className="rounded-[14px] flex items-center justify-center text-[22px] font-bold"
                    style={{ width: 64, height: 64, backgroundColor: color, color: text }}
                  >
                    {abbr}
                  </div>
                ))}
                {[
                  { abbr: "CA", color: "#FFD62A", text: "#161719" },
                  { abbr: "TM", color: "#842AEB", text: "#ffffff" },
                  { abbr: "WS", color: "#3F48EB", text: "#ffffff" },
                ].map(({ abbr, color, text }) => (
                  <div
                    key={`sm-${abbr}`}
                    className="rounded-[10px] flex items-center justify-center text-[17px] font-bold"
                    style={{ width: 48, height: 48, backgroundColor: color, color: text }}
                  >
                    {abbr}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Large: 64×64 rounded-[14px] · Small: 48×48 rounded-[10px]
              </p>
            </TokenCard>

            {/* Search input */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Search Input
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search games…"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#E5E5EA] rounded-[10px] text-[17px] text-gray-900 placeholder:text-gray-400 outline-none"
                  readOnly
                />
              </div>
            </TokenCard>

            {/* Icons */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Icon Set (Lucide)
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  Home,
                  Gamepad2,
                  Layers,
                  Users,
                  Trophy,
                  Star,
                  Settings,
                  Plus,
                  Search,
                  X,
                  ChevronLeft,
                ].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-10 h-10 rounded-[10px] bg-[#F2F2F7] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {Icon.displayName}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                Using <Code>lucide-react</Code> · Default stroke width
              </p>
            </TokenCard>
          </div>
        </Section>

        {/* ── Motion ──────────────────────────────────────────── */}
        <Section id="motion" title="Motion">
          <div className="space-y-4">
            <TokenCard>
              <p className="text-[13px] text-gray-500 mb-4">
                Using <Code>framer-motion</Code>. Click each card to replay.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(MOTION_PRESETS).map(([key, preset]) => (
                  <MotionDemo key={key} preset={preset} />
                ))}
              </div>
            </TokenCard>

            {/* Confetti demo */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Confetti Particles
              </p>
              <ConfettiDemo />
            </TokenCard>

            {/* Stagger demo */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Stagger List
              </p>
              <StaggerDemo />
            </TokenCard>
          </div>
        </Section>

        {/* ── Patterns ────────────────────────────────────────── */}
        <Section id="patterns" title="Page Patterns">
          <div className="space-y-4">
            {/* Card pattern */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Card Layout
              </p>
              <div className="max-w-[430px] mx-auto space-y-3">
                <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-[14px] bg-[#FFD62A] flex items-center justify-center text-[#161719] font-bold">
                      CA
                    </div>
                    <div className="flex-1">
                      <p className="text-[17px] font-semibold text-gray-900">
                        Catan
                      </p>
                      <p className="text-[13px] text-gray-500">
                        3–4 players · Strategy
                      </p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180" />
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[22px] font-bold text-gray-900">12</p>
                      <p className="text-[11px] text-gray-400">Plays</p>
                    </div>
                    <div>
                      <p className="text-[22px] font-bold text-[#FFD62A]">
                        67%
                      </p>
                      <p className="text-[11px] text-gray-400">Win rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </TokenCard>

            {/* Empty state */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Empty State
              </p>
              <div className="max-w-[430px] mx-auto py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#F2F2F7] flex items-center justify-center mb-4">
                  <Gamepad2 className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-[17px] font-semibold text-gray-900 mb-1">
                  No games yet
                </p>
                <p className="text-[15px] text-gray-500 mb-6 max-w-[260px]">
                  Add your first game to start tracking sessions and stats.
                </p>
                <button className="bg-[#FFD62A] text-[#161719] text-[15px] font-semibold px-6 py-3 rounded-[14px] flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Game
                </button>
              </div>
            </TokenCard>

            {/* Header pattern */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Page Headers
              </p>
              <div className="max-w-[430px] mx-auto space-y-4">
                {/* Large variant */}
                <div
                  className="rounded-[14px] overflow-hidden border border-gray-200"
                >
                  <div className="px-5 pt-4 pb-3" style={{ background: "rgba(242,242,247,0.95)" }}>
                    <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
                      Games
                    </h1>
                  </div>
                  <div className="h-8 bg-white" />
                </div>
                {/* Back variant */}
                <div
                  className="rounded-[14px] overflow-hidden border border-gray-200"
                >
                  <div
                    className="px-5 pt-4 pb-3 flex items-center gap-3"
                    style={{ background: "rgba(242,242,247,0.95)" }}
                  >
                    <div className="flex items-center text-[#842AEB] -ml-1">
                      <ChevronLeft className="h-6 w-6" />
                      <span className="text-[17px]">Games</span>
                    </div>
                    <h1 className="text-[17px] font-semibold text-gray-900 flex-1 text-center">
                      Catan
                    </h1>
                    <div className="w-14" />
                  </div>
                  <div className="h-8 bg-white" />
                </div>
              </div>
            </TokenCard>

            {/* Bottom nav */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Bottom Navigation
              </p>
              <div className="max-w-[430px] mx-auto">
                <div
                  className="rounded-[14px] overflow-hidden border border-gray-200"
                  style={{
                    background: "rgba(249, 249, 249, 0.95)",
                    borderTop: "0.5px solid rgba(0,0,0,0.15)",
                  }}
                >
                  <div className="flex justify-around items-center px-2 py-2">
                    {[
                      { icon: Home, label: "Home", active: true },
                      { icon: Gamepad2, label: "Games", active: false },
                      { icon: Layers, label: "Meetups", active: false },
                      { icon: Users, label: "Players", active: false },
                    ].map((tab) => (
                      <div
                        key={tab.label}
                        className={cn(
                          "flex flex-col items-center p-2 min-w-[64px]",
                          tab.active ? "text-[#FFD62A]" : "text-gray-400"
                        )}
                      >
                        <tab.icon className="h-7 w-7 mb-1" />
                        <span className="text-[10px] font-medium">
                          {tab.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TokenCard>

            {/* App constraint */}
            <TokenCard>
              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">
                App Shell
              </p>
              <p className="text-[13px] text-gray-500 mb-3">
                All app content is constrained to <Code>max-w-[430px]</Code>{" "}
                centered with <Code>mx-auto</Code>. Mobile-first, phone-screen width.
              </p>
              <div className="flex justify-center">
                <div className="w-[200px] h-[360px] rounded-[24px] border-2 border-gray-300 bg-white relative overflow-hidden">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-200 rounded-full" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-200 rounded-full" />
                  <div className="absolute inset-x-2 top-6 bottom-6 bg-[#F2F2F7] rounded-[14px] flex items-center justify-center">
                    <p className="text-[10px] text-gray-400 font-mono">
                      430px
                    </p>
                  </div>
                </div>
              </div>
            </TokenCard>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-[13px] text-gray-400">
            Game Night — UI Lab · Development only
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Interactive demo sub-components
   ═══════════════════════════════════════════════════════════════ */

function ToggleDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setOn(!on)}
        className={cn(
          "relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200",
          on ? "bg-[#FFD62A]" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-[27px] w-[27px] rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-[2px]",
            on ? "translate-x-[22px]" : "translate-x-[2px]"
          )}
        />
      </button>
      <span className="text-[15px] text-gray-600">{on ? "On" : "Off"}</span>
    </div>
  );
}

function SegmentDemo() {
  const [value, setValue] = useState("highest");
  const options = [
    { label: "Highest", value: "highest" },
    { label: "Lowest", value: "lowest" },
    { label: "Manual", value: "manual" },
  ];
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setValue(opt.value)}
          className={cn(
            "flex-1 rounded-[10px] py-2.5 text-[15px] font-medium transition-colors",
            value === opt.value
              ? "bg-[#FFD62A] text-[#161719]"
              : "bg-[#F2F2F7] text-gray-700"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function StepperDemo() {
  const [value, setValue] = useState(4);
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setValue(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="h-8 w-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[17px] font-semibold text-gray-600 disabled:opacity-30"
      >
        −
      </button>
      <span className="text-[17px] font-semibold text-gray-900 w-8 text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() => setValue(Math.min(10, value + 1))}
        disabled={value >= 10}
        className="h-8 w-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[17px] font-semibold text-gray-600 disabled:opacity-30"
      >
        +
      </button>
      <span className="text-[15px] text-gray-500 ml-2">Players</span>
    </div>
  );
}

function MotionDemo({
  preset,
}: {
  preset: (typeof MOTION_PRESETS)[keyof typeof MOTION_PRESETS];
}) {
  const [key, setKey] = useState(0);
  return (
    <button
      onClick={() => setKey((k) => k + 1)}
      className="text-left p-4 rounded-[14px] bg-[#F2F2F7] hover:bg-gray-200/60 transition-colors"
    >
      <div className="flex items-center gap-3 mb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            className="w-10 h-10 rounded-[10px] bg-[#FFD62A] flex items-center justify-center"
            {...preset}
          >
            <Star className="w-5 h-5 text-[#161719]" />
          </motion.div>
        </AnimatePresence>
        <div>
          <p className="text-[15px] font-semibold text-gray-900">
            {preset.label}
          </p>
          <p className="text-[11px] text-gray-400">{preset.desc}</p>
        </div>
      </div>
      <pre className="text-[10px] text-gray-400 font-mono overflow-hidden">
        {JSON.stringify(preset.transition, null, 2)}
      </pre>
    </button>
  );
}

function ConfettiDemo() {
  const [key, setKey] = useState(0);
  const colors = ["#FFD62A", "#842AEB", "#3F48EB", "#161719", "#FFD62A99", "#842AEB99"];

  return (
    <div>
      <button
        onClick={() => setKey((k) => k + 1)}
        className="bg-[#FFD62A] text-[#161719] text-[15px] font-semibold px-5 py-2.5 rounded-[14px] mb-4"
      >
        Fire confetti
      </button>
      <div className="relative h-40 rounded-[14px] bg-[#F2F2F7] overflow-hidden">
        <AnimatePresence mode="wait">
          <div key={key}>
            {Array.from({ length: 20 }, (_, i) => {
              const color = colors[i % colors.length];
              const size = 6 + (i % 4) * 2;
              const x = 10 + (i * 4.2) % 80;
              const delay = 0.05 * (i % 8);
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                    left: `${x}%`,
                    bottom: "20%",
                  }}
                  initial={{ opacity: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: [0, -60 - (i % 5) * 30],
                    x: [-20 + (i % 7) * 8],
                    scale: [0, 1.2, 0.6],
                    rotate: [0, 180 + i * 30],
                  }}
                  transition={{
                    duration: 1.2,
                    delay,
                    ease: "easeOut",
                  }}
                />
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StaggerDemo() {
  const [key, setKey] = useState(0);
  const items = ["Dashboard", "Games", "Meetups", "Players"];
  return (
    <div>
      <button
        onClick={() => setKey((k) => k + 1)}
        className="bg-[#FFD62A] text-[#161719] text-[15px] font-semibold px-5 py-2.5 rounded-[14px] mb-4"
      >
        Replay stagger
      </button>
      <div className="space-y-2" key={key}>
        {items.map((item, i) => (
          <motion.div
            key={item}
            className="bg-white rounded-[14px] px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <div className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center">
              <span className="text-[13px] font-bold text-gray-400">
                {i + 1}
              </span>
            </div>
            <p className="text-[17px] text-gray-900">{item}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
