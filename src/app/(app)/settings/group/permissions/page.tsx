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
} from "@/components/settings/setting-components";

export default function GroupPermissionsPage() {
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

  // Redirect non-admins away
  if (members && user && !isAdmin) {
    router.replace("/settings/group");
    return null;
  }

  function handleChange(key: string, value: boolean) {
    if (!groupId) return;
    updateSettings.mutate({ groupId, updates: { [key]: value } });
  }

  return (
    <div className="pb-36">
      <SettingsHeader title="Member Permissions" onBack={() => router.back()} />

      <div className="px-5 mt-4 space-y-5">
        {/* ── Invites ───────────────────────────────────────────── */}
        <SettingSection title="Invites">
          <SettingToggle
            label="Members can share invite link"
            description="Allow members to copy and share the group invite code"
            value={settings?.perm_members_can_share_invite ?? true}
            onChange={(v) => handleChange("perm_members_can_share_invite", v)}
          />
        </SettingSection>

        {/* ── Guests ────────────────────────────────────────────── */}
        <SettingSection title="Guests">
          <SettingToggle
            label="Members can view guest archive"
            description="Allow members to browse all past guests"
            value={settings?.perm_members_can_view_guest_archive ?? true}
            onChange={(v) => handleChange("perm_members_can_view_guest_archive", v)}
          />
          <SettingToggle
            label="Members manage only their own guests"
            description="Restrict members to editing and removing only guests they personally invited"
            value={settings?.perm_members_manage_own_guests_only ?? false}
            onChange={(v) => handleChange("perm_members_manage_own_guests_only", v)}
          />
        </SettingSection>
      </div>
    </div>
  );
}
