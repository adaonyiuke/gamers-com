"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useUpdateMeetupTitle } from "@/lib/queries/meetups";
import { formatDateLong } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function StatusBadge({ status }: { status: string }) {
  const base =
    "text-[13px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full";
  if (status === "planned")
    return <span className={cn(base, "bg-blue-100 text-[#007AFF]")}>Planned</span>;
  if (status === "active")
    return <span className={cn(base, "bg-green-100 text-green-600")}>Active</span>;
  return <span className={cn(base, "bg-gray-100 text-gray-500")}>Complete</span>;
}

interface MeetupHeaderCardProps {
  meetupId: string;
  title: string;
  status: string;
  date: string;
  isAdmin: boolean;
}

export function MeetupHeaderCard({
  meetupId,
  title,
  status,
  date,
  isAdmin,
}: MeetupHeaderCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTitle = useUpdateMeetupTitle();

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync editValue when title changes externally
  useEffect(() => {
    if (!isEditing) setEditValue(title);
  }, [title, isEditing]);

  function handleStartEdit() {
    setEditValue(title);
    setIsEditing(true);
  }

  function handleCancel() {
    setEditValue(title);
    setIsEditing(false);
  }

  async function handleSave() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === title) {
      handleCancel();
      return;
    }
    try {
      await updateTitle.mutateAsync({ meetupId, title: trimmed });
      setIsEditing(false);
    } catch {
      // Error shown via mutation state — stay in edit mode
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={100}
                className="flex-1 text-[22px] font-bold text-gray-900 bg-gray-50 rounded-[10px] px-3 py-1.5 border border-gray-200 focus:border-[#007AFF] focus:outline-none min-w-0"
              />
              <button
                onClick={handleSave}
                disabled={updateTitle.isPending}
                className="h-9 w-9 rounded-full bg-[#007AFF] flex items-center justify-center text-white shrink-0 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                disabled={updateTitle.isPending}
                className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 active:scale-95 transition-transform disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <h2 className="text-[22px] font-bold text-gray-900 truncate">
              {title}
            </h2>
          )}
        </div>

        {/* Edit icon — admin only, hidden while editing */}
        {isAdmin && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#007AFF] active:scale-95 transition-all shrink-0 mt-0.5"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {updateTitle.isError && (
        <p className="text-[13px] text-red-500 mt-1 px-1">
          Failed to update title. You may not have permission.
        </p>
      )}

      {/* Status + Date */}
      <div className="flex items-center gap-3 mt-3">
        <StatusBadge status={status} />
        <p className="text-[15px] text-gray-500">
          {formatDateLong(date)}
        </p>
      </div>
    </div>
  );
}
