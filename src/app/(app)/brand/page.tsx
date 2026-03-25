"use client";

import { useState } from "react";
import Image from "next/image";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ═══════════════════════════════════════════════════════════════
   Brand tokens
   ═══════════════════════════════════════════════════════════════ */

const BRAND_COLORS = [
  { label: "Black",  value: "#161719", text: "white" },
  { label: "Yellow", value: "#FFD62A", text: "black" },
  { label: "Purple", value: "#842AEB", text: "white" },
  { label: "Blue",   value: "#3F48EB", text: "white" },
] as const;

const GRADIENTS = [
  {
    label: "Purple Gradient",
    css: "linear-gradient(160deg, #160728 0%, #842AEB 100%)",
    from: "#160728", to: "#842AEB",
  },
  {
    label: "Grey Gradient",
    css: "linear-gradient(160deg, #D9D9D9 0%, #B8B8B8 100%)",
    from: "#D9D9D9", to: "#B8B8B8",
  },
  {
    label: "Blue (Card Header)",
    css: "linear-gradient(180deg, #3F48EB 0%, #1a1f7a 100%)",
    from: "#3F48EB", to: "#1a1f7a",
  },
] as const;

const APP_AVATAR_COLORS = [
  { label: "Blue",    value: "#007AFF" },
  { label: "Orange",  value: "#FF9500" },
  { label: "Pink",    value: "#FF2D55" },
  { label: "Purple",  value: "#5856D6" },
  { label: "Green",   value: "#34C759" },
  { label: "Magenta", value: "#AF52DE" },
  { label: "Red",     value: "#FF3B30" },
  { label: "Teal",    value: "#00C7BE" },
] as const;

const TYPE_SCALE = [
  { size: "52–68px", weight: "Black (900)", use: "Marketing hero headline", font: "Aktiv Grotesk" },
  { size: "34px",    weight: "Bold (700)",  use: "Page title / CTA heading",  font: "Aktiv Grotesk / System" },
  { size: "22px",    weight: "Bold (700)",  use: "Section heading",            font: "System" },
  { size: "17px",    weight: "Regular / Semibold", use: "Body text, nav titles", font: "System" },
  { size: "15px",    weight: "Regular / Medium",   use: "Secondary body, buttons", font: "System" },
  { size: "13px",    weight: "Semibold",    use: "Captions, labels, section headers", font: "System" },
  { size: "11–12px", weight: "Bold",        use: "Eyebrow / overline labels", font: "System" },
] as const;

const RADII = [
  { label: "10px",  tw: "rounded-[10px]",  use: "Small pills, tags" },
  { label: "14px",  tw: "rounded-[14px]",  use: "Buttons, inputs, game tiles" },
  { label: "16px",  tw: "rounded-[16px]",  use: "Marketing CTAs" },
  { label: "20px",  tw: "rounded-[20px]",  use: "Cards, feature rows" },
  { label: "24px",  tw: "rounded-[24px]",  use: "Modals, large cards" },
  { label: "28–32px", tw: "rounded-[28px]", use: "Marketing CTA block, app icon" },
  { label: "Full",  tw: "rounded-full",    use: "Avatars, toggles, small badges" },
] as const;

const SHADOWS = [
  { label: "Subtle",   css: "0 2px 8px rgba(0,0,0,0.04)",   use: "App cards" },
  { label: "Elevated", css: "0 4px 16px rgba(0,0,0,0.08)",  use: "Modals, sheets" },
  { label: "Card",     css: "0 12px 40px rgba(0,0,0,0.12)", use: "Marketing cards" },
  { label: "Heavy",    css: "0 20px 60px rgba(0,0,0,0.35)", use: "Overlapping cards" },
  { label: "Glow — Yellow", css: "0 8px 32px rgba(255,214,42,0.5)",  use: "CTA buttons (marketing)" },
  { label: "Glow — Purple", css: "0 8px 28px rgba(132,42,235,0.4)", use: "Accent elements" },
] as const;

const ASSETS_3D = [
  { file: "trophy-render.png",         label: "Trophy" },
  { file: "hourglass.png",             label: "Hourglass" },
  { file: "star.png",                  label: "Star" },
  { file: "starburst.png",             label: "Starburst" },
  { file: "rubik.png",                 label: "Rubik's Cube" },
  { file: "race%20flag.png",           label: "Race Flag" },
  { file: "asset%2035.png",            label: "Yellow Disc" },
  { file: "asset%2040.png",            label: "Checker Cube" },
  { file: "3d%20asset%20group@2x.png", label: "Asset Group" },
  { file: "confetti.png",              label: "Confetti" },
] as const;

const CHART_COLORS = [
  { var: "--chart-1", value: "#FFD62A",   label: "Yellow — primary stat" },
  { var: "--chart-2", value: "#842AEB",   label: "Purple — rival/comparison" },
  { var: "--chart-3", value: "#3F48EB",   label: "Blue — activity/time" },
  { var: "--chart-4", value: "#FFD62A99", label: "Yellow 60% — semi-active" },
  { var: "--chart-5", value: "#FFD62A33", label: "Yellow 20% — inactive" },
] as const;

const NAV_ITEMS = [
  { id: "colors",     label: "Colors" },
  { id: "charts",     label: "Charts" },
  { id: "gradients",  label: "Gradients" },
  { id: "avatars",    label: "Avatars" },
  { id: "type",       label: "Type" },
  { id: "radii",      label: "Radii" },
  { id: "shadows",    label: "Shadows" },
  { id: "assets",     label: "3D Assets" },
  { id: "components", label: "Components" },
] as const;

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-12">
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#842AEB] mb-4">{title}</h2>
      {children}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */

export default function BrandPage() {
  const [active, setActive] = useState("colors");

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-32">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-50 border-b border-black/5"
        style={{ background: "rgba(242,242,247,0.9)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-3xl mx-auto px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: "#842AEB" }}>
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-gray-900">Brand</h1>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Design System · Internal</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto no-scrollbar -mx-5 px-5">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActive(item.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  active === item.id
                    ? "text-white"
                    : "bg-black/5 text-gray-600"
                )}
                style={active === item.id ? { backgroundColor: "#842AEB" } : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-8 space-y-0">

        {/* ── Colors ── */}
        <Section id="colors" title="Brand Colors">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {BRAND_COLORS.map((c) => (
              <div key={c.label} className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="h-20 w-full" style={{ backgroundColor: c.value }} />
                <div className="p-3">
                  <p className="text-[15px] font-bold text-gray-900">{c.label}</p>
                  <code className="text-[13px] text-gray-500 font-mono">{c.value}</code>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] font-semibold text-gray-500 mb-3">Usage</p>
            <ul className="space-y-1.5 text-[14px] text-gray-700">
              <li><span className="font-bold">Black #161719</span> — Dark backgrounds, nav, footer, body text on light</li>
              <li><span className="font-bold">Yellow #FFD62A</span> — Primary CTA buttons, highlights, accents</li>
              <li><span className="font-bold">Purple #842AEB</span> — Brand primary, section labels, icon fills</li>
              <li><span className="font-bold">Blue #3F48EB</span> — Secondary headers (leaderboard), interactive states</li>
            </ul>
          </div>
        </Section>

        {/* ── Charts ── */}
        <Section id="charts" title="Chart Colors">
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3">
            <p className="text-[13px] text-gray-500 mb-4">
              CSS variables used by <code className="text-[12px] bg-gray-100 rounded px-1">recharts</code> via shadcn chart primitives. Monochromatic per card — one color with opacity steps for inactive bars.
            </p>
            <div className="space-y-3">
              {CHART_COLORS.map((c) => (
                <div key={c.var} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] shrink-0 border border-black/5"
                    style={{ backgroundColor: c.value }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900">{c.label}</p>
                    <code className="text-[11px] text-gray-400 font-mono">{c.var}</code>
                  </div>
                  <code className="text-[11px] text-gray-400 font-mono shrink-0">{c.value}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] font-semibold text-gray-500 mb-3">Bar pattern preview</p>
            <div className="flex items-end gap-2 h-20 px-1">
              {[40, 65, 50, 100, 35, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-[5px] rounded-b-[5px]"
                  style={{
                    height: `${h}%`,
                    backgroundColor:
                      i === 3 ? "#ffffff"
                      : i === 1 || i === 5 ? "#FFD62A99"
                      : "#FFD62A33",
                    border: i === 3 ? "1.5px solid #FFD62A" : undefined,
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-1 px-1">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                <p key={m} className="flex-1 text-center text-[10px] text-gray-400">{m}</p>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Gradients ── */}
        <Section id="gradients" title="Gradients">
          <div className="space-y-3">
            {GRADIENTS.map((g) => (
              <div key={g.label} className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="h-16 w-full" style={{ background: g.css }} />
                <div className="p-3 flex items-center justify-between">
                  <p className="text-[15px] font-bold text-gray-900">{g.label}</p>
                  <code className="text-[12px] text-gray-400 font-mono">{g.from} → {g.to}</code>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Avatar Colors ── */}
        <Section id="avatars" title="Avatar Colors (In-App)">
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] text-gray-500 mb-4">Stored in <code className="text-[12px] bg-gray-100 rounded px-1">group_members.avatar_url</code> as hex strings. User-selectable on profile page.</p>
            <div className="flex flex-wrap gap-3">
              {APP_AVATAR_COLORS.map((c) => (
                <div key={c.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center text-white text-[15px] font-bold shadow-sm"
                    style={{ backgroundColor: c.value }}
                  >
                    A
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">{c.label}</p>
                  <code className="text-[10px] text-gray-400 font-mono">{c.value}</code>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Typography ── */}
        <Section id="type" title="Typography">
          <div className="space-y-3">
            {TYPE_SCALE.map((t) => (
              <div key={t.size} className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
                <div className="w-16 shrink-0">
                  <p className="text-[13px] font-bold text-gray-900">{t.size}</p>
                  <p className="text-[11px] text-gray-400">{t.weight}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-600 truncate">{t.use}</p>
                  <span
                    className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-1"
                    style={
                      t.font === "Aktiv Grotesk"
                        ? { backgroundColor: "#FFD62A", color: "#161719" }
                        : { backgroundColor: "#F2F2F7", color: "#6B7280" }
                    }
                  >
                    {t.font}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-3">
            <p className="text-[13px] font-semibold text-gray-500 mb-2">Aktiv Grotesk — Adobe Fonts</p>
            <p className="text-[14px] text-gray-700 mb-1">Kit ID active in <code className="text-[12px] bg-gray-100 rounded px-1">src/app/layout.tsx</code></p>
            <p className="text-[14px] text-gray-700">CSS: <code className="text-[12px] bg-gray-100 rounded px-1">{`font-family: 'aktiv-grotesk', system-ui, sans-serif`}</code></p>
            <p className="text-[13px] text-gray-400 mt-2">Used on marketing site (<code className="text-[12px] bg-gray-100 rounded px-1">src/app/page.tsx</code>) only.</p>
          </div>
        </Section>

        {/* ── Radii ── */}
        <Section id="radii" title="Border Radius">
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="space-y-3">
              {RADII.map((r) => (
                <div key={r.label} className="flex items-center gap-4">
                  <div
                    className={cn("h-10 w-10 shrink-0 border-2 border-[#842AEB]", r.tw)}
                  />
                  <div>
                    <p className="text-[15px] font-bold text-gray-900">{r.label}</p>
                    <p className="text-[13px] text-gray-500">{r.use}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Shadows ── */}
        <Section id="shadows" title="Shadows">
          <div className="space-y-3">
            {SHADOWS.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-[20px] p-4"
                style={{ boxShadow: s.css }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-bold text-gray-900">{s.label}</p>
                  <p className="text-[12px] text-gray-400">{s.use}</p>
                </div>
                <code className="text-[11px] text-gray-400 font-mono mt-1 block">{s.css}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3D Assets ── */}
        <Section id="assets" title="3D Assets">
          <div className="grid grid-cols-2 gap-3">
            {ASSETS_3D.map((a) => (
              <div
                key={a.file}
                className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center gap-3"
              >
                <div className="w-full h-24 relative flex items-center justify-center">
                  <Image
                    src={`/3D%20image%20assets/${a.file}`}
                    alt={a.label}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-gray-900">{a.label}</p>
                  <code className="text-[11px] text-gray-400 font-mono">{a.file}</code>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-3">
            <p className="text-[13px] font-semibold text-gray-500 mb-1">Location</p>
            <code className="text-[12px] text-gray-600 font-mono">public/3D image assets/</code>
            <p className="text-[13px] text-gray-500 mt-2">All PNGs. Most have transparent backgrounds. White-bg assets (rubik, race flag, disc) work best inside white rounded containers on dark backgrounds.</p>
          </div>
        </Section>

        {/* ── Components ── */}
        <Section id="components" title="Components">
          {/* Buttons */}
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">Buttons</p>
            <div className="space-y-3">
              <button
                className="w-full rounded-[16px] py-4 text-[17px] font-black text-[#161719]"
                style={{ backgroundColor: "#FFD62A", boxShadow: "0 8px 32px rgba(235,195,28,0.5)" }}
              >
                Marketing Primary (Yellow)
              </button>
              <button className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold">
                App Primary (Black)
              </button>
              <button className="w-full bg-gray-200 text-gray-900 rounded-[14px] py-4 text-[17px] font-semibold">
                Secondary (Gray)
              </button>
              <button className="w-full bg-red-500 text-white rounded-[14px] py-4 text-[17px] font-semibold">
                Destructive (Red)
              </button>
            </div>
          </div>

          {/* Avatar row */}
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">Leaderboard Row</p>
            {[
              { name: "Mojoyin", wins: 12, color: "#842AEB", medal: "🥇", bg: "bg-amber-50" },
              { name: "Ada",     wins: 9,  color: "#FFD62A", medal: "🥈", bg: "" },
              { name: "Aradi",   wins: 7,  color: "#3F48EB", medal: "🥉", bg: "" },
            ].map((p) => (
              <div key={p.name} className={cn("flex items-center gap-3 px-2 py-3.5 rounded-[12px]", p.bg)}>
                <span className="text-[20px] w-7 text-center">{p.medal}</span>
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[14px] font-bold shrink-0" style={{ backgroundColor: p.color }}>
                  {p.name[0]}
                </div>
                <p className="flex-1 text-[16px] font-semibold text-gray-900">{p.name}</p>
                <span className="text-[15px] font-semibold text-gray-700">{p.wins}</span>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-3">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">Badges</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Champion",   desc: "Top win rate (5+ games)", gradient: "linear-gradient(135deg, #FFD700, #FFA500)", emoji: "🏆" },
                { label: "On Fire",    desc: "Active win streak",        gradient: "linear-gradient(135deg, #FF6B6B, #FF2D55)", emoji: "🔥" },
                { label: "Strategist", desc: "60%+ win rate",            gradient: "linear-gradient(135deg, #5856D6, #007AFF)", emoji: "🧠" },
                { label: "Wildcard",   desc: "Won 3+ different games",   gradient: "linear-gradient(135deg, #34C759, #00C7BE)", emoji: "🃏" },
              ].map((b) => (
                <div key={b.label} className="rounded-[16px] p-3 text-white" style={{ background: b.gradient }}>
                  <span className="text-[22px] block mb-1">{b.emoji}</span>
                  <p className="text-[13px] font-bold">{b.label}</p>
                  <p className="text-[11px] text-white/80 leading-snug">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4">Input</p>
            <input
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#842AEB]/30"
              placeholder="Placeholder text"
              readOnly
            />
          </div>
        </Section>

      </div>
    </div>
  );
}
