"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Loader2,
  Mail,
  Lock,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupId } from "@/components/providers/group-provider";
import { useGroupMembers } from "@/lib/queries/members";
import {
  SettingsHeader,
  SettingSection,
} from "@/components/settings/setting-components";
import { cn } from "@/lib/utils/cn";

const AVATAR_COLORS = [
  "#007AFF",
  "#FF9500",
  "#FF2D55",
  "#5856D6",
  "#34C759",
  "#AF52DE",
  "#FF3B30",
  "#00C7BE",
];

type ConfirmDialog = "delete-account" | null;

export default function AccountSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUser();
  const { groupId } = useGroupId();
  const { data: members } = useGroupMembers(groupId);

  // Current member data
  const currentMember = members?.find((m: any) => m.user_id === user?.id);

  // Display name
  const [displayName, setDisplayName] = useState("");
  const [nameEditing, setNameEditing] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Avatar color
  const [selectedColor, setSelectedColor] = useState("");
  const [colorSaving, setColorSaving] = useState(false);
  const [colorSuccess, setColorSuccess] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  // Password
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  // Delete account
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Initialize from current member data
  useEffect(() => {
    if (currentMember) {
      setDisplayName(currentMember.display_name ?? "");
      setSelectedColor(currentMember.avatar_url ?? AVATAR_COLORS[0]);
    }
  }, [currentMember]);

  const initial = displayName.charAt(0).toUpperCase() || "?";

  // ── Save display name ───────────────────────────────────────
  async function handleSaveName() {
    if (!displayName.trim() || !user || !groupId) return;
    setNameSaving(true);
    try {
      // Update all group_members rows for this user
      await supabase
        .from("group_members")
        .update({ display_name: displayName.trim() })
        .eq("user_id", user.id);

      // Also update user_metadata for consistency
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });

      setNameEditing(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2000);
    } finally {
      setNameSaving(false);
    }
  }

  // ── Save avatar color ───────────────────────────────────────
  async function handleSaveColor(color: string) {
    if (!user) return;
    setSelectedColor(color);
    setColorSaving(true);
    try {
      // Update all group_members rows for this user
      await supabase
        .from("group_members")
        .update({ avatar_url: color })
        .eq("user_id", user.id);

      localStorage.setItem("avatar_color", color);
      setColorSuccess(true);
      setTimeout(() => setColorSuccess(false), 2000);
    } finally {
      setColorSaving(false);
    }
  }

  // ── Change email ────────────────────────────────────────────
  async function handleChangeEmail() {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    setEmailMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });
      if (error) {
        setEmailMessage({ ok: false, msg: error.message });
      } else {
        setEmailMessage({
          ok: true,
          msg: "Confirmation sent to your new email address.",
        });
        setNewEmail("");
        setEmailEditing(false);
      }
    } finally {
      setEmailSaving(false);
    }
  }

  // ── Change password ─────────────────────────────────────────
  async function handleChangePassword() {
    if (newPassword.length < 6) {
      setPasswordMessage({
        ok: false,
        msg: "Password must be at least 6 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ ok: false, msg: "Passwords don't match." });
      return;
    }
    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setPasswordMessage({ ok: false, msg: error.message });
      } else {
        setPasswordMessage({
          ok: true,
          msg: "Password updated successfully.",
        });
        setNewPassword("");
        setConfirmPassword("");
        setPasswordEditing(false);
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  // ── Delete account ──────────────────────────────────────────
  async function handleDeleteAccount() {
    // Note: Supabase client SDK doesn't support self-deletion.
    // This would need a server action or edge function with service_role key.
    // For now, show that the feature exists but redirect to support.
    setDeleting(true);
    // Placeholder — you'll wire this to a server action later
    setTimeout(() => {
      setDeleting(false);
      setConfirmDialog(null);
      alert(
        "To delete your account, please contact support at noreply@clubplay.io"
      );
    }, 1000);
  }

  return (
    <div className="pb-36">
      <SettingsHeader title="Account" onBack={() => router.back()} />

      <div className="px-5 mt-4 space-y-5">
        {/* ── Avatar & Name ────────────────────────────────────── */}
        <div className="flex flex-col items-center py-6">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center text-white text-[32px] font-bold mb-4 shadow-lg transition-colors"
            style={{ backgroundColor: selectedColor || AVATAR_COLORS[0] }}
          >
            {initial}
          </div>
          {nameEditing ? (
            <div className="w-full max-w-[260px] space-y-3">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3 text-[17px] text-center font-semibold focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Your name"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDisplayName(currentMember?.display_name ?? "");
                    setNameEditing(false);
                  }}
                  className="flex-1 bg-gray-100 rounded-[12px] py-2.5 text-[15px] font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving || !displayName.trim()}
                  className="flex-1 bg-[#161719] text-white rounded-[12px] py-2.5 text-[15px] font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {nameSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setNameEditing(true)}
              className="flex items-center gap-2"
            >
              <p className="text-[20px] font-bold text-gray-900">
                {displayName || "Set your name"}
              </p>
              {nameSuccess && <Check className="h-4 w-4 text-green-500" />}
            </button>
          )}
          <p className="text-[13px] text-gray-400 mt-1">
            Tap name to edit
          </p>
        </div>

        {/* ── Avatar Color ─────────────────────────────────────── */}
        <SettingSection title="Avatar Color">
          <div className="px-5 py-5">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleSaveColor(color)}
                  disabled={colorSaving}
                  className={cn(
                    "h-10 w-10 rounded-full transition-all duration-200 flex items-center justify-center",
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-[#161719] scale-110"
                      : "opacity-70 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
            {colorSuccess && (
              <p className="text-[13px] text-green-600 text-center mt-3">
                Avatar color updated
              </p>
            )}
          </div>
        </SettingSection>

        {/* ── Email ────────────────────────────────────────────── */}
        <SettingSection title="Email">
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-1">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <p className="text-[15px] text-gray-500">{user?.email}</p>
            </div>
            {emailEditing ? (
              <div className="mt-3 space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailMessage(null);
                  }}
                  placeholder="New email address"
                  className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEmailEditing(false);
                      setNewEmail("");
                      setEmailMessage(null);
                    }}
                    className="flex-1 bg-gray-100 rounded-[12px] py-2.5 text-[15px] font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeEmail}
                    disabled={emailSaving || !newEmail.trim()}
                    className="flex-1 bg-[#161719] text-white rounded-[12px] py-2.5 text-[15px] font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {emailSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEmailEditing(true)}
                className="mt-2 text-[15px] font-semibold text-[#007AFF]"
              >
                Change email
              </button>
            )}
            {emailMessage && (
              <p
                className={cn(
                  "text-[13px] mt-2",
                  emailMessage.ok ? "text-green-600" : "text-red-500"
                )}
              >
                {emailMessage.msg}
              </p>
            )}
          </div>
        </SettingSection>

        {/* ── Password ─────────────────────────────────────────── */}
        <SettingSection title="Password">
          <div className="px-5 py-4">
            {passwordEditing ? (
              <div className="space-y-3">
                <div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordMessage(null);
                    }}
                    placeholder="New password"
                    className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
                    autoFocus
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordMessage(null);
                    }}
                    placeholder="Confirm new password"
                    className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPasswordEditing(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordMessage(null);
                    }}
                    className="flex-1 bg-gray-100 rounded-[12px] py-2.5 text-[15px] font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={passwordSaving || !newPassword}
                    className="flex-1 bg-[#161719] text-white rounded-[12px] py-2.5 text-[15px] font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {passwordSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <p className="text-[15px] text-gray-500">••••••••</p>
                </div>
                <button
                  onClick={() => setPasswordEditing(true)}
                  className="text-[15px] font-semibold text-[#007AFF]"
                >
                  Change
                </button>
              </div>
            )}
            {passwordMessage && (
              <p
                className={cn(
                  "text-[13px] mt-2",
                  passwordMessage.ok ? "text-green-600" : "text-red-500"
                )}
              >
                {passwordMessage.msg}
              </p>
            )}
          </div>
        </SettingSection>

        {/* ── Danger Zone ──────────────────────────────────────── */}
        <div className="pt-2">
          <button
            onClick={() => setConfirmDialog("delete-account")}
            className="w-full flex items-center justify-center gap-2 py-4 text-[17px] font-semibold text-red-500 active:opacity-60 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* ── Delete Confirm Dialog ────────────────────────────── */}
      {confirmDialog === "delete-account" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !deleting && setConfirmDialog(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-[24px] px-5 py-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-gray-900">
                  Delete your account?
                </p>
                <p className="text-[14px] text-gray-500 mt-0.5">
                  This will permanently remove all your data, group
                  memberships, and game history. This cannot be undone.
                </p>
              </div>
            </div>
            <div>
              <p className="text-[13px] text-gray-500 mb-2">
                Type <span className="font-semibold">delete</span> to confirm:
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setConfirmDialog(null);
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
                className="flex-1 bg-gray-100 text-gray-900 rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "delete"}
                className="flex-1 bg-red-500 text-white rounded-[14px] py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
