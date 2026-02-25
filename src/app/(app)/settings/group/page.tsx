"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Users,
  Shield,
  Share2,
  Mail,
  Pencil,
  UserPlus,
  UserMinus,
  ChevronUp,
  ChevronDown,
  QrCode,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroup, useUpdateGroup } from "@/lib/queries/groups";
import { useGroupMembers } from "@/lib/queries/members";
import { useGroupSettings, useUpdateGroupSettings } from "@/lib/queries/settings";
import {
  SettingsHeader,
  SettingSection,
  SettingToggle,
  SettingSelect,
  SettingRow,
} from "@/components/settings/setting-components";
import { cn } from "@/lib/utils/cn";

export default function GroupSettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { groupId } = useGroupId();
  const { data: group } = useGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: settings } = useGroupSettings(groupId);
  const updateGroup = useUpdateGroup();
  const updateSettings = useUpdateGroupSettings();

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editMeetupFormat, setEditMeetupFormat] = useState("");
  const [showQR, setShowQR] = useState(false);

  const isAdmin = useMemo(() => {
    if (!members || !user) return false;
    const me = members.find((m: any) => m.user_id === user.id);
    return me?.role === "owner";
  }, [members, user]);

  function startEditingGroup() {
    setEditGroupName(group?.name ?? "");
    setEditGroupDescription(group?.description ?? "");
    setEditMeetupFormat(settings?.default_meetup_name_format ?? "Game Night #{n}");
    setEditingGroup(true);
  }

  async function handleSaveGroup() {
    if (!groupId) return;
    try {
      await updateGroup.mutateAsync({
        groupId,
        updates: {
          name: editGroupName.trim() || group?.name,
          description: editGroupDescription.trim() || null,
        },
      });
      if (settings && editMeetupFormat !== settings.default_meetup_name_format) {
        await updateSettings.mutateAsync({
          groupId,
          updates: { default_meetup_name_format: editMeetupFormat },
        });
      }
      setEditingGroup(false);
    } catch {
      // Error shown via mutation state
    }
  }

  async function handleCopyCode() {
    if (!group?.invite_code) return;
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function getInviteLink() {
    if (!group?.invite_code) return "";
    return `${window.location.origin}/join?code=${group.invite_code}`;
  }

  async function handleShareLink() {
    const link = getInviteLink();
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group?.name ?? "our group"} on Game Night HQ`,
          text: `You're invited to join ${group?.name ?? "our group"} on Game Night HQ!`,
          url: link,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch {}
    }
  }

  function handleEmailInvite() {
    const link = getInviteLink();
    if (!link) return;
    const subject = encodeURIComponent(
      `Join ${group?.name ?? "our group"} on Game Night HQ`
    );
    const body = encodeURIComponent(
      `Hey! I'd like you to join our game night group "${group?.name ?? "our group"}" on Game Night HQ.\n\nClick this link to join:\n${link}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  }

  function handleSettingChange(key: string, value: any) {
    if (!groupId) return;
    updateSettings.mutate({ groupId, updates: { [key]: value } });
  }

  return (
    <div className="pb-36">
      <SettingsHeader title="Group Settings" onBack={() => router.back()} />

      <div className="px-5 mt-4 space-y-5">
        {/* ── Identity ──────────────────────────────────────────── */}
        <SettingSection title="Identity">
          {editingGroup ? (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Group Name
                </label>
                <input
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  placeholder="Group name"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Description
                </label>
                <textarea
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                  className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  placeholder="What's your group about?"
                  rows={2}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Meetup Name Format
                </label>
                <input
                  value={editMeetupFormat}
                  onChange={(e) => setEditMeetupFormat(e.target.value)}
                  className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  placeholder="Game Night #{n}"
                />
                <p className="text-[12px] text-gray-400 mt-1 px-1">
                  Use {"#{n}"} for auto-incrementing number
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingGroup(false)}
                  className="flex-1 bg-gray-200 text-gray-900 rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={updateGroup.isPending}
                  className={cn(
                    "flex-1 bg-black text-white rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform",
                    updateGroup.isPending && "opacity-50"
                  )}
                >
                  {updateGroup.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[17px] font-semibold text-gray-900">
                    {group?.name ?? "Loading..."}
                  </p>
                  {group?.description && (
                    <p className="text-[15px] text-gray-500 mt-1">
                      {group.description}
                    </p>
                  )}
                  <p className="text-[13px] text-gray-400 mt-2">
                    Format: {settings?.default_meetup_name_format ?? "Game Night #{n}"}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={startEditingGroup}
                    className="text-[#007AFF] active:opacity-60 transition-opacity p-1"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </SettingSection>

        {/* ── Members ───────────────────────────────────────────── */}
        <SettingSection title="Members">
          {members && members.length > 0 ? (
            <>
              {members.map((member: any) => {
                const initial = member.display_name?.charAt(0)?.toUpperCase() ?? "?";
                const isOwner = member.role === "owner";
                const isCurrentUser = user && member.user_id === user.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <span className="text-[17px] font-semibold text-gray-600">
                        {initial}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[17px] font-semibold text-gray-900 truncate">
                          {member.display_name}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[12px] font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isOwner && (
                          <Shield className="h-3 w-3 text-[#007AFF]" />
                        )}
                        <p className="text-[13px] text-gray-500 capitalize">
                          {isOwner ? "Admin" : member.role}
                        </p>
                      </div>
                    </div>
                    {isAdmin && !isCurrentUser && (
                      <div className="flex items-center gap-1">
                        <button
                          className="p-2 text-gray-400 active:text-[#007AFF] transition-colors"
                          title={isOwner ? "Demote" : "Promote"}
                        >
                          {isOwner ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          className="p-2 text-gray-400 active:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="p-8 text-center">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-[15px] text-gray-500">No members found.</p>
            </div>
          )}
        </SettingSection>

        {/* ── Guests ────────────────────────────────────────────── */}
        <SettingSection title="Guests">
          <SettingToggle
            label="Include in all-time stats"
            description="Count guest scores in leaderboards"
            value={settings?.guest_include_in_stats ?? false}
            onChange={(v) => handleSettingChange("guest_include_in_stats", v)}
            disabled={!isAdmin}
          />
          <SettingToggle
            label="Allow recurring guests"
            description="Let the same guest join multiple meetups"
            value={settings?.guest_allow_recurring ?? true}
            onChange={(v) => handleSettingChange("guest_allow_recurring", v)}
            disabled={!isAdmin}
          />
          <SettingRow
            label="Manage guest archive"
            description="View and manage all past guests"
            onClick={() => router.push("/guests")}
          />
        </SettingSection>

        {/* ── Invites ───────────────────────────────────────────── */}
        <SettingSection title="Invites">
          {group?.invite_code ? (
            <>
              <div className="px-5 py-5">
                <p className="text-[32px] font-bold tracking-[0.2em] text-center text-gray-900 font-mono">
                  {group.invite_code}
                </p>
              </div>
              <div className="px-5 py-3 flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 rounded-[12px] py-3 text-[15px] font-semibold text-gray-900 active:scale-[0.98] transition-transform"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleShareLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#007AFF] rounded-[12px] py-3 text-[15px] font-semibold text-white active:scale-[0.98] transition-transform"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={handleEmailInvite}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-[15px] font-medium text-[#007AFF] active:bg-gray-50 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Send Email Invite
              </button>
            </>
          ) : (
            <div className="p-5 text-center">
              <p className="text-[15px] text-gray-500">No invite code generated</p>
            </div>
          )}
        </SettingSection>

        {/* ── Meetup Defaults ───────────────────────────────────── */}
        <SettingSection title="Meetup Defaults">
          <SettingToggle
            label="Auto-include all members"
            description="Pre-select all core members for new meetups"
            value={settings?.auto_include_all_members ?? true}
            onChange={(v) => handleSettingChange("auto_include_all_members", v)}
            disabled={!isAdmin}
          />
          <SettingSelect
            label="Default status on creation"
            value={settings?.default_meetup_status ?? "planned"}
            options={[
              { label: "Planned", value: "planned" },
              { label: "Active", value: "active" },
            ]}
            onChange={(v) => handleSettingChange("default_meetup_status", v)}
            disabled={!isAdmin}
          />
        </SettingSection>
      </div>
    </div>
  );
}
