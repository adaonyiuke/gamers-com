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
 * Formats a date as a relative time label.
 *
 * Bucketing rules:
 *   < 60 seconds    → "Xs ago" or "just now"
 *   < 60 minutes    → "Xm ago"
 *   < 24 hours      → "Xh ago"
 *   1–6 days        → "Xd ago"
 *   7–27 days       → "Xw ago"
 *   28–364 days     → "Xmo ago"
 *   365+ days       → "Xy ago"
 */
export function getRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "Unknown";
  const d = new Date(date);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "Unknown";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  // Future dates (clock skew)
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (days < 28) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
