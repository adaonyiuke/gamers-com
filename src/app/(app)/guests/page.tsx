"use client";

import { useState, type FormEvent } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { useGuests, useCreateGuest } from "@/lib/queries/guests";
import { useGroupMembers } from "@/lib/queries/members";
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
  const { data: guests, isLoading: guestsLoading } = useGuests(groupId);
  const { data: members } = useGroupMembers(groupId);
  const createGuest = useCreateGuest();

  const [name, setName] = useState("");

  const currentMember = members?.find((m: any) => m.user_id === user?.id);

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

  const isLoading = groupLoading || guestsLoading;

  return (
    <div className="pb-28">
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
          Guests
        </h1>
      </div>

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
            All Guests
          </p>
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

                  return (
                    <div
                      key={guest.id}
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
                            {guest.name}
                          </p>
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
                        </div>
                        {inviterName && (
                          <p className="text-[13px] text-gray-500">
                            Invited by {inviterName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
