"use client";

import { useState, type FormEvent } from "react";
import { UserPlus, Loader2, ArrowUpRight, X, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGuests, useCreateGuest } from "@/lib/queries/guests";
import { useGroupMembers } from "@/lib/queries/members";
import { useGroupSettings } from "@/lib/queries/settings";
import { sendPromoteEmail } from "@/lib/actions/send-promote-email";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

export default function GuestsPage() {
  const { groupId, loading: groupLoading } = useGroupId();
  const { user } = useUser();
  const { data: allGuests, isLoading: guestsLoading } = useGuests(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: settings } = useGroupSettings(groupId);
  const createGuest = useCreateGuest();

  const [name, setName] = useState("");
  const [promoteGuest, setPromoteGuest] = useState<{ id: string; name: string } | null>(null);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteSending, setPromoteSending] = useState(false);

  const currentMember = members?.find((m: any) => m.user_id === user?.id);
  const isAdmin = currentMember?.role === "owner";
  const ownGuestsOnly =
    !isAdmin && (settings?.perm_members_manage_own_guests_only ?? false);

  const guests = ownGuestsOnly
    ? allGuests?.filter((g: any) => g.invited_by === currentMember?.id)
    : allGuests;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !groupId) return;

    await createGuest.mutateAsync({
      groupId,
      name: trimmed,
      guestType: "temporary",
      invitedBy: currentMember?.id,
    });
    setName("");
  }

  async function handlePromote(e: FormEvent) {
    e.preventDefault();
    if (!promoteGuest || !promoteEmail.trim() || !groupId) return;
    setPromoteSending(true);
    const result = await sendPromoteEmail({
      toEmail: promoteEmail.trim(),
      guestId: promoteGuest.id,
      groupId,
    });
    setPromoteSending(false);
    if (result.success) {
      toast.success(`Invite sent to ${promoteEmail.trim()}`);
      setPromoteGuest(null);
      setPromoteEmail("");
    } else {
      toast.error(result.error ?? "Failed to send invite");
    }
  }

  const isLoading = groupLoading || guestsLoading;

  return (
    <div className="pb-28">
      <PageHeader title="Guests" backLabel="Group Settings" backHref="/settings/group" variant="large" />

      <div className="px-5 space-y-5 mt-2">
        {/* Add Guest Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Guest name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-white rounded-[14px] px-4 py-3.5 text-[17px] text-gray-900 placeholder:text-gray-400 shadow-[0_2px_8px_rgba(0,0,0,0.04)] outline-none focus:ring-2 focus:ring-[#007AFF]"
          />
          <button
            type="submit"
            disabled={!name.trim() || createGuest.isPending}
            className="bg-black text-white rounded-[14px] px-6 py-3.5 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100"
          >
            {createGuest.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Add"
            )}
          </button>
        </form>

        {createGuest.isError && (
          <p className="text-red-500 text-[15px] px-1">
            Failed to add guest. Please try again.
          </p>
        )}

        {/* Guest List */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            {ownGuestsOnly ? "Your Guests" : "All Guests"}
          </p>
          {ownGuestsOnly && (
            <p className="text-[13px] text-gray-400 mb-3 px-1">
              Showing only guests you've invited.
            </p>
          )}
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <SkeletonBlock className="h-4 w-32" />
                      <SkeletonBlock className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !guests || guests.length === 0 ? (
              <div className="p-8 text-center">
                <UserPlus className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-[15px] text-gray-500">
                  No guests yet. Add someone above to get started!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {guests.map((guest: any) => {
                  const initial = guest.name?.charAt(0)?.toUpperCase() ?? "?";
                  const isRecurring = guest.guest_type === "recurring";
                  const inviterName =
                    guest.group_members?.display_name ?? null;
                  const isPromoted = !!guest.promoted_to_user_id;

                  return (
                    <div
                      key={guest.id}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        isPromoted ? "bg-green-100" : "bg-gray-200"
                      )}>
                        <span className={cn(
                          "text-[17px] font-semibold",
                          isPromoted ? "text-green-600" : "text-gray-600"
                        )}>
                          {initial}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[17px] font-semibold text-gray-900 truncate">
                            {guest.name}
                          </p>
                          {isPromoted ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                              Promoted
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
                                isRecurring
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-500"
                              )}
                            >
                              {guest.guest_type}
                            </span>
                          )}
                        </div>
                        {inviterName && (
                          <p className="text-[13px] text-gray-500">
                            Invited by {inviterName}
                          </p>
                        )}
                      </div>
                      {isAdmin && !isPromoted && (
                        <button
                          onClick={() => {
                            setPromoteGuest({ id: guest.id, name: guest.name });
                            setPromoteEmail("");
                          }}
                          className="shrink-0 flex items-center gap-1 text-[13px] font-semibold text-[#007AFF] active:opacity-60 transition-opacity"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Promote
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Promote Guest Modal */}
      {promoteGuest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPromoteGuest(null)}
          />
          <div className="relative w-full max-w-[400px] bg-white rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl sm:mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-bold text-gray-900">
                Promote {promoteGuest.name}
              </h3>
              <button
                onClick={() => setPromoteGuest(null)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-[15px] text-gray-500 mb-5 leading-relaxed">
              Send {promoteGuest.name} an invite to create an account. Their
              game history (scores, wins, stats) will automatically transfer to
              their new profile.
            </p>
            <form onSubmit={handlePromote} className="space-y-4">
              <input
                type="email"
                placeholder="Enter their email address"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                required
                autoFocus
                className="w-full bg-gray-50 rounded-[14px] px-4 py-3.5 text-[17px] text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
              <button
                type="submit"
                disabled={!promoteEmail.trim() || promoteSending}
                className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {promoteSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Invite
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
