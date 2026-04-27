"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const AVATAR_COLORS = [
  "#007AFF", "#FF9500", "#FF2D55", "#5856D6",
  "#34C759", "#AF52DE", "#FF3B30", "#00C7BE",
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  X,
  Users,
  Shield,
  Share2,
  Mail,
  Pencil,
  UserMinus,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroup, useUpdateGroup, useDeleteGroup } from "@/lib/queries/groups";
import {
  useGroupMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useLeaveGroup,
} from "@/lib/queries/members";
import { useGroupSettings, useUpdateGroupSettings } from "@/lib/queries/settings";
import {
  SettingsHeader,
  SettingSection,
  SettingToggle,
  SettingSelect,
  SettingRow,
} from "@/components/settings/setting-components";
import { EmojiPicker } from "@/components/features/groups/emoji-picker";
import { cn } from "@/lib/utils/cn";
import { sendInviteEmail } from "@/lib/actions/send-invite-email";

const MAX_ADMINS = 3;

type ConfirmDialog =
  | { type: "remove"; memberId: string; name: string }
  | { type: "demote"; memberId: string; name: string }
  | { type: "leave" }
  | { type: "delete" };

export default function GroupSettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { groupId, switchGroup } = useGroupId();
  const { data: group } = useGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: settings } = useGroupSettings(groupId);
  const updateGroup = useUpdateGroup();
  const updateSettings = useUpdateGroupSettings();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editGroupEmoji, setEditGroupEmoji] = useState("🎮");
  const [meetupFormatInput, setMeetupFormatInput] = useState("");
  const [editingFormat, setEditingFormat] = useState(false);
  const [formatDraft, setFormatDraft] = useState("");

  useEffect(() => {
    if (settings?.default_meetup_name_format) {
      setMeetupFormatInput(
        settings.default_meetup_name_format.replace(/\s*#\{n\}\s*$/, "").trim()
      );
    }
  }, [settings?.default_meetup_name_format]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    if (!members || !user) return false;
    const me = members.find((m: any) => m.user_id === user.id);
    return me?.role === "owner";
  }, [members, user]);

  const adminCount = useMemo(
    () => (members ?? []).filter((m: any) => m.role === "owner").length,
    [members]
  );

  const myMemberId = useMemo(
    () => members?.find((m: any) => m.user_id === user?.id)?.id ?? null,
    [members, user]
  );

  function startEditingGroup() {
    setEditGroupName(group?.name ?? "");
    setEditGroupDescription(group?.description ?? "");
    setEditGroupEmoji(group?.emoji ?? "🎮");
    setEditingGroup(true);
  }

  async function handleConfirmFormat() {
    if (!groupId) return;
    const fullFormat = `${meetupFormatInput.trim() || "Game Night"} #{n}`;
    if (fullFormat !== settings?.default_meetup_name_format) {
      await updateSettings.mutateAsync({ groupId, updates: { default_meetup_name_format: fullFormat } });
    }
    setEditingFormat(false);
  }

  function handleCancelFormat() {
    setMeetupFormatInput(formatDraft);
    setEditingFormat(false);
  }

  async function handleSaveGroup() {
    if (!groupId) return;
    try {
      await updateGroup.mutateAsync({
        groupId,
        updates: {
          name: editGroupName.trim() || group?.name,
          description: editGroupDescription.trim() || null,
          emoji: editGroupEmoji,
        },
      });
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

  async function handleEmailInvite() {
    if (!inviteEmail.trim() || !groupId) return;
    setInviteSending(true);
    const result = await sendInviteEmail({ toEmail: inviteEmail.trim(), groupId });
    setInviteSending(false);
    if (result.success) {
      toast.success(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
    } else {
      toast.error(result.error ?? "Failed to send invite");
    }
  }

  function handleSettingChange(key: string, value: any) {
    if (!groupId) return;
    updateSettings.mutate({ groupId, updates: { [key]: value } });
  }

  function handlePromote(memberId: string) {
    if (!groupId) return;
    setPromoteError(null);
    if (adminCount >= MAX_ADMINS) {
      setPromoteError(`This group already has ${MAX_ADMINS} admins. Demote one before promoting another.`);
      return;
    }
    updateMemberRole.mutate({ memberId, groupId, role: "owner" });
  }

  function handleDemoteRequest(memberId: string, name: string) {
    setConfirmDialog({ type: "demote", memberId, name });
  }

  async function handleDemoteConfirm() {
    if (!groupId || confirmDialog?.type !== "demote") return;
    await updateMemberRole.mutateAsync({
      memberId: confirmDialog.memberId,
      groupId,
      role: "member",
    });
    setConfirmDialog(null);
  }

  async function handleRemoveConfirm() {
    if (!groupId || confirmDialog?.type !== "remove") return;
    await removeMember.mutateAsync({ memberId: confirmDialog.memberId, groupId });
    setConfirmDialog(null);
  }

  async function handleLeaveConfirm() {
    if (!groupId) return;
    await leaveGroup.mutateAsync({ groupId });
    setConfirmDialog(null);
    // Switch to another group if available
    router.push("/settings/groups");
  }

  async function handleDeleteConfirm() {
    if (!groupId) return;
    await deleteGroup.mutateAsync({ groupId });
    setConfirmDialog(null);
    router.push("/settings/groups");
  }

  const isPending =
    updateMemberRole.isPending ||
    removeMember.isPending ||
    leaveGroup.isPending ||
    deleteGroup.isPending;

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
                  Group Icon
                </label>
                <EmojiPicker value={editGroupEmoji} onChange={setEditGroupEmoji} />
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
                    {group?.emoji ?? "🎮"} {group?.name ?? "Loading..."}
                  </p>
                  {group?.description && (
                    <p className="text-[15px] text-gray-500 mt-1">
                      {group.description}
                    </p>
                  )}
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
        <SettingSection
          title={
            isAdmin
              ? `Members · ${adminCount}/${MAX_ADMINS} admins`
              : "Members"
          }
        >
          {promoteError && (
            <div className="mx-5 mb-2 flex items-center gap-2 bg-amber-50 rounded-[12px] px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-[13px] text-amber-700">{promoteError}</p>
            </div>
          )}
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
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[17px] font-semibold shrink-0"
                      style={{ backgroundColor: member.avatar_url ?? getAvatarColor(member.display_name ?? "") }}
                    >
                      {initial}
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
                          onClick={() =>
                            isOwner
                              ? handleDemoteRequest(member.id, member.display_name)
                              : handlePromote(member.id)
                          }
                          disabled={updateMemberRole.isPending}
                          className="p-2 text-gray-400 active:text-[#007AFF] transition-colors disabled:opacity-40"
                          title={isOwner ? "Demote to member" : "Promote to admin"}
                        >
                          {isOwner ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              type: "remove",
                              memberId: member.id,
                              name: member.display_name,
                            })
                          }
                          disabled={removeMember.isPending}
                          className="p-2 text-gray-400 active:text-red-500 transition-colors disabled:opacity-40"
                          title="Remove from group"
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
          {isAdmin && (
            <>
              <SettingToggle
                label="Include in all-time stats"
                description="Count guest scores in leaderboards"
                value={settings?.guest_include_in_stats ?? false}
                onChange={(v) => handleSettingChange("guest_include_in_stats", v)}
              />
              <SettingToggle
                label="Allow recurring guests"
                description="Let the same guest join multiple meetups"
                value={settings?.guest_allow_recurring ?? true}
                onChange={(v) => handleSettingChange("guest_allow_recurring", v)}
              />
            </>
          )}
          {(isAdmin || (settings?.perm_members_can_view_guest_archive ?? true)) && (
            <SettingRow
              label="Manage guest archive"
              description="View and manage all past guests"
              onClick={() => router.push("/guests")}
            />
          )}
        </SettingSection>

        {/* ── Invites ───────────────────────────────────────────── */}
        {(isAdmin || (settings?.perm_members_can_share_invite ?? true)) && (
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
                <div className="px-5 pb-4 pt-2 space-y-2">
                  <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                    Send Email Invite
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEmailInvite()}
                      placeholder="friend@example.com"
                      className="flex-1 bg-[#F2F2F7] rounded-[12px] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                    <button
                      onClick={handleEmailInvite}
                      disabled={!inviteEmail.trim() || inviteSending}
                      className="flex items-center justify-center gap-1.5 bg-[#161719] text-white rounded-[12px] px-4 py-3 text-[15px] font-semibold active:scale-[0.97] transition-transform disabled:opacity-40"
                    >
                      {inviteSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-5 text-center">
                <p className="text-[15px] text-gray-500">No invite code generated</p>
              </div>
            )}
          </SettingSection>
        )}

        {/* ── Meetup Defaults (admin only) ──────────────────────── */}
        {isAdmin && (
          <SettingSection title="Meetup Defaults">
            <div className="px-5 py-4">
              {editingFormat ? (
                <>
                  <p className="text-[17px] text-gray-900 mb-3">Meetup Name Format</p>
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={meetupFormatInput}
                      onChange={(e) => setMeetupFormatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleConfirmFormat(); if (e.key === "Escape") handleCancelFormat(); }}
                      className="flex-1 bg-[#F2F2F7] rounded-[14px] px-4 py-3 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                      placeholder="Game Night"
                    />
                    <button onClick={handleConfirmFormat} className="h-10 w-10 flex items-center justify-center rounded-full bg-[#34C759]/15 active:opacity-60 shrink-0">
                      <Check className="h-5 w-5 text-[#34C759]" />
                    </button>
                    <button onClick={handleCancelFormat} className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 active:opacity-60 shrink-0">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  {meetupFormatInput.trim() && (
                    <p className="text-[13px] text-gray-400 mt-2">
                      e.g. {meetupFormatInput.trim()} #1, {meetupFormatInput.trim()} #2
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[17px] text-gray-900">Meetup Name Format</p>
                    <p className="text-[15px] text-gray-400 mt-0.5">
                      {meetupFormatInput || "Game Night"} #1, #2, ...
                    </p>
                  </div>
                  <button
                    onClick={() => { setFormatDraft(meetupFormatInput); setEditingFormat(true); }}
                    className="text-[#007AFF] active:opacity-60 transition-opacity p-1"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <SettingToggle
              label="Auto-include all members"
              description="Pre-select all core members for new meetups"
              value={settings?.auto_include_all_members ?? true}
              onChange={(v) => handleSettingChange("auto_include_all_members", v)}
            />
            <SettingSelect
              label="Default status on creation"
              value={settings?.default_meetup_status ?? "planned"}
              options={[
                { label: "Planned", value: "planned" },
                { label: "Active", value: "active" },
              ]}
              onChange={(v) => handleSettingChange("default_meetup_status", v)}
            />
          </SettingSection>
        )}

        {/* ── Permissions (admin only) ───────────────────────────── */}
        {isAdmin && (
          <SettingSection title="Permissions">
            <SettingRow
              label="Member Permissions"
              description="Control what members can see and do"
              onClick={() => router.push("/settings/group/permissions")}
            />
          </SettingSection>
        )}

        {/* ── Danger Zone ───────────────────────────────────────── */}
        <div className="pt-2">
          {isAdmin ? (
            <button
              onClick={() => setConfirmDialog({ type: "delete" })}
              className="w-full flex items-center justify-center gap-2 py-4 text-[17px] font-semibold text-red-500 active:opacity-60 transition-opacity"
            >
              Delete Group
            </button>
          ) : (
            <button
              onClick={() => setConfirmDialog({ type: "leave" })}
              className="w-full flex items-center justify-center gap-2 py-4 text-[17px] font-semibold text-red-500 active:opacity-60 transition-opacity"
            >
              Leave Group
            </button>
          )}
        </div>
      </div>

      {/* ── Confirm Dialog ────────────────────────────────────── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isPending && setConfirmDialog(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-[24px] px-5 py-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-gray-900">
                  {confirmDialog.type === "remove" && `Remove ${confirmDialog.name}?`}
                  {confirmDialog.type === "demote" && `Demote ${confirmDialog.name}?`}
                  {confirmDialog.type === "leave" && "Leave this group?"}
                  {confirmDialog.type === "delete" && "Delete this group?"}
                </p>
                <p className="text-[14px] text-gray-500 mt-0.5">
                  {confirmDialog.type === "remove" &&
                    "They'll lose access to all group data and meetups."}
                  {confirmDialog.type === "demote" &&
                    "They'll become a regular member and lose admin access."}
                  {confirmDialog.type === "leave" &&
                    "You'll lose access to this group's meetups and history."}
                  {confirmDialog.type === "delete" &&
                    "All meetups, sessions, scores, and guests will be permanently deleted. This cannot be undone."}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                disabled={isPending}
                className="flex-1 bg-gray-100 text-gray-900 rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.type === "remove") handleRemoveConfirm();
                  else if (confirmDialog.type === "demote") handleDemoteConfirm();
                  else if (confirmDialog.type === "leave") handleLeaveConfirm();
                  else if (confirmDialog.type === "delete") handleDeleteConfirm();
                }}
                disabled={isPending}
                className="flex-1 bg-red-500 text-white rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {confirmDialog.type === "remove" && "Remove"}
                    {confirmDialog.type === "demote" && "Demote"}
                    {confirmDialog.type === "leave" && "Leave Group"}
                    {confirmDialog.type === "delete" && "Delete Group"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
