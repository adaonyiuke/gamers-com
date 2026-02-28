"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Check,
  UserPlus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGroupId } from "@/components/providers/group-provider";
import { useCreateMeetup } from "@/lib/queries/meetups";
import { useGroupMembers } from "@/lib/queries/members";
import {
  useGuests,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
} from "@/lib/queries/guests";
import { getDefaultMeetupTitle } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof formSchema>;

function GuestRow({
  guest,
  selected,
  onToggle,
  onDeselect,
  onUpdated,
  onDeleted,
}: {
  guest: { id: string; name: string };
  selected: boolean;
  onToggle: () => void;
  onDeselect: () => void;
  onUpdated: () => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(guest.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateGuest = useUpdateGuest();
  const deleteGuest = useDeleteGuest();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === guest.name) {
      setEditValue(guest.name);
      setIsEditing(false);
      return;
    }
    try {
      await updateGuest.mutateAsync({ guestId: guest.id, name: trimmed });
      setIsEditing(false);
      onUpdated();
    } catch {
      // Error handled by mutation state
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGuest.mutateAsync({ guestId: guest.id });
      onDeleted(guest.id);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(guest.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={60}
          className="flex-1 text-[15px] bg-gray-50 rounded-[10px] px-3 py-2 border border-gray-200 focus:border-[#007AFF] focus:outline-none min-w-0"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={updateGuest.isPending}
          className="h-8 w-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white shrink-0 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setEditValue(guest.name);
            setIsEditing(false);
          }}
          className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 active:scale-95 transition-transform"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <p className="flex-1 text-[14px] text-gray-600">
          Remove <span className="font-semibold">{guest.name}</span>?
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteGuest.isPending}
          className="text-[14px] font-semibold text-red-500 px-3 py-1.5 rounded-[8px] bg-red-50 active:opacity-60 transition-opacity disabled:opacity-50"
        >
          {deleteGuest.isPending ? "..." : "Remove"}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(false)}
          className="text-[14px] font-medium text-gray-500 px-3 py-1.5 active:opacity-60 transition-opacity"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 flex-1 min-w-0 active:opacity-60 transition-opacity"
      >
        <div
          className={cn(
            "h-6 w-6 rounded-[7px] flex items-center justify-center border-2 transition-colors shrink-0",
            selected
              ? "bg-[#007AFF] border-[#007AFF]"
              : "border-gray-300"
          )}
        >
          {selected && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <span className="text-[13px] font-bold text-orange-500">
            {(guest.name ?? "?")[0].toUpperCase()}
          </span>
        </div>
        <span className="text-[17px] text-gray-900 truncate">
          {guest.name}
        </span>
      </button>
      <div
        className={cn(
          "flex items-center gap-1 shrink-0 transition-all duration-200",
          selected
            ? "opacity-0 pointer-events-none w-0 overflow-hidden"
            : "opacity-100"
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (selected) onDeselect();
            setEditValue(guest.name);
            setIsEditing(true);
          }}
          className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#007AFF] active:scale-95 transition-all"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 active:scale-95 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function NewMeetupPage() {
  const router = useRouter();
  const { groupId, loading: groupLoading } = useGroupId();
  const { data: members, isLoading: membersLoading } =
    useGroupMembers(groupId);
  const { data: guests, isLoading: guestsLoading } = useGuests(groupId);
  const createMeetup = useCreateMeetup();
  const createGuest = useCreateGuest();

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [newGuestName, setNewGuestName] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: getDefaultMeetupTitle(),
      date: today,
    },
  });

  const isLoading = groupLoading || membersLoading || guestsLoading;

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleGuest = (id: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddGuest = async () => {
    if (!groupId || !newGuestName.trim()) return;
    try {
      const result = await createGuest.mutateAsync({
        groupId: groupId,
        name: newGuestName.trim(),
      });
      setSelectedGuestIds((prev) => [...prev, result.id]);
      setNewGuestName("");
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleGuestDeleted = (guestId: string) => {
    setSelectedGuestIds((prev) => prev.filter((id) => id !== guestId));
  };

  const onSubmit = async (values: FormValues) => {
    if (!groupId) return;
    try {
      const meetup = await createMeetup.mutateAsync({
        groupId,
        title: values.title,
        date: values.date,
        participantMemberIds: selectedMemberIds,
        participantGuestIds: selectedGuestIds,
      });
      router.push(`/meetups/${meetup.id}`);
    } catch {
      // Error is handled by mutation state
    }
  };

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
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/meetups"
            className="flex items-center text-[#007AFF] -ml-1.5"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="text-[17px]">Back</span>
          </Link>
        </div>
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          New Meetup
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-5 mt-2 space-y-5">
        {/* Title */}
        <div>
          <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block px-1">
            Title
          </label>
          <input
            {...register("title")}
            className="w-full bg-white rounded-[14px] px-4 py-3.5 text-[17px] border border-gray-200 focus:border-[#007AFF] focus:outline-none"
            placeholder="Game Night"
          />
          {errors.title && (
            <p className="text-red-500 text-[13px] mt-1 px-1">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block px-1">
            Date
          </label>
          <input
            type="date"
            {...register("date")}
            className="w-full bg-white rounded-[14px] px-4 py-3.5 text-[17px] border border-gray-200 focus:border-[#007AFF] focus:outline-none"
          />
          {errors.date && (
            <p className="text-red-500 text-[13px] mt-1 px-1">
              {errors.date.message}
            </p>
          )}
        </div>

        {/* Members */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Select Members
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-5 w-5 rounded" />
                    <SkeletonBlock className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : !members || members.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[15px] text-gray-400">
                  No members in this group.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((member: Record<string, unknown>) => {
                  const selected = selectedMemberIds.includes(
                    member.id as string
                  );
                  return (
                    <button
                      type="button"
                      key={member.id as string}
                      onClick={() => toggleMember(member.id as string)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
                    >
                      <div
                        className={cn(
                          "h-6 w-6 rounded-[7px] flex items-center justify-center border-2 transition-colors",
                          selected
                            ? "bg-[#007AFF] border-[#007AFF]"
                            : "border-gray-300"
                        )}
                      >
                        {selected && (
                          <Check className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-[13px] font-bold text-gray-500">
                          {(
                            (member.display_name as string) ?? "?"
                          )[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[17px] text-gray-900">
                        {member.display_name as string}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Guests */}
        <div>
          <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Guests{guests && guests.length > 0 ? ` (${guests.length})` : ""}
          </p>
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-5 w-5 rounded" />
                    <SkeletonBlock className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : !guests || guests.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[15px] text-gray-400">
                  No guests available.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {guests.map((guest: Record<string, unknown>) => (
                  <GuestRow
                    key={guest.id as string}
                    guest={{
                      id: guest.id as string,
                      name: guest.name as string,
                    }}
                    selected={selectedGuestIds.includes(guest.id as string)}
                    onToggle={() => toggleGuest(guest.id as string)}
                    onDeselect={() =>
                      setSelectedGuestIds((prev) =>
                        prev.filter((id) => id !== (guest.id as string))
                      )
                    }
                    onUpdated={() => {
                      /* React Query auto-invalidates */
                    }}
                    onDeleted={handleGuestDeleted}
                  />
                ))}
              </div>
            )}

            {/* Add Guest inline input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
              <UserPlus className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddGuest();
                  }
                }}
                placeholder="New guest name"
                className="flex-1 bg-gray-50 rounded-[10px] px-3 py-2.5 text-[15px] focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
              />
              <button
                type="button"
                onClick={handleAddGuest}
                disabled={!newGuestName.trim() || createGuest.isPending}
                className={cn(
                  "bg-[#007AFF] text-white rounded-[10px] px-4 py-2.5 text-[15px] font-semibold flex-shrink-0",
                  (!newGuestName.trim() || createGuest.isPending) &&
                    "opacity-50"
                )}
              >
                {createGuest.isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {createMeetup.isError && (
          <div className="bg-red-50 rounded-[14px] px-4 py-3">
            <p className="text-red-600 text-[15px]">
              Failed to create meetup. Please try again.
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={createMeetup.isPending}
          className={cn(
            "w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
            createMeetup.isPending && "opacity-50"
          )}
        >
          {createMeetup.isPending ? "Creating..." : "Create Meetup"}
        </button>
      </form>
    </div>
  );
}
