export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getDefaultMeetupTitle(): string {
  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();
  return `Game Night – ${month} ${year}`;
}

/**
 * Formats a date as a relative time label using human-readable buckets.
 *
 * Bucketing rules:
 *   0 days          → "Today"
 *   1 day           → "1 day ago"
 *   2–6 days        → "X days ago"
 *   7–13 days       → "1 week ago"
 *   14–27 days      → "X weeks ago" (rounded down)
 *   28–364 days     → "X month(s) ago" (rounded down, 1 month = 30 days)
 *   365+ days       → "X year(s) ago" (rounded down)
 *
 * Uses local midnight boundaries to avoid off-by-one issues around midnight.
 */
export function getRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "Unknown";
  const d = new Date(date);
  // Guard against invalid or epoch-zero dates (e.g. new Date(null) = 1970-01-01)
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "Unknown";
  const now = new Date();

  // Compare using local-date midnights to avoid timezone / midnight edge cases
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = todayMidnight.getTime() - dateMidnight.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return "Today";
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (days < 28) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
