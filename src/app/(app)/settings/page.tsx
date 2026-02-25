"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Copy,
  Check,
  LogOut,
  Users,
  Shield,
  Share2,
  Mail,
} from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroup } from "@/lib/queries/groups";
import { useGroupMembers } from "@/lib/queries/members";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: group, isLoading: groupLoadingData } = useGroup(groupId);
  const { data: members, isLoading: membersLoading } =
    useGroupMembers(groupId);

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleCopyCode() {
    if (!group?.invite_code) return;
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
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
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch {
        // Fallback for older browsers
      }
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

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isLoading = groupLoading || groupLoadingData;

  return (
    <div className="pb-36">
      {/* Glass header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          Settings
        </h1>
      </div>

      <div className="px-5 space-y-5 mt-2">
        {/* Group Info */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Group Info
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5">
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-16" />
                <SkeletonBlock className="h-6 w-48" />
              </div>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Group Name
                </p>
                <p className="text-[17px] font-semibold text-gray-900">
                  {group?.name ?? "Unknown Group"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Invite Code */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Invite Code
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5">
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-10 w-40 mx-auto" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            ) : group?.invite_code ? (
              <div className="space-y-4">
                <p className="text-[32px] font-bold tracking-[0.2em] text-center text-gray-900 font-mono">
                  {group.invite_code}
                </p>
                <button
                  onClick={handleCopyCode}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 rounded-[14px] py-3.5 text-[17px] font-semibold text-gray-900 active:scale-[0.98] transition-transform"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-[15px] text-gray-500 text-center py-2">
                No invite code generated
              </p>
            )}
          </div>
        </div>

        {/* Invite Friends */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Invite Friends
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5">
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-10 w-full" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            ) : group?.invite_code ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Shareable Link
                  </p>
                  <p className="text-[15px] text-gray-600 bg-gray-50 rounded-[10px] px-3 py-2.5 font-mono text-[13px] break-all select-all">
                    {getInviteLink()}
                  </p>
                </div>
                <button
                  onClick={handleShareLink}
                  className="w-full flex items-center justify-center gap-2 bg-[#007AFF] rounded-[14px] py-3.5 text-[17px] font-semibold text-white active:scale-[0.98] transition-transform"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-5 w-5" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-5 w-5" />
                      Share Invite Link
                    </>
                  )}
                </button>
                <button
                  onClick={handleEmailInvite}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 rounded-[14px] py-3.5 text-[17px] font-semibold text-gray-900 active:scale-[0.98] transition-transform"
                >
                  <Mail className="h-5 w-5" />
                  Email Invite
                </button>
              </div>
            ) : (
              <p className="text-[15px] text-gray-500 text-center py-2">
                No invite code available
              </p>
            )}
          </div>
        </div>

        {/* Members */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Members
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {membersLoading || groupLoading ? (
              <div className="p-4 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <SkeletonBlock className="h-4 w-32" />
                      <SkeletonBlock className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !members || members.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-[15px] text-gray-500">No members found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((member: any) => {
                  const initial =
                    member.display_name?.charAt(0)?.toUpperCase() ?? "?";
                  const isOwner = member.role === "owner";
                  const isCurrentUser = user && member.user_id === user.id;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 bg-red-500 text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
