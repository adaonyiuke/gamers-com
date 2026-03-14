# UI Lab — Internal Design System

Developer-only route for previewing and standardizing the Game Night HQ design system.

## Access

**URL:** `http://localhost:3000/ui-lab`

**Gating:** The route calls `notFound()` when `NODE_ENV === "production"`, returning a 404 to regular users. In development (`next dev`), the page renders normally. No link exists in the app navigation (BottomNav, settings, etc.), so users cannot discover it by browsing.

**Files:**

- `src/app/ui-lab/page.tsx` — Server component with the environment gate
- `src/app/ui-lab/ui-lab-content.tsx` — Client component with all lab content

## What's in the lab

| Section        | What it covers                                                          |
| -------------- | ----------------------------------------------------------------------- |
| **Colors**     | Brand palette (8 accent colors) and neutrals with hex values            |
| **Typography** | Type scale (34px → 10px) with weights, use cases, and Tailwind classes  |
| **Spacing**    | Spacing scale (4–64px) with Tailwind unit mappings                      |
| **Radii**      | Border radius tokens (10px → full) with usage context                   |
| **Shadows**    | Card, Elevated, and Modal shadow presets                                |
| **Glass**      | Glassmorphism recipe (backdrop-blur, opacity) with live preview         |
| **Components** | Buttons, toggle, segmented control, stepper, setting rows, game tiles, search input, icon set |
| **Motion**     | Framer Motion presets (fade-up, spring-scale, fade-in, press-scale), confetti particles, stagger list — all interactive/replayable |
| **Patterns**   | Card layout, empty state, page headers (large + back), bottom nav, app shell constraint (430px) |

## Adding new items

1. **New token or component** — Add it to the relevant section in `ui-lab-content.tsx`. Follow the existing pattern: wrap in a `<TokenCard>` with an uppercase section label.

2. **New motion preset** — Add an entry to the `MOTION_PRESETS` object. It will automatically appear in the Motion section grid with a replay button.

3. **New section** — Add an entry to `NAV_ITEMS`, create a `<Section id="…">` block in the content area. It will appear in the sticky tab nav.

## Design conventions (reference)

- **Max width:** `max-w-[430px] mx-auto` — all app content is phone-width
- **Card style:** `bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]`
- **Glass headers:** `rgba(242,242,247,0.85)` background + `blur(20px)`
- **Primary action:** `bg-[#007AFF] text-white rounded-[14px]`
- **Destructive:** `text-red-500` or `bg-[#FF3B30] text-white`
- **Toggle on:** `bg-[#34C759]` (iOS green)
- **Icons:** `lucide-react`, default stroke width
- **Animations:** `framer-motion` — spring for emphasis, ease for content
- **Font stack:** System fonts (`-apple-system, SF Pro Text, …`)
