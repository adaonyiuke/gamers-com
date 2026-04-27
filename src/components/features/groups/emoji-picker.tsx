"use client";

import { cn } from "@/lib/utils/cn";

const EMOJIS = [
  "🎮", "🎲", "🃏", "🎯", "🏆", "♟️", "🎳", "🎰",
  "🔥", "⚡", "💫", "✨", "🌟", "💥", "🚀", "🌈",
  "🦁", "🐉", "🦊", "🐺", "🦅", "🦄", "🐻", "🐯",
  "🎉", "🎊", "🤝", "🌍", "🏠", "🌙", "☀️", "🍕",
  "⚔️", "🛡️", "💎", "👑", "🎸", "🌺", "🎭", "🎪",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={cn(
            "h-10 w-full flex items-center justify-center rounded-[10px] text-[22px] transition-colors",
            value === emoji
              ? "bg-[#007AFF]/15 ring-1 ring-[#007AFF]"
              : "bg-[#F2F2F7] active:bg-[#E5E5EA]"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
