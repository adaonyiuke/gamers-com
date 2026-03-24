"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Copy, Check, Users, ChevronDown, ChevronUp, PartyPopper } from "lucide-react";
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

const RANDOM_BIOS = [
  "Board game enthusiast who never reads the rules 📖",
  "Strategist by day, sore loser by night 🎲",
  "Will trade sheep for literally anything 🐑",
  "Always picks the blue pieces 💙",
  "Professional dice blower, amateur winner 🎯",
  "Here for the snacks, staying for the games 🍕",
  "Monopoly banker with questionable ethics 🏦",
  "Card shuffling skills: chaotic at best 🃏",
  "I don't always win, but I always have fun… mostly 😅",
  "Bringing the competitive energy since day one 🔥",
  "Risk taker in games, plays it safe in life 🎰",
  "Longest road? More like longest losing streak 🛤️",
  "Rolling natural 20s in board games and in life ✨",
  "Warning: may flip the board if losing 🫣",
  "Pizza + board games = perfect night 🍕🎲",
  "Team player until there's only one winner 👀",
  "The friend who always forgets whose turn it is 🤔",
  "Secretly reads strategy guides before game night 🤫",
];

const STEP_LABELS: Record<number, string> = {
  1: "Profile Setup",
  2: "Your Group",
  3: "All Done",
};

export default function OnboardingPage() {
  const { user } = useUser();
  const { groupId, groups } = useGroupId();
  const router = useRouter();
  const supabase = createClient();

  // Step state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  // Step 1 state
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [bio, setBio] = useState("");

  // Step 2 state
  const [groupName, setGroupName] = useState("");
  const [showJoinFlow, setShowJoinFlow] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Step 3 state
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinedExistingGroup, setJoinedExistingGroup] = useState(false);

  // Shared state
  const [saving, setSaving] = useState(false);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";

  const initial = displayName.charAt(0).toUpperCase();

  // Pre-fill group name from the auto-created group
  useEffect(() => {
    if (groups.length > 0 && !groupName) {
      setGroupName(groups[0].group_name);
    }
  }, [groups]);

  const handleRandomBio = useCallback(() => {
    let next: string;
    do {
      next = RANDOM_BIOS[Math.floor(Math.random() * RANDOM_BIOS.length)];
    } while (next === bio && RANDOM_BIOS.length > 1);
    setBio(next);
  }, [bio]);

  // Step 1 → Step 2: save profile
  async function handleStep1Continue() {
    if (saving) return;
    setSaving(true);
    try {
      localStorage.setItem("avatar_color", selectedColor);
      if (groupId && user) {
        await supabase
          .from("group_members")
          .update({ bio: bio.trim() || null, avatar_url: selectedColor })
          .eq("group_id", groupId)
          .eq("user_id", user.id);
      }
      goToStep(2);
    } finally {
      setSaving(false);
    }
  }

  // Step 2 → Step 3: save group name, fetch invite code
  async function handleStep2Continue() {
    if (saving || !groupId) return;
    setSaving(true);
    try {
      const trimmed = groupName.trim();
      if (trimmed) {
        await supabase
          .from("groups")
          .update({ name: trimmed })
          .eq("id", groupId);
      }
      // Fetch invite code for step 3
      const { data } = await supabase
        .from("groups")
        .select("invite_code")
        .eq("id", groupId)
        .single();
      setInviteCode(data?.invite_code ?? null);
      goToStep(3);
    } finally {
      setSaving(false);
    }
  }

  // Join existing group with invite code
  async function handleJoinGroup() {
    if (joining || !inviteInput.trim() || !user) return;
    setJoinError(null);
    setJoining(true);
    try {
      // 1. Look up the group by invite code
      const { data, error } = await supabase.rpc("lookup_group_by_invite_code", {
        code: inviteInput.trim().toUpperCase(),
      });
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setJoinError("No group found with that code. Double-check and try again.");
        return;
      }
      const group = Array.isArray(data) ? data[0] : data;

      // 2. Add the user as a member of the joined group (if not already)
      const displayName =
        user.user_metadata?.display_name || user.email?.split("@")[0] || "Member";
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        await supabase.from("group_members").insert({
          group_id: group.id,
          user_id: user.id,
          role: "member",
          display_name: displayName,
        });
      }

      // 3. Fetch the full invite code from the groups table
      const { data: groupData } = await supabase
        .from("groups")
        .select("invite_code")
        .eq("id", group.id)
        .single();

      setGroupName(group.name);
      setInviteCode(groupData?.invite_code ?? null);
      setJoinedExistingGroup(true);
      goToStep(3);
    } catch {
      setJoinError("Something went wrong. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  // Step 3 → Dashboard: finish
  async function handleFinish() {
    // Persist to DB (user_metadata) so it works across devices + clears localStorage
    await supabase.auth.updateUser({ data: { onboarding_complete: true } });
    localStorage.setItem("onboarding_complete", "true");
    router.push("/dashboard");
  }

  async function handleCopyCode() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Glass header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F2F2F7]/80 border-b border-black/5">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#007AFF]">
            {STEP_LABELS[step]}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#8E8E93]">{step} / 3</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={
                    s === step
                      ? "w-5 h-1.5 rounded-full bg-[#007AFF] transition-all duration-300"
                      : s < step
                      ? "w-1.5 h-1.5 rounded-full bg-[#007AFF] transition-all duration-300"
                      : "w-1.5 h-1.5 rounded-full bg-[#C7C7CC] transition-all duration-300"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 pb-12 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 40 }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: d * -40 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: "easeOut" }}
        >

        {/* ── STEP 1: Profile Setup ── */}
        {step === 1 && (
          <>
            <div className="pt-10 pb-8">
              <h1 className="text-[34px] font-bold tracking-tight text-black leading-tight">
                Welcome, {displayName}!
              </h1>
              <p className="text-[17px] text-[#8E8E93] mt-2 leading-relaxed">
                Let&apos;s set up your profile so your group knows who you are.
              </p>
            </div>

            {/* Avatar card */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 mb-4">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-6">
                Your Avatar
              </p>
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
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio card */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                  About You
                  <span className="ml-2 text-[#C7C7CC] normal-case tracking-normal font-normal">
                    Optional
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleRandomBio}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  Surprise me
                </button>
              </div>
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

            <button
              onClick={handleStep1Continue}
              disabled={saving}
              className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Continue →"}
            </button>
            <p className="text-[13px] text-[#C7C7CC] text-center mt-4">
              You can change these later in Settings.
            </p>
          </>
        )}

        {/* ── STEP 2: Your Group ── */}
        {step === 2 && (
          <>
            <div className="pt-10 pb-8">
              <h1 className="text-[34px] font-bold tracking-tight text-black leading-tight">
                Name your group
              </h1>
              <p className="text-[17px] text-[#8E8E93] mt-2 leading-relaxed">
                This is how your crew will find you. You can always rename it later.
              </p>
            </div>

            {/* Group name card */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 mb-4">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-4">
                Group Name
              </p>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Friday Night Gamers"
                maxLength={50}
                className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] text-black placeholder:text-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-shadow"
              />
              <p className="text-[13px] text-[#C7C7CC] mt-2 text-right">
                {groupName.length}/50
              </p>
            </div>

            {/* Join existing group toggle */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden mb-8">
              <button
                type="button"
                onClick={() => { setShowJoinFlow(!showJoinFlow); setJoinError(null); }}
                className="w-full flex items-center justify-between px-6 py-4 text-left active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#007AFF]" />
                  <span className="text-[15px] font-medium text-gray-900">
                    Joining an existing group?
                  </span>
                </div>
                {showJoinFlow
                  ? <ChevronUp className="h-4 w-4 text-gray-400" />
                  : <ChevronDown className="h-4 w-4 text-gray-400" />
                }
              </button>

              {showJoinFlow && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <p className="text-[13px] text-[#8E8E93] mt-4 mb-3">
                    Enter the invite code from your group&apos;s admin.
                  </p>
                  <input
                    type="text"
                    value={inviteInput}
                    onChange={(e) => { setInviteInput(e.target.value.toUpperCase()); setJoinError(null); }}
                    placeholder="e.g. ABC123"
                    maxLength={10}
                    className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-3.5 text-[17px] text-black font-mono tracking-widest placeholder:text-[#C7C7CC] placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-shadow"
                  />
                  {joinError && (
                    <p className="text-[13px] text-red-500 mt-2">{joinError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleJoinGroup}
                    disabled={joining || !inviteInput.trim()}
                    className="w-full mt-3 bg-[#007AFF] text-white rounded-[14px] py-3.5 text-[15px] font-semibold transition-opacity disabled:opacity-40"
                  >
                    {joining ? "Looking up..." : "Join Group"}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleStep2Continue}
              disabled={saving || !groupName.trim()}
              className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Continue →"}
            </button>
          </>
        )}

        {/* ── STEP 3a: Joined existing group — Congrats ── */}
        {step === 3 && joinedExistingGroup && (
          <>
            <div className="pt-10 pb-8">
              <h1 className="text-[34px] font-bold tracking-tight text-black leading-tight">
                You&apos;re in! 🎉
              </h1>
              <p className="text-[17px] text-[#8E8E93] mt-2 leading-relaxed">
                You&apos;ve successfully joined <span className="font-semibold text-black">{groupName}</span>.
              </p>
            </div>

            {/* Confirmation card */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 mb-4">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                  <PartyPopper className="h-9 w-9 text-green-500" />
                </div>
              </div>
              <p className="text-[17px] font-semibold text-gray-900 text-center mb-2">
                Joined {groupName}
              </p>
              <p className="text-[15px] text-[#8E8E93] text-center leading-relaxed">
                Jump in and start tracking your games!
              </p>
            </div>

            {/* Tip card */}
            <div className="bg-[#F2F2F7] rounded-[20px] px-6 py-4 mb-8 flex items-start gap-3">
              <Users className="h-5 w-5 text-[#8E8E93] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#8E8E93] leading-relaxed">
                Want your own group too? You can create one anytime from <span className="font-semibold text-gray-700">Settings → Your Groups</span>.
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold transition-opacity hover:opacity-80 active:opacity-70"
            >
              Start Playing 🎲
            </button>
          </>
        )}

        {/* ── STEP 3b: Created own group — Invite Your Crew ── */}
        {step === 3 && !joinedExistingGroup && (
          <>
            <div className="pt-10 pb-8">
              <h1 className="text-[34px] font-bold tracking-tight text-black leading-tight">
                Bring your friends!
              </h1>
              <p className="text-[17px] text-[#8E8E93] mt-2 leading-relaxed">
                Share this code with your group so they can join <span className="font-semibold text-black">{groupName}</span>.
              </p>
            </div>

            {/* Invite code card */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-8 mb-4">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-[#8E8E93] mb-6">
                Invite Code
              </p>
              <div className="bg-[#F2F2F7] rounded-[16px] px-6 py-5 flex items-center justify-between mb-4">
                <span className="text-[32px] font-bold tracking-[0.15em] text-black font-mono">
                  {inviteCode ?? "------"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[#007AFF] active:opacity-60 transition-opacity ml-4"
                >
                  {copied
                    ? <><Check className="h-4 w-4" /> Copied!</>
                    : <><Copy className="h-4 w-4" /> Copy</>
                  }
                </button>
              </div>
              <p className="text-[13px] text-[#8E8E93] text-center leading-relaxed">
                Anyone with this code can join your group. You can find it anytime in Group Settings.
              </p>
            </div>

            {/* Share button */}
            {inviteCode && typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                onClick={() => navigator.share({ title: `Join ${groupName} on Game Night`, text: `Use code ${inviteCode} to join my group!` })}
                className="w-full bg-[#007AFF] text-white rounded-[14px] py-4 text-[17px] font-semibold transition-opacity hover:opacity-90 active:opacity-70 mb-4"
              >
                Share Invite
              </button>
            )}

            <button
              onClick={handleFinish}
              className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold transition-opacity hover:opacity-80 active:opacity-70"
            >
              Let&apos;s Go! 🎲
            </button>
            <p className="text-[13px] text-[#C7C7CC] text-center mt-4">
              You can invite more people later from Group Settings.
            </p>
          </>
        )}

        </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
