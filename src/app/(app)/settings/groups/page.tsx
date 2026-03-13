"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Plus,
  UserPlus,
  Loader2,
  Shield,
  AlertCircle,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import {
  useUserGroups,
  useCreateGroup,
  useLookupGroupByInviteCode,
  useJoinGroup,
} from "@/lib/queries/groups";
import { useLeaveGroup } from "@/lib/queries/members";
import {
  SettingsHeader,
  SettingSection,
} from "@/components/settings/setting-components";
import { cn } from "@/lib/utils/cn";

type View = "list" | "create" | "join" | "confirm-join";

export default function GroupsPage() {
  const router = useRouter();
  const { groupId, switchGroup } = useGroupId();
  const { data: userGroups, isLoading: groupsLoading } = useUserGroups();
  const createGroup = useCreateGroup();
  const lookupGroup = useLookupGroupByInviteCode();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const [view, setView] = useState<View>("list");
  const [leaveTarget, setLeaveTarget] = useState<{
    groupId: string;
    name: string;
    isOnlyOwner: boolean;
    isLastMember: boolean;
  } | null>(null);

  // Create group form
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Join group form
  const [inviteCode, setInviteCode] = useState("");
  const [foundGroup, setFoundGroup] = useState<{
    id: string;
    name: string;
    description: string | null;
  } | null>(null);

  async function handleCreateGroup() {
    if (!newName.trim()) return;
    try {
      const group = await createGroup.mutateAsync({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      switchGroup(group.id);
      setNewName("");
      setNewDescription("");
      setView("list");
    } catch {
      // Error shown via mutation state
    }
  }

  async function handleLookupCode() {
    if (inviteCode.trim().length < 4) return;
    try {
      const group = await lookupGroup.mutateAsync(inviteCode);
      setFoundGroup(group);
      setView("confirm-join");
    } catch {
      // Error shown via mutation state
    }
  }

  async function handleConfirmJoin() {
    if (!foundGroup) return;
    try {
      await joinGroup.mutateAsync({ groupId: foundGroup.id });
      switchGroup(foundGroup.id);
      setInviteCode("");
      setFoundGroup(null);
      setView("list");
    } catch {
      // Error shown via mutation state
    }
  }

  function resetToList() {
    setView("list");
    setNewName("");
    setNewDescription("");
    setInviteCode("");
    setFoundGroup(null);
    createGroup.reset();
    lookupGroup.reset();
    joinGroup.reset();
  }

  function requestLeave(g: NonNullable<typeof userGroups>[number]) {
    if (!userGroups) return;
    const groupMembers = userGroups.filter((x) => x.group_id === g.group_id);
    const isOnlyOwner =
      g.role === "owner" &&
      userGroups.filter(
        (x) => x.group_id === g.group_id && x.role === "owner"
      ).length === 1;
    const isLastMember = userGroups.filter((x) => x.group_id === g.group_id).length === 1;
    setLeaveTarget({
      groupId: g.group_id,
      name: g.name,
      isOnlyOwner,
      isLastMember,
    });
  }

  async function handleConfirmLeave() {
    if (!leaveTarget) return;
    try {
      await leaveGroup.mutateAsync({ groupId: leaveTarget.groupId });
      if (leaveTarget.groupId === groupId) {
        const remaining = (userGroups ?? []).filter(
          (g) => g.group_id !== leaveTarget.groupId
        );
        if (remaining.length > 0) {
          switchGroup(remaining[0].group_id);
        }
      }
      setLeaveTarget(null);
    } catch {
      // Error shown via mutation state
    }
  }

  return (
    <div className="pb-36">
      <SettingsHeader title="Your Groups" onBack={() => router.back()} />

      <div className="px-5 mt-4 space-y-5">
        {/* ── Group list ────────────────────────────────────────── */}
        {view === "list" && (
          <>
            <SettingSection title="Groups">
              {groupsLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
                </div>
              ) : userGroups && userGroups.length > 0 ? (
                userGroups.map((g) => {
                  const isActive = g.group_id === groupId;
                  const initial = g.name.charAt(0).toUpperCase();
                  return (
                    <div key={g.group_id} className="flex items-center">
                      <button
                        onClick={() => {
                          if (!isActive) switchGroup(g.group_id);
                        }}
                        className={cn(
                          "flex-1 flex items-center gap-3 px-5 py-4 text-left transition-colors",
                          isActive ? "bg-[#007AFF]/[0.04]" : "active:bg-gray-50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-11 w-11 rounded-[13px] flex items-center justify-center shrink-0 text-[17px] font-bold",
                            isActive
                              ? "bg-[#007AFF] text-white"
                              : "bg-gray-100 text-gray-500"
                          )}
                        >
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[17px] font-semibold text-gray-900 truncate">
                              {g.name}
                            </p>
                            {g.role === "owner" && (
                              <Shield className="h-3.5 w-3.5 text-[#007AFF] shrink-0" />
                            )}
                          </div>
                          {g.description && (
                            <p className="text-[13px] text-gray-500 truncate mt-0.5">
                              {g.description}
                            </p>
                          )}
                        </div>
                        {isActive && (
                          <Check className="h-5 w-5 text-[#007AFF] shrink-0" />
                        )}
                      </button>
                      <button
                        onClick={() => requestLeave(g)}
                        className="pr-5 pl-2 py-4 text-red-500 hover:text-red-600 active:text-red-700 transition-colors"
                        title={`Leave ${g.name}`}
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <p className="text-[15px] text-gray-500">No groups yet.</p>
                </div>
              )}
            </SettingSection>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setView("create")}
                className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
              >
                <Plus className="h-5 w-5" />
                Create a Group
              </button>
              <button
                onClick={() => setView("join")}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 rounded-[14px] py-4 text-[17px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform"
              >
                <UserPlus className="h-5 w-5" />
                Join a Group
              </button>
            </div>
          </>
        )}

        {/* ── Create group form ─────────────────────────────────── */}
        {view === "create" && (
          <SettingSection title="Create a Group">
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Group Name
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  placeholder="Friday Night Games"
                  autoFocus
                  maxLength={60}
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  placeholder="What's your group about?"
                  rows={2}
                  maxLength={200}
                />
              </div>

              {createGroup.isError && (
                <div className="flex items-center gap-2 text-red-500 text-[14px]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to create group. Please try again.</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={resetToList}
                  className="flex-1 bg-gray-200 text-gray-900 rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newName.trim() || createGroup.isPending}
                  className={cn(
                    "flex-1 bg-black text-white rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform",
                    (!newName.trim() || createGroup.isPending) && "opacity-50"
                  )}
                >
                  {createGroup.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </div>
          </SettingSection>
        )}

        {/* ── Join group form ──────────────────────────────────── */}
        {view === "join" && (
          <SettingSection title="Join a Group">
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Invite Code
                </label>
                <input
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    lookupGroup.reset();
                  }}
                  className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[22px] font-mono font-bold tracking-[0.15em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-[13px] text-gray-400 mt-2 text-center">
                  Ask a group member for their 6-character invite code
                </p>
              </div>

              {lookupGroup.isError && (
                <div className="flex items-center gap-2 text-red-500 text-[14px]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>No group found with that code. Check and try again.</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={resetToList}
                  className="flex-1 bg-gray-200 text-gray-900 rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLookupCode}
                  disabled={inviteCode.trim().length < 4 || lookupGroup.isPending}
                  className={cn(
                    "flex-1 bg-[#007AFF] text-white rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform",
                    (inviteCode.trim().length < 4 || lookupGroup.isPending) &&
                      "opacity-50"
                  )}
                >
                  {lookupGroup.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Look Up"
                  )}
                </button>
              </div>
            </div>
          </SettingSection>
        )}

        {/* ── Confirm join ────────────────────────────────────── */}
        {view === "confirm-join" && foundGroup && (
          <SettingSection title="Join Group">
            <div className="p-5 space-y-5">
              <div className="text-center">
                <div className="h-16 w-16 rounded-[18px] bg-[#007AFF]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[28px] font-bold text-[#007AFF]">
                    {foundGroup.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-[22px] font-bold text-gray-900">
                  {foundGroup.name}
                </h2>
                {foundGroup.description && (
                  <p className="text-[15px] text-gray-500 mt-1">
                    {foundGroup.description}
                  </p>
                )}
              </div>

              {joinGroup.isError && (
                <div className="flex items-center gap-2 text-red-500 text-[14px]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to join. Please try again.</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resetToList}
                  className="flex-1 bg-gray-200 text-gray-900 rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmJoin}
                  disabled={joinGroup.isPending}
                  className={cn(
                    "flex-1 bg-[#007AFF] text-white rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform",
                    joinGroup.isPending && "opacity-50"
                  )}
                >
                  {joinGroup.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Join Group"
                  )}
                </button>
              </div>
            </div>
          </SettingSection>
        )}
      </div>

      {/* ── Leave Group Confirm Dialog ─────────────────────────── */}
      {leaveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !leaveGroup.isPending && setLeaveTarget(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-[24px] px-5 py-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-gray-900">
                  Leave {leaveTarget.name}?
                </p>
                <p className="text-[14px] text-gray-500 mt-0.5">
                  {leaveTarget.isOnlyOwner && !leaveTarget.isLastMember
                    ? "You're the only admin. Transfer ownership to another member before leaving."
                    : leaveTarget.isLastMember
                    ? "You're the last member. Leaving will delete this group and all its data."
                    : "You'll lose access to all meetups and history for this group."}
                </p>
              </div>
            </div>

            {leaveGroup.isError && (
              <div className="flex items-center gap-2 text-red-500 text-[14px]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Failed to leave group. Please try again.</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setLeaveTarget(null)}
                disabled={leaveGroup.isPending}
                className="flex-1 bg-gray-100 text-gray-900 rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeave}
                disabled={leaveGroup.isPending || (leaveTarget.isOnlyOwner && !leaveTarget.isLastMember)}
                className="flex-1 bg-red-500 text-white rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center"
              >
                {leaveGroup.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Leave Group"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
