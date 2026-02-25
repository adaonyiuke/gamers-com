"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/supabase-provider";
import { useGroupId } from "@/components/providers/group-provider";
import { createClient } from "@/lib/supabase/client";

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

export default function OnboardingPage() {
  const { user } = useUser();
  const { groupId } = useGroupId();
  const router = useRouter();
  const supabase = createClient();

  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";

  const initial = displayName.charAt(0).toUpperCase();

  async function handleFinish() {
    if (saving) return;
    setSaving(true);

    try {
      // Save avatar color to localStorage for quick access
      localStorage.setItem("avatar_color", selectedColor);

      // Update bio and avatar color on the group_members record
      if (groupId && user) {
        await supabase
          .from("group_members")
          .update({
            bio: bio.trim() || null,
            avatar_url: selectedColor,
          })
          .eq("group_id", groupId)
          .eq("user_id", user.id);
      }

      // Mark onboarding as complete
      localStorage.setItem("onboarding_complete", "true");

      router.push("/dashboard");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Glass header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F2F2F7]/80 border-b border-black/5">
        <div className="max-w-lg mx-auto px-6 py-4">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#007AFF]">
            Profile Setup
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 pb-12">
        {/* Welcome section */}
        <div className="pt-10 pb-8">
          <h1 className="text-[34px] font-bold tracking-tight text-black leading-tight">
            Welcome, {displayName}!
          </h1>
          <p className="text-[17px] text-[#8E8E93] mt-2 leading-relaxed">
            Let&apos;s set up your profile so your group knows who you are.
          </p>
        </div>

        {/* Avatar preview card */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 mb-4">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-6">
            Your Avatar
          </p>

          {/* Large initial circle */}
          <div className="flex justify-center mb-8">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="text-white text-[48px] font-bold leading-none">
                {initial}
              </span>
            </div>
          </div>

          {/* Color palette */}
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-4">
            Pick a Color
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="relative w-11 h-11 rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none"
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              >
                {selectedColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bio card */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 mb-8">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-4">
            About You
            <span className="ml-2 text-[#C7C7CC] normal-case tracking-normal font-normal">
              Optional
            </span>
          </p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Board game enthusiast, pizza lover, always picks blue..."
            rows={3}
            maxLength={200}
            className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] text-black placeholder:text-[#C7C7CC] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-shadow"
          />
          <p className="text-[13px] text-[#C7C7CC] mt-2 text-right">
            {bio.length}/200
          </p>
        </div>

        {/* CTA button */}
        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-50"
        >
          {saving ? "Setting up..." : "Let\u2019s Go!"}
        </button>

        <p className="text-[13px] text-[#C7C7CC] text-center mt-4">
          You can change these later in Settings.
        </p>
      </main>
    </div>
  );
}
