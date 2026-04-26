"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupId } from "@/components/providers/group-provider";
import {
  useMemberStats,
  useMemberGameStats,
  useAdjustedStreak,
} from "@/lib/queries/members";
import { useGroupSettings } from "@/lib/queries/settings";
import { useBadgeNotifications, useMarkBadgesNotified } from "@/lib/queries/badges";
import { computeBadges, Badge } from "@/lib/utils/badges";
import { BadgeCelebrationModal } from "./BadgeCelebrationModal";

/**
 * Drop this inside the (app) layout. It silently watches the current user's
 * badge eligibility and pops up a celebration modal whenever they earn
 * a badge they haven't been shown before.
 *
 * Seeding: on the very first check for a user+group (no prior notifications
 * in the DB), all currently-earned badges are silently marked as notified so
 * existing users don't get a flood of modals on first launch.
 */
export function BadgeCelebrationProvider() {
  const { user } = useUser();
  const { groupId } = useGroupId();

  // ── fetch all the data needed to compute badges ──────────────────────────
  const { data: allMemberStats } = useMemberStats(groupId);
  const { data: settings } = useGroupSettings(groupId);

  const myStats = useMemo(() => {
    if (!allMemberStats || !user) return null;
    return (allMemberStats as any[]).find((s) => s.user_id === user.id) ?? null;
  }, [allMemberStats, user]);

  const myMemberId: string | null = myStats?.member_id ?? null;
  const streakWindow: number = settings?.streak_window ?? 10;

  const { data: gameStats } = useMemberGameStats(myMemberId);
  const { data: adjustedStreak } = useAdjustedStreak(myMemberId, groupId, streakWindow);
  const { data: notifiedBadges } = useBadgeNotifications(groupId);
  const markNotified = useMarkBadgesNotified();

  // ── queue of badges to show ───────────────────────────────────────────────
  const [queue, setQueue] = useState<Badge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Guards so we don't re-run the seed / notification logic on every render
  const initializedRef = useRef(false);
  const pendingMarkRef = useRef(false);

  useEffect(() => {
    // Wait until all data is ready
    if (
      !user?.id ||
      !groupId ||
      notifiedBadges === undefined ||
      !myStats ||
      !gameStats ||
      adjustedStreak === undefined ||
      !allMemberStats
    ) return;

    // Don't run again in this session
    if (initializedRef.current) return;
    initializedRef.current = true;

    // ── compute current badges ────────────────────────────────────────────
    const eligible = (allMemberStats as any[]).filter(
      (s) => (s.total_sessions ?? 0) >= 5
    );
    const maxRate = eligible.length
      ? Math.max(...eligible.map((s) => s.win_rate ?? 0))
      : 0;
    const isTopWinRate =
      eligible.length > 0 &&
      maxRate > 0 &&
      (myStats.win_rate ?? 0) >= maxRate;

    const earned = computeBadges({
      winRate: myStats.win_rate ?? 0,
      totalSessions: myStats.total_sessions ?? 0,
      currentStreak: adjustedStreak,
      uniqueGameWins: gameStats.uniqueGameWins,
      hasFirstPlayWin: gameStats.hasFirstPlayWin,
      isTopWinRate,
      meetupsAttended: gameStats.meetupsAttended,
    });

    const seedKey = `gn_badge_seeded_${user.id}_${groupId}`;
    const isSeeded =
      notifiedBadges.size > 0 ||
      (typeof window !== "undefined" && !!localStorage.getItem(seedKey));

    if (!isSeeded) {
      // ── first ever check: silently mark all current badges, no modal ──
      if (typeof window !== "undefined") localStorage.setItem(seedKey, "1");
      if (earned.length > 0 && !pendingMarkRef.current) {
        pendingMarkRef.current = true;
        markNotified.mutate({ groupId, badgeIds: earned.map((b) => b.id) });
      }
      return;
    }

    // ── ongoing: show only badges not yet notified ────────────────────────
    const newOnes = earned.filter((b) => !notifiedBadges.has(b.id));
    if (newOnes.length > 0) {
      // Mark in DB immediately so a remount/reload doesn't re-show
      if (!pendingMarkRef.current) {
        pendingMarkRef.current = true;
        markNotified.mutate({ groupId, badgeIds: newOnes.map((b) => b.id) });
      }
      setQueue(newOnes);
      setCurrentIndex(0);
    }
  }, [
    user?.id,
    groupId,
    notifiedBadges,
    myStats,
    gameStats,
    adjustedStreak,
    allMemberStats,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  if (queue.length === 0 || currentIndex >= queue.length) return null;

  return (
    <BadgeCelebrationModal
      badges={queue}
      currentIndex={currentIndex}
      onNext={() => setCurrentIndex((i) => i + 1)}
      onDismiss={() => {
        setQueue([]);
        setCurrentIndex(0);
      }}
    />
  );
}
