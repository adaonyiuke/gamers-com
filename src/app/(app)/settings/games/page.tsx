"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Archive, Star, Layout } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupMembers } from "@/lib/queries/members";
import { useGroupSettings, useUpdateGroupSettings } from "@/lib/queries/settings";
import {
  SettingsHeader,
  SettingSection,
  SettingToggle,
  SettingSelect,
  SettingRow,
} from "@/components/settings/setting-components";

export default function GameSettingsPage() {
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
      <SettingsHeader title="Game Settings" onBack={() => router.back()} />

      <div className="px-5 mt-4 space-y-5">
        {/* ── Session Rules ─────────────────────────────────────── */}
        <SettingSection title="Session Rules">
          <SettingToggle
            label="Allow editing finalized sessions"
            description="Let members modify scores after a session is finalized"
            value={settings?.allow_edit_finalized ?? false}
            onChange={(v) => handleChange("allow_edit_finalized", v)}
            disabled={!isAdmin}
          />
          <SettingToggle
            label="Lock sessions after meetup complete"
            description="Prevent new sessions once a meetup is marked complete"
            value={settings?.lock_sessions_after_complete ?? true}
            onChange={(v) => handleChange("lock_sessions_after_complete", v)}
            disabled={!isAdmin}
          />
        </SettingSection>

        {/* ── Game Library ──────────────────────────────────────── */}
        <SettingSection title="Game Library">
          <SettingRow
            label="Manage games"
            description="View, edit, and organize your game library"
            icon={<Layout className="h-5 w-5 text-gray-400" />}
            onClick={() => router.push("/games")}
          />
          <SettingRow
            label="Set featured games"
            description="Pin your group's favorite games to the top"
            icon={<Star className="h-5 w-5 text-gray-400" />}
            onClick={() => router.push("/games")}
          />
          <SettingRow
            label="Archive unused games"
            description="Hide games that haven't been played recently"
            icon={<Archive className="h-5 w-5 text-gray-400" />}
            onClick={() => router.push("/games")}
          />
        </SettingSection>

        {/* ── Animations ────────────────────────────────────────── */}
        <SettingSection title="Animations">
          <SettingSelect
            label="Confetti intensity"
            description="How much confetti shows when someone wins"
            value={settings?.confetti_intensity ?? "medium"}
            options={[
              { label: "Off", value: "off" },
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ]}
            onChange={(v) => handleChange("confetti_intensity", v)}
            disabled={!isAdmin}
          />
          <SettingToggle
            label="Winner animation"
            description="Show celebration animation for the winner"
            value={settings?.winner_animation ?? true}
            onChange={(v) => handleChange("winner_animation", v)}
            disabled={!isAdmin}
          />
          <SettingToggle
            label="Reduced motion"
            description="Minimize animations for accessibility"
            value={settings?.reduced_motion ?? false}
            onChange={(v) => handleChange("reduced_motion", v)}
            disabled={!isAdmin}
          />
        </SettingSection>
      </div>
    </div>
  );
}
