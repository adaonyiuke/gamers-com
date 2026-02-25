"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useGroupMembers } from "@/lib/queries/members";
import { useUser } from "@/components/providers/supabase-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type SeedStatus = "idle" | "running" | "done" | "error";

interface SeedStep {
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

export default function SeedPage() {
  const router = useRouter();
  const { groupId } = useGroupId();
  const { user } = useUser();
  const { data: members } = useGroupMembers(groupId);

  const [status, setStatus] = useState<SeedStatus>("idle");
  const [steps, setSteps] = useState<SeedStep[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentMember = members?.find((m: any) => m.user_id === user?.id);

  function updateStep(index: number, update: Partial<SeedStep>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...update } : s))
    );
  }

  async function runSeed() {
    if (!groupId || !currentMember || !user) {
      setErrorMsg("Not ready — make sure you're logged in and in a group.");
      return;
    }

    const supabase = createClient();
    const initialSteps: SeedStep[] = [
      { label: "Create games (Catan, Ticket to Ride, Codenames)", status: "pending" },
      { label: "Create guests (Alex Chen, Jordan Park)", status: "pending" },
      { label: "Create Game Night #1 (3 weeks ago)", status: "pending" },
      { label: "Create Game Night #2 (2 weeks ago)", status: "pending" },
      { label: "Create Game Night #3 (1 week ago)", status: "pending" },
    ];
    setSteps(initialSteps);
    setStatus("running");
    setErrorMsg(null);

    try {
      // ── Step 0: Games ──────────────────────────────────────────────────────
      updateStep(0, { status: "running" });

      const wantedGames = ["Catan", "Ticket to Ride", "Codenames"];
      const { data: existingGames } = await supabase
        .from("games")
        .select("id, name")
        .eq("group_id", groupId)
        .in("name", wantedGames);

      const missingGames = wantedGames.filter(
        (name) => !existingGames?.find((g: any) => g.name === name)
      );

      if (missingGames.length > 0) {
        const gameInserts = [
          { group_id: groupId, name: "Catan", scoring_type: "highest_wins", min_players: 3, max_players: 6 },
          { group_id: groupId, name: "Ticket to Ride", scoring_type: "highest_wins", min_players: 2, max_players: 5 },
          { group_id: groupId, name: "Codenames", scoring_type: "manual_winner", min_players: 2, max_players: 8 },
        ].filter((g) => missingGames.includes(g.name));

        const { error: gamesError } = await supabase.from("games").insert(gameInserts);
        if (gamesError) throw new Error(`Games: ${gamesError.message}`);
      }

      // Re-fetch to get all IDs
      const { data: allGames } = await supabase
        .from("games")
        .select("id, name")
        .eq("group_id", groupId)
        .in("name", wantedGames);

      const catanId = allGames?.find((g: any) => g.name === "Catan")?.id;
      const ttrId = allGames?.find((g: any) => g.name === "Ticket to Ride")?.id;
      const codenamesId = allGames?.find((g: any) => g.name === "Codenames")?.id;
      if (!catanId || !ttrId || !codenamesId) throw new Error("Failed to resolve game IDs");

      updateStep(0, {
        status: "done",
        detail: missingGames.length > 0 ? "Catan · Ticket to Ride · Codenames" : "Already existed — reused",
      });

      // ── Step 1: Guests ─────────────────────────────────────────────────────
      updateStep(1, { status: "running" });

      const guestInserts = [
        { group_id: groupId, name: "Alex Chen", invited_by: currentMember.id },
        { group_id: groupId, name: "Jordan Park", invited_by: currentMember.id },
      ];

      // Check if guests already exist
      const { data: existingGuests } = await supabase
        .from("guests")
        .select("id, name")
        .eq("group_id", groupId)
        .in("name", ["Alex Chen", "Jordan Park"]);

      let alexId: string;
      let jordanId: string;

      const alexExisting = existingGuests?.find((g: any) => g.name === "Alex Chen");
      const jordanExisting = existingGuests?.find((g: any) => g.name === "Jordan Park");

      if (alexExisting && jordanExisting) {
        alexId = alexExisting.id;
        jordanId = jordanExisting.id;
        updateStep(1, { status: "done", detail: "Already existed — reused" });
      } else {
        const toInsert = [];
        if (!alexExisting) toInsert.push(guestInserts[0]);
        if (!jordanExisting) toInsert.push(guestInserts[1]);

        const { data: newGuests, error: guestsError } = await supabase
          .from("guests")
          .insert(toInsert)
          .select();
        if (guestsError) throw new Error(`Guests: ${guestsError.message}`);

        alexId = alexExisting?.id ?? newGuests?.find((g: any) => g.name === "Alex Chen")?.id;
        jordanId = jordanExisting?.id ?? newGuests?.find((g: any) => g.name === "Jordan Park")?.id;
        if (!alexId || !jordanId) throw new Error("Failed to resolve guest IDs");

        updateStep(1, { status: "done", detail: "Alex Chen · Jordan Park" });
      }

      // ── Helper: create one meetup with participants + sessions + scores ────
      async function createMeetup(
        title: string,
        dateOffset: number, // days ago
        sessions: Array<{
          gameId: string;
          scores: Array<{ who: "me" | "alex" | "jordan"; score: number | null; winner: boolean }>;
        }>,
        stepIndex: number
      ) {
        updateStep(stepIndex, { status: "running" });

        const date = new Date();
        date.setDate(date.getDate() - dateOffset);
        const dateStr = date.toISOString().split("T")[0];

        // Create meetup
        const { data: meetup, error: meetupError } = await supabase
          .from("meetups")
          .insert({
            group_id: groupId!,
            title,
            date: dateStr,
            status: "complete",
          })
          .select()
          .single();
        if (meetupError) throw new Error(`Meetup "${title}": ${meetupError.message}`);

        // Create participants
        const { data: participants, error: partError } = await supabase
          .from("meetup_participants")
          .insert([
            { meetup_id: meetup.id, member_id: currentMember!.id },
            { meetup_id: meetup.id, guest_id: alexId },
            { meetup_id: meetup.id, guest_id: jordanId },
          ])
          .select();
        if (partError) throw new Error(`Participants for "${title}": ${partError.message}`);

        const meParticipant = participants.find((p: any) => p.member_id === currentMember!.id);
        const alexParticipant = participants.find((p: any) => p.guest_id === alexId);
        const jordanParticipant = participants.find((p: any) => p.guest_id === jordanId);

        // Create sessions + scores
        for (let si = 0; si < sessions.length; si++) {
          const session = sessions[si];
          const playedAt = new Date(date);
          playedAt.setHours(19 + si, 0, 0, 0);

          // Find winner participant_id
          const winnerScore = session.scores.find((s) => s.winner);
          let winnerParticipantId: string | undefined;
          if (winnerScore?.who === "me") winnerParticipantId = meParticipant?.id;
          else if (winnerScore?.who === "alex") winnerParticipantId = alexParticipant?.id;
          else if (winnerScore?.who === "jordan") winnerParticipantId = jordanParticipant?.id;

          const { data: sess, error: sessError } = await supabase
            .from("sessions")
            .insert({
              meetup_id: meetup.id,
              game_id: session.gameId,
              played_at: playedAt.toISOString(),
              status: "finalized",
              winner_participant_id: winnerParticipantId ?? null,
            })
            .select()
            .single();
          if (sessError) throw new Error(`Session for "${title}": ${sessError.message}`);

          // Score entries
          const scoreEntries = session.scores.map((s) => {
            let participantId: string;
            if (s.who === "me") participantId = meParticipant!.id;
            else if (s.who === "alex") participantId = alexParticipant!.id;
            else participantId = jordanParticipant!.id;
            return {
              session_id: sess.id,
              participant_id: participantId,
              score: s.score,
              is_winner: s.winner,
            };
          });

          const { error: scoresError } = await supabase
            .from("score_entries")
            .insert(scoreEntries);
          if (scoresError) throw new Error(`Scores for "${title}": ${scoresError.message}`);
        }

        updateStep(stepIndex, {
          status: "done",
          detail: `${dateStr} · ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`,
        });
      }

      // ── Step 2: Game Night #1 — 21 days ago ───────────────────────────────
      await createMeetup(
        "Game Night #1",
        21,
        [
          {
            gameId: catanId,
            scores: [
              { who: "me", score: 10, winner: true },
              { who: "alex", score: 8, winner: false },
              { who: "jordan", score: 6, winner: false },
            ],
          },
          {
            gameId: ttrId,
            scores: [
              { who: "alex", score: 120, winner: true },
              { who: "me", score: 98, winner: false },
              { who: "jordan", score: 85, winner: false },
            ],
          },
        ],
        2
      );

      // ── Step 3: Game Night #2 — 14 days ago ───────────────────────────────
      await createMeetup(
        "Game Night #2",
        14,
        [
          {
            gameId: codenamesId,
            scores: [
              { who: "jordan", score: null, winner: true },
              { who: "me", score: null, winner: false },
              { who: "alex", score: null, winner: false },
            ],
          },
          {
            gameId: catanId,
            scores: [
              { who: "me", score: 11, winner: true },
              { who: "jordan", score: 9, winner: false },
              { who: "alex", score: 7, winner: false },
            ],
          },
        ],
        3
      );

      // ── Step 4: Game Night #3 — 7 days ago ────────────────────────────────
      await createMeetup(
        "Game Night #3",
        7,
        [
          {
            gameId: ttrId,
            scores: [
              { who: "me", score: 130, winner: true },
              { who: "alex", score: 115, winner: false },
              { who: "jordan", score: 95, winner: false },
            ],
          },
          {
            gameId: codenamesId,
            scores: [
              { who: "alex", score: null, winner: true },
              { who: "me", score: null, winner: false },
              { who: "jordan", score: null, winner: false },
            ],
          },
        ],
        4
      );

      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Unknown error");
      // Mark last running step as error
      setSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "error" } : s))
      );
    }
  }

  return (
    <div className="pb-36">
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3 flex items-center gap-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center text-[#007AFF] -ml-1 active:opacity-60 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px]">Back</span>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900 flex-1 text-center mr-14">
          Seed Demo Data
        </h1>
      </div>

      <div className="px-5 mt-4 space-y-5">
        {/* Info card */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-[12px] bg-indigo-100 flex items-center justify-center shrink-0">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[17px] font-semibold text-gray-900">Demo data</p>
              <p className="text-[13px] text-gray-500">Populate your group with realistic history</p>
            </div>
          </div>

          <div className="space-y-2 text-[15px] text-gray-700">
            <p className="font-semibold text-[13px] text-gray-500 uppercase tracking-wide mb-1">
              What gets created
            </p>
            {[
              "🎲  3 games — Catan, Ticket to Ride, Codenames",
              "👤  2 guests — Alex Chen, Jordan Park",
              "📅  Game Night #1 · 3 weeks ago",
              "📅  Game Night #2 · 2 weeks ago",
              "📅  Game Night #3 · 1 week ago",
              "🏆  6 sessions with scores & winners",
            ].map((line) => (
              <p key={line} className="text-[15px] text-gray-600">
                {line}
              </p>
            ))}
          </div>

          {!currentMember && (
            <div className="mt-4 bg-yellow-50 rounded-[12px] px-4 py-3">
              <p className="text-[13px] text-yellow-700">
                Loading your profile… please wait a moment.
              </p>
            </div>
          )}
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {step.status === "pending" && (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  {step.status === "running" && (
                    <Loader2 className="h-5 w-5 text-[#007AFF] animate-spin" />
                  )}
                  {step.status === "done" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {step.status === "error" && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[15px] font-medium",
                      step.status === "pending" && "text-gray-400",
                      step.status === "running" && "text-gray-900",
                      step.status === "done" && "text-gray-900",
                      step.status === "error" && "text-red-600"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.detail && (
                    <p className="text-[13px] text-gray-400 mt-0.5">{step.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="bg-red-50 rounded-[14px] px-4 py-3">
            <p className="text-[15px] text-red-600">{errorMsg}</p>
          </div>
        )}

        {/* Success */}
        {status === "done" && (
          <div className="bg-green-50 rounded-[14px] px-4 py-3">
            <p className="text-[15px] text-green-700 font-medium">
              ✅ Demo data seeded! Head to the dashboard to see your stats.
            </p>
          </div>
        )}

        {/* CTA */}
        {status === "idle" || status === "error" ? (
          <button
            onClick={runSeed}
            disabled={!currentMember || !groupId}
            className="w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            {status === "error" ? "Retry Seed" : "Seed Demo Data"}
          </button>
        ) : status === "running" ? (
          <div className="w-full bg-gray-200 rounded-[14px] py-4 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
            <span className="text-[17px] font-semibold text-gray-600">Seeding…</span>
          </div>
        ) : (
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-[#007AFF] text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
