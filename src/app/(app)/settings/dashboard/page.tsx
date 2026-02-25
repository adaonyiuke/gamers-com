"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupMembers } from "@/lib/queries/members";
import { useGroupSettings, useUpdateGroupSettings } from "@/lib/queries/settings";
import {
  SettingsHeader,
  SettingSection,
  SettingToggle,
  SettingSelect,
  SettingStepper,
} from "@/components/settings/setting-components";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { groupId } = useGroupId();
  const { data: members } = useGroupMembers(groupId);
  const { data: settings } = useGroupSettings(groupId);
  const updateSettings = useUpdateGroupSettings();

  const isAdmin = useMemo(() => {
    if (!members || !user) return false;
    const me = members.find((m: any) => m.user_id === user.id);
    return me?.role === "owner";
  }, [members, user]);

  function handleChange(key: string, value: any) {
    if (!groupId) return;
    updateSettings.mutate({ groupId, updates: { [key]: value } });
  }

  return (
    <div className="pb-36">
      <SettingsHeader title="Dashboard Settings" onBack={() => router.back()} />

      <div className="px-5 mt-4 space-y-5">
        {/* ── Leaderboards ──────────────────────────────────────── */}
        <SettingSection title="Leaderboards">
          <SettingSelect
            label="Default sort"
            description="How leaderboards are ranked by default"
            value={settings?.leaderboard_default_sort ?? "wins"}
            options={[
              { label: "Wins", value: "wins" },
              { label: "Win Rate", value: "win_rate" },
              { label: "Sessions", value: "sessions" },
            ]}
            onChange={(v) => handleChange("leaderboard_default_sort", v)}
            disabled={!isAdmin}
          />
          <SettingToggle
            label="Include guests by default"
            description="Show guest players in leaderboard rankings"
            value={settings?.leaderboard_include_guests ?? false}
            onChange={(v) => handleChange("leaderboard_include_guests", v)}
            disabled={!isAdmin}
          />
        </SettingSection>

        {/* ── Streaks ───────────────────────────────────────────── */}
        <SettingSection title="Streaks">
          <SettingStepper
            label="Streak window"
            description="How many recent meetups to calculate streaks from"
            value={settings?.streak_window ?? 10}
            min={3}
            max={50}
            onChange={(v) => handleChange("streak_window", v)}
            disabled={!isAdmin}
          />
          <SettingToggle
            label="Include guests in streaks"
            description="Count guest wins in streak calculations"
            value={settings?.streak_include_guests ?? false}
            onChange={(v) => handleChange("streak_include_guests", v)}
            disabled={!isAdmin}
          />
        </SettingSection>

        {/* ── Highlights ────────────────────────────────────────── */}
        <SettingSection title="Highlights">
          <SettingToggle
            label='Show "Most Improved"'
            description="Highlight the player improving the fastest"
            value={settings?.show_most_improved ?? true}
            onChange={(v) => handleChange("show_most_improved", v)}
            disabled={!isAdmin}
          />
          <SettingToggle
            label='Show "Rivalry Stats"'
            description="Display head-to-head matchup stats"
            value={settings?.show_rivalry_stats ?? true}
            onChange={(v) => handleChange("show_rivalry_stats", v)}
            disabled={!isAdmin}
          />
          <SettingToggle
            label='Show "Fun Stats"'
            description="Show quirky stats like longest losing streak"
            value={settings?.show_fun_stats ?? true}
            onChange={(v) => handleChange("show_fun_stats", v)}
            disabled={!isAdmin}
          />
        </SettingSection>
      </div>
    </div>
  );
}
