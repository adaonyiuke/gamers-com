"use client";

import { use, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useGames } from "@/lib/queries/games";
import { useMeetupParticipants } from "@/lib/queries/meetups";
import { useCreateSession, useFinalizeSession } from "@/lib/queries/sessions";
import { calculateWinner, ScoringType } from "@/lib/utils/scoring";
import { WinnerReveal } from "@/components/features/sessions/winner-reveal";
import { cn } from "@/lib/utils/cn";

const TILE_COLORS = [
  "#007AFF",
  "#FF9500",
  "#FF2D55",
  "#5856D6",
  "#34C759",
  "#AF52DE",
  "#FF3B30",
  "#00C7BE",
];

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-gray-200 animate-pulse rounded-[12px]", className)}
    />
  );
}

const getName = (p: any) =>
  p.group_members?.display_name ?? p.guests?.name ?? "Unknown";

export default function NewSessionPage({
  params,
}: {
  params: Promise<{ meetupId: string }>;
}) {
  const { meetupId } = use(params);
  const router = useRouter();
  const { groupId } = useGroupId();
  const { data: games, isLoading: gamesLoading } = useGames(groupId);
  const { data: participants, isLoading: participantsLoading } =
    useMeetupParticipants(meetupId);
  const createSession = useCreateSession();
  const finalizeSession = useFinalizeSession();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [manualWinnerId, setManualWinnerId] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const scoringType: ScoringType =
    selectedGame?.scoring_type ?? "highest_wins";
  const isManualWinner = scoringType === "manual_winner";

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setScores({});
    setManualWinnerId(null);
    setStep(2);
  };

  const handleScoreChange = (participantId: string, value: string) => {
    setScores((prev) => ({ ...prev, [participantId]: value }));
  };

  const handleFinalize = useCallback(async () => {
    if (!selectedGame || !participants || submitting) return;

    setSubmitting(true);

    try {
      // Create the session first
      const session = await createSession.mutateAsync({
        meetupId,
        gameId: selectedGame.id,
      });

      // Build score entries
      const scoreEntries = participants.map((p: any) => ({
        participantId: p.id,
        score: scores[p.id] ? Number(scores[p.id]) : null,
      }));

      // Calculate winner
      let winnerParticipantId: string | null = null;
      if (isManualWinner) {
        winnerParticipantId = manualWinnerId;
      } else {
        winnerParticipantId = calculateWinner(scoreEntries, scoringType);
      }

      // Finalize the session
      await finalizeSession.mutateAsync({
        sessionId: session.id,
        meetupId,
        scores: scoreEntries,
        winnerParticipantId,
      });

      // Find winner name for reveal
      if (winnerParticipantId) {
        const winnerP = participants.find(
          (p: any) => p.id === winnerParticipantId
        );
        if (winnerP) {
          setWinnerName(getName(winnerP));
        }
      }

      // If no winner (e.g., no scores), navigate back
      if (!winnerParticipantId) {
        router.push(`/meetups/${meetupId}`);
      }
    } catch {
      setSubmitting(false);
    }
  }, [
    selectedGame,
    participants,
    submitting,
    scores,
    isManualWinner,
    manualWinnerId,
    scoringType,
    meetupId,
    createSession,
    finalizeSession,
    router,
  ]);

  const canFinalize = useMemo(() => {
    if (!participants || participants.length === 0) return false;
    if (isManualWinner) return !!manualWinnerId;
    // At least one score entered
    return participants.some((p: any) => scores[p.id] && scores[p.id] !== "");
  }, [participants, scores, isManualWinner, manualWinnerId]);

  return (
    <div className="pb-28">
      {/* Winner Reveal Overlay */}
      {winnerName && (
        <WinnerReveal
          winnerName={winnerName}
          onDismiss={() => router.push(`/meetups/${meetupId}`)}
        />
      )}

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
          {step === 1 ? (
            <Link
              href={`/meetups/${meetupId}`}
              className="flex items-center text-[#007AFF] -ml-1.5"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="text-[17px]">Back</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setStep(1);
                setSelectedGame(null);
              }}
              className="flex items-center text-[#007AFF] -ml-1.5"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="text-[17px]">Games</span>
            </button>
          )}
        </div>
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          Record Game
        </h1>
        {step === 2 && selectedGame && (
          <p className="text-[15px] text-gray-500 mt-0.5">
            {selectedGame.name}
          </p>
        )}
      </div>

      <div className="px-5 mt-2">
        {/* Step 1: Game picker */}
        {step === 1 && (
          <div>
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Choose a Game
            </p>
            {gamesLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <SkeletonBlock className="h-12 w-12 rounded-[12px] mb-3" />
                    <SkeletonBlock className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : !games || games.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-20">
                <p className="text-[17px] font-semibold text-gray-400 mb-1">
                  No games added
                </p>
                <p className="text-[15px] text-gray-400 text-center">
                  Add games to your group first to record sessions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {games.map((game: any, idx: number) => {
                  const color = TILE_COLORS[idx % TILE_COLORS.length];
                  const abbrev = (game.name ?? "??")
                    .substring(0, 2)
                    .toUpperCase();
                  return (
                    <button
                      key={game.id}
                      onClick={() => handleSelectGame(game)}
                      className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-left active:scale-[0.97] transition-transform"
                    >
                      <div
                        className="h-12 w-12 rounded-[12px] flex items-center justify-center mb-3"
                        style={{ backgroundColor: color }}
                      >
                        <span className="text-white text-[17px] font-bold">
                          {abbrev}
                        </span>
                      </div>
                      <p className="text-[17px] font-semibold text-gray-900 truncate">
                        {game.name}
                      </p>
                      {game.scoring_type && (
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {game.scoring_type === "highest_wins"
                            ? "Highest wins"
                            : game.scoring_type === "lowest_wins"
                            ? "Lowest wins"
                            : "Manual winner"}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Score entry */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide px-1">
              {isManualWinner ? "Select Winner" : "Enter Scores"}
            </p>

            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              {participantsLoading ? (
                <div className="p-4 space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonBlock className="h-10 w-10 rounded-full" />
                      <SkeletonBlock className="h-4 w-24 flex-1" />
                      <SkeletonBlock className="h-10 w-20 rounded-[10px]" />
                    </div>
                  ))}
                </div>
              ) : !participants || participants.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[15px] text-gray-500">
                    No participants in this meetup.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {participants.map((p: any) => {
                    const name = getName(p);
                    const isGuest = !!p.guest_id;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-3.5"
                      >
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center text-white text-[15px] font-bold shrink-0",
                            isGuest ? "bg-orange-400" : "bg-[#007AFF]"
                          )}
                        >
                          {name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[17px] font-semibold text-gray-900 truncate">
                            {name}
                          </p>
                        </div>

                        {isManualWinner ? (
                          /* Radio button for manual winner */
                          <button
                            type="button"
                            onClick={() => setManualWinnerId(p.id)}
                            className={cn(
                              "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                              manualWinnerId === p.id
                                ? "bg-[#007AFF] border-[#007AFF]"
                                : "border-gray-300"
                            )}
                          >
                            {manualWinnerId === p.id && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        ) : (
                          /* Score input */
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="0"
                            value={scores[p.id] ?? ""}
                            onChange={(e) =>
                              handleScoreChange(p.id, e.target.value)
                            }
                            className="w-20 bg-gray-50 rounded-[10px] px-3 py-2.5 text-[17px] text-center font-semibold border border-gray-200 focus:border-[#007AFF] focus:outline-none shrink-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error */}
            {(createSession.isError || finalizeSession.isError) && (
              <div className="bg-red-50 rounded-[14px] px-4 py-3">
                <p className="text-red-600 text-[15px]">
                  Something went wrong. Please try again.
                </p>
              </div>
            )}

            {/* Finalize button */}
            <button
              onClick={handleFinalize}
              disabled={!canFinalize || submitting}
              className={cn(
                "w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
                (!canFinalize || submitting) && "opacity-50"
              )}
            >
              {submitting ? "Saving..." : "Finalize"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
