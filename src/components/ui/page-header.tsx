"use client";

import { type ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const glassStyle = {
  background: "rgba(242,242,247,0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
} as const;

/**
 * Reusable page header with consistent glassmorphic styling and smart back navigation.
 *
 * Two variants:
 * - **back** (default when `backHref` or `backLabel` is set): compact centered title + back button.
 *   Used for subpages/detail screens.
 * - **large** (default for top-level pages): large 34px title, no back button.
 *
 * Back behavior: navigates to the previous history entry when one exists,
 * otherwise falls back to `backHref` so the user is never stranded.
 */
export function PageHeader({
  title,
  backLabel = "Back",
  backHref,
  rightAction,
  variant,
  centeredTitle = false,
  children,
}: {
  /** Page title shown in the header */
  title: string;
  /** Label next to the chevron (e.g. "Meetups", "Settings"). Defaults to "Back". */
  backLabel?: string;
  /** Fallback URL when there is no usable history entry. Also makes the header show a back button. */
  backHref?: string;
  /** Optional element rendered on the right side of the header */
  rightAction?: ReactNode;
  /** Force a variant. Auto-detected: "back" if backHref is set, otherwise "large". */
  variant?: "back" | "large";
  /** Show a centered title in the back variant (iOS navigation bar style). */
  centeredTitle?: boolean;
  /** Extra content rendered below the title (large variant only). */
  children?: ReactNode;
}) {
  const router = useRouter();
  const resolvedVariant = variant ?? (backHref ? "back" : "large");

  const handleBack = useCallback(() => {
    // If the window has navigated within this tab, go back.
    // Otherwise fall back to the parent page.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (backHref) {
      router.push(backHref);
    }
  }, [router, backHref]);

  if (resolvedVariant === "large") {
    return (
      <div className="sticky top-0 z-40 px-5 pt-14 pb-3" style={glassStyle}>
        {backHref && (
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={handleBack}
              className="flex items-center text-[#007AFF] -ml-1.5 active:opacity-60 transition-opacity"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="text-[17px]">{backLabel}</span>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          {rightAction}
        </div>
        {children}
      </div>
    );
  }

  // "back" variant — compact title with back chevron
  if (centeredTitle) {
    return (
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3 flex items-center gap-3"
        style={glassStyle}
      >
        <button
          onClick={handleBack}
          className="flex items-center text-[#007AFF] -ml-1 active:opacity-60 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px]">{backLabel}</span>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900 flex-1 text-center truncate">
          {title}
        </h1>
        <div className="w-14 flex justify-end">{rightAction}</div>
      </div>
    );
  }

  return (
    <div
      className="sticky top-0 z-40 px-5 pt-14 pb-3 flex items-center gap-3"
      style={glassStyle}
    >
      <button
        onClick={handleBack}
        className="flex items-center text-[#007AFF] -ml-1 active:opacity-60 transition-opacity"
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="text-[17px]">{backLabel}</span>
      </button>
      <div className="flex-1" />
      {rightAction && <div className="flex items-center">{rightAction}</div>}
    </div>
  );
}
