"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Mail, ArrowRight, Gamepad2, Users, Trophy, User, Wrench, Rocket, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const categories = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Set up your account, create a group, and play your first game.",
    color: "bg-violet-100 text-violet-600",
    id: "getting-started",
  },
  {
    icon: Users,
    title: "Groups & Members",
    description: "Invite friends, manage roles, and organize your crew.",
    color: "bg-blue-100 text-blue-600",
    id: "groups",
  },
  {
    icon: Gamepad2,
    title: "Sessions & Games",
    description: "Record sessions, track scores, and build your game library.",
    color: "bg-green-100 text-green-600",
    id: "sessions",
  },
  {
    icon: Trophy,
    title: "Stats & Leaderboard",
    description: "Understand win rates, streaks, badges, and rivalries.",
    color: "bg-amber-100 text-amber-600",
    id: "stats",
  },
  {
    icon: User,
    title: "Account & Profile",
    description: "Update your name, avatar, email, and password.",
    color: "bg-pink-100 text-pink-600",
    id: "account",
  },
  {
    icon: Wrench,
    title: "Troubleshooting",
    description: "Fix common issues and get back to playing.",
    color: "bg-slate-100 text-slate-600",
    id: "troubleshooting",
  },
];

const faqs: { category: string; question: string; answer: string }[] = [
  // Getting Started
  {
    category: "getting-started",
    question: "What is Game Night?",
    answer:
      "Game Night is a companion app for your board game group. It lets you track meetups, record game results, see who's on a winning streak, and build a living leaderboard — so every game night has a little more on the line.",
  },
  {
    category: "getting-started",
    question: "How do I create an account?",
    answer:
      "Visit gamenight.clubplay.io and tap Get Started. Enter your email, choose a display name and avatar color, then verify your email. Once confirmed you'll land on the onboarding flow where you can create or join a group.",
  },
  {
    category: "getting-started",
    question: "How do I create a group?",
    answer:
      "During onboarding, tap Create a group and give it a name. You'll become the group owner automatically. You can invite others immediately from the Members settings page, or share your invite link later.",
  },
  {
    category: "getting-started",
    question: "How do I join an existing group?",
    answer:
      "You need an invite link from your group owner. Opening the link will walk you through signup (or login if you already have an account) and drop you straight into the group.",
  },
  {
    category: "getting-started",
    question: "Is Game Night free?",
    answer:
      "Yes — Game Night is free to use. All core features including meetups, session tracking, stats, and leaderboards are included at no cost.",
  },
  {
    category: "getting-started",
    question: "Can I use Game Night on my phone?",
    answer:
      "Game Night is a progressive web app (PWA). Open it in Safari on iOS or Chrome on Android and tap Add to Home Screen for a native app experience — no App Store required.",
  },

  // Groups & Members
  {
    category: "groups",
    question: "How do I invite someone to my group?",
    answer:
      "Go to Settings → Group → Members and tap Invite. You can copy an invite link and share it directly, or send it via message. Anyone who opens the link and signs up will be added to your group.",
  },
  {
    category: "groups",
    question: "What's the difference between a Member and a Guest?",
    answer:
      "Members have full accounts — they can log in, see their own stats, and manage their profile. Guests are lightweight participants added by a group admin for people who want to play without creating an account. Guest stats are tracked, but guests can't log in themselves.",
  },
  {
    category: "groups",
    question: "How do I promote a Guest to a full Member?",
    answer:
      "Go to the Guests page, find the guest, and tap Promote to Member. You'll enter their email address and they'll receive an invitation to create an account. Their historical stats carry over automatically.",
  },
  {
    category: "groups",
    question: "Can I be in multiple groups?",
    answer:
      "Yes. You can belong to multiple groups and switch between them using the group selector at the top of the Dashboard. Each group has its own leaderboard, meetups, and game library.",
  },
  {
    category: "groups",
    question: "What can a group owner do that regular members can't?",
    answer:
      "Owners can invite and remove members, edit group settings, manage the game library, promote guests to members, and configure what stats are shown on the Dashboard. Regular members can record sessions and view all stats, but can't change group-level settings.",
  },
  {
    category: "groups",
    question: "How do I remove someone from my group?",
    answer:
      "Go to Settings → Group → Members, find the member, and tap the options menu next to their name. Select Remove from Group. Their historical stats remain in the record but they'll no longer appear as an active member.",
  },
  {
    category: "groups",
    question: "How do I leave a group?",
    answer:
      "Go to your Profile page and scroll to the bottom. Tap Leave Group. If you're the only owner, you'll need to transfer ownership to another member first before you can leave.",
  },

  // Sessions & Games
  {
    category: "sessions",
    question: "What is a meetup?",
    answer:
      "A meetup is a game night event — a container for all the sessions played on a given evening. Create a meetup with a title and date, then add sessions underneath it as you play each game.",
  },
  {
    category: "sessions",
    question: "How do I record a game session?",
    answer:
      "Open an active meetup, tap Add Session, select the game, add the participants, and mark the winner. You can record as many sessions as you played that night. Sessions can be added at the time or filled in retroactively.",
  },
  {
    category: "sessions",
    question: "How do I add games to my group's library?",
    answer:
      "Go to Settings → Games and tap Add Game. You can search the BoardGameGeek catalog to find your game with art and metadata automatically filled in, or add it manually with a custom name.",
  },
  {
    category: "sessions",
    question: "Can I record multiple games in one meetup?",
    answer:
      "Yes — that's the whole point. A meetup can hold any number of sessions, one per game played. Each session tracks its own participants and winner independently.",
  },
  {
    category: "sessions",
    question: "Can I include guests in a session?",
    answer:
      "Yes. When adding participants to a session, you can select both members and guests from your group. Guest stats contribute to the leaderboard just like member stats.",
  },
  {
    category: "sessions",
    question: "Can I edit or delete a session after saving it?",
    answer:
      "Yes. Open the meetup, tap on the session, and you'll find options to edit participants, change the winner, or delete the session. Changes update everyone's stats immediately.",
  },
  {
    category: "sessions",
    question: "How does the BoardGameGeek (BGG) catalog work?",
    answer:
      "When adding a game, we search the BGG database and pull in the official name, cover art, and metadata. This keeps your game library clean and consistent. If your game isn't in BGG, you can always add it manually.",
  },

  // Stats & Leaderboard
  {
    category: "stats",
    question: "How is win rate calculated?",
    answer:
      "Win rate is your total wins divided by total sessions played, expressed as a percentage. A session counts as a play regardless of how many other people were at the table. Only games where you are listed as a participant count toward your stats.",
  },
  {
    category: "stats",
    question: "What is a Hot Streak?",
    answer:
      "Your Hot Streak is the number of consecutive sessions you've won most recently. It resets to zero any time you play a session and don't win. The streak badge activates when you reach 3 wins in a row.",
  },
  {
    category: "stats",
    question: "How are badges earned?",
    answer:
      "Badges are awarded automatically based on your activity:\n\n• Champion — #1 win rate in your group (minimum 5 sessions)\n• On Fire — 3 or more wins in a row\n• Strategist — wins across 3 or more different games\n• Wildcard — won a game on your very first play\n• Regular — attended 5 or more meetups\n• Veteran — played in 15 or more total sessions",
  },
  {
    category: "stats",
    question: "What does the Top Rivalry card show?",
    answer:
      "The rivalry card highlights the pair of players who have faced each other the most across all sessions, showing the head-to-head record between them. It's a quick snapshot of the most active matchup in your group.",
  },
  {
    category: "stats",
    question: "How often do stats update?",
    answer:
      "Stats update in real time. As soon as a session is recorded or edited, all leaderboards, win rates, streaks, and badges recalculate immediately.",
  },
  {
    category: "stats",
    question: "What are Fun Facts?",
    answer:
      "Fun Facts are automatically generated highlights that surface interesting patterns in your group's data — like who has the longest losing streak, which player has won the most games in a single night, or who got lucky and won a game on their first ever play.",
  },
  {
    category: "stats",
    question: "What does the Most Improved card show?",
    answer:
      "Most Improved compares a player's recent win rate (last 10 sessions) against their all-time win rate and highlights the person who has improved the most. It refreshes automatically as new sessions are recorded.",
  },

  // Account & Profile
  {
    category: "account",
    question: "How do I change my display name?",
    answer:
      "Go to your Profile tab and tap the edit button in the hero section. Update your display name and tap Save. The change will reflect immediately across the leaderboard and all sessions.",
  },
  {
    category: "account",
    question: "How do I change my avatar color?",
    answer:
      "Your avatar color is set during onboarding. To change it, go to Profile → Edit and select a new color from the palette. Your avatar updates everywhere in the app instantly.",
  },
  {
    category: "account",
    question: "How do I change my email address?",
    answer:
      "Go to Settings → Account and tap Change Email. Enter your new address and confirm it. You'll receive a verification link at the new email — click it to complete the change.",
  },
  {
    category: "account",
    question: "How do I reset my password?",
    answer:
      "On the login screen, tap Forgot password and enter your email. You'll receive a reset link within a few minutes. Check your spam folder if it doesn't arrive. The link expires after 1 hour.",
  },
  {
    category: "account",
    question: "How do I delete my account?",
    answer:
      "Go to Settings → Account and scroll to the bottom. Tap Delete Account and confirm. This permanently removes your account and all personal data. Your historical session records remain in the group's history but will be anonymised.",
  },
  {
    category: "account",
    question: "I didn't receive my confirmation email. What should I do?",
    answer:
      "Check your spam or junk folder first. If it's not there, go back to the signup page and request a new confirmation email. Make sure you entered the right address. If the problem persists, email us at hello@clubplay.io.",
  },

  // Troubleshooting
  {
    category: "troubleshooting",
    question: "My stats look wrong. What should I do?",
    answer:
      "Stats recalculate from session records, so the most common cause is a session recorded with the wrong winner or missing participants. Check your recent sessions under the meetup they belong to and make any corrections — stats will update immediately.",
  },
  {
    category: "troubleshooting",
    question: "I can't see a recent session I just recorded.",
    answer:
      "Pull to refresh the page or navigate away and back. If the session still doesn't appear, check whether it was saved to a different meetup. Sessions are only visible within their parent meetup.",
  },
  {
    category: "troubleshooting",
    question: "The app is running slowly or not loading.",
    answer:
      "Try a hard refresh (hold the reload button in your browser). If you've added Game Night to your home screen, remove it and re-add it from the browser to get a fresh install. Clearing your browser cache can also help.",
  },
  {
    category: "troubleshooting",
    question: "I'm getting logged out unexpectedly.",
    answer:
      "Sessions expire for security after a period of inactivity. Logging back in will restore your session. If this is happening frequently, make sure you're not browsing in Private/Incognito mode, which prevents the session from being stored.",
  },
  {
    category: "troubleshooting",
    question: "A game I added isn't showing up in sessions.",
    answer:
      "Games need to be added to your group's library before they appear in session creation. Go to Settings → Games and confirm the game is listed. If it's missing, add it and it will be immediately available.",
  },
  {
    category: "troubleshooting",
    question: "How do I report a bug?",
    answer:
      "Email hello@clubplay.io with a description of what happened, what you expected to happen, and your device and browser. Screenshots help a lot. We aim to respond within one business day.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-gray-900 leading-snug">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 shrink-0 mt-0.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="pb-4">
          <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? faqs.filter((f) => f.category === activeCategory)
    : faqs;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F2F7" }}>
      {/* Top nav */}
      <header
        className="sticky top-0 z-40 px-5 py-3 flex items-center justify-between"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 active:opacity-60 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/welcome/clubplay-icon.svg" alt="Club Play" style={{ height: 20, width: "auto" }} />
          <div className="h-4 w-px bg-black/15" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/game-night-wordmark.svg" alt="Game Night" style={{ height: 20, width: "auto" }} />
        </Link>
        <a
          href="mailto:hello@clubplay.io"
          className="px-4 h-9 flex items-center rounded-[14px] text-[13px] font-semibold bg-[#161719] text-white active:opacity-80 transition-opacity"
        >
          Contact Us
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3 pt-2">
          <Image
            src="/app-icon.png"
            alt="Game Night"
            width={72}
            height={72}
            className="mx-auto mb-2 rounded-[16px]"
          />
          <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
            How can we help?
          </h1>
          <p className="text-[16px] text-gray-500 max-w-sm mx-auto leading-relaxed">
            Find answers to common questions, or reach out and we'll get back to you quickly.
          </p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(active ? null : cat.id)}
                className={cn(
                  "text-left p-4 rounded-[16px] transition-all active:scale-[0.98]",
                  active
                    ? "bg-[#161719] text-white"
                    : "bg-white text-gray-900"
                )}
                style={{
                  boxShadow: active
                    ? "0 4px 12px rgba(0,0,0,0.15)"
                    : "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className={cn(
                    "inline-flex items-center justify-center h-9 w-9 rounded-[10px] mb-3",
                    active ? "bg-white/15" : cat.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className={cn("text-[14px] font-semibold leading-snug", active ? "text-white" : "text-gray-900")}>
                  {cat.title}
                </p>
                <p className={cn("text-[12px] mt-0.5 leading-snug", active ? "text-white/70" : "text-gray-400")}>
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* FAQ section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-bold text-gray-900">
              {activeCategory
                ? categories.find((c) => c.id === activeCategory)?.title
                : "All Questions"}
            </h2>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-[13px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
              >
                Show all
              </button>
            )}
          </div>

          <div
            className="bg-white rounded-[16px] px-5 divide-y divide-gray-100"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
          >
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-gray-400">No questions in this category yet.</p>
            ) : (
              filtered.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))
            )}
          </div>
        </div>

        {/* Contact block */}
        <div
          className="rounded-[20px] p-6 flex flex-col gap-4"
          style={{
            background: "linear-gradient(135deg, rgb(22,7,40) 0%, rgb(132,42,235) 100%)",
            boxShadow: "0 4px 16px rgba(132,42,235,0.25)",
          }}
        >
          <div
            className="h-11 w-11 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[20px] font-bold text-white">Still need help?</h3>
            <p className="text-[14px] text-white/60 leading-relaxed">
              Can't find what you're looking for? We typically respond<br />within one business day.
            </p>
          </div>
          <a
            href="mailto:hello@clubplay.io"
            className="w-full flex items-center justify-between px-4 h-12 rounded-[14px] text-[15px] font-semibold text-white active:opacity-80 transition-opacity"
            style={{ backgroundColor: "#161719" }}
          >
            <span>hello@clubplay.io</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-gray-400 pb-6">
          © {new Date().getFullYear()} Club Play · Game Night
        </p>
      </main>
    </div>
  );
}
