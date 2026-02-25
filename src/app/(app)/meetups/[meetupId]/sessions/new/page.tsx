"use client";

import { use, useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Check, Plus, X, Crown } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useGames } from "@/lib/queries/games";
import { useMeetupParticipants } from "@/lib/queries/meetups";
import { useCreateSession, useFinalizeSession } from "@/lib/queries/sessions";
import { calculateWinner, sumRoundScores, ScoringType } from "@/lib/utils/scoring";
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

  const searchParams = useSearchParams();
  const preselectedGameId = searchParams.get("gameId");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    Set<string>
  >(new Set());
  const [manualWinnerId, setManualWinnerId] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Rounds state
  const [rounds, setRounds] = useState<Record<string, string>[]>([{}]);
  const [currentRound, setCurrentRound] = useState(0);

  const scoringType: ScoringType =
    selectedGame?.scoring_type ?? "highest_wins";
  const isManualWinner = scoringType === "manual_winner";

  const selectedParticipants = useMemo(() => {
    if (!participants) return [];
    return participants.filter((p: any) => selectedParticipantIds.has(p.id));
  }, [participants, selectedParticipantIds]);

  const selectedIds = useMemo(
    () => Array.from(selectedParticipantIds),
    [selectedParticipantIds]
  );

  // Totals for rounds mode
  const totals = useMemo(() => {
    if (rounds.length <= 1) return null;
    return sumRoundScores(rounds, selectedIds);
  }, [rounds, selectedIds]);

  // Leader (highest total so far)
  const leaderId = useMemo(() => {
    if (!totals) return null;
    let maxScore = -Infinity;
    let leader: string | null = null;
    for (const [id, score] of Object.entries(totals)) {
      if (score > maxScore) {
        maxScore = score;
        leader = id;
      }
    }
    return maxScore > 0 ? leader : null;
  }, [totals]);

  // Auto-select game from query param (Play Again flow)
  useEffect(() => {
    if (preselectedGameId && games && participants && step === 1) {
      const game = games.find((g: any) => g.id === preselectedGameId);
      if (game) {
        setSelectedGame(game);
        setSelectedParticipantIds(new Set(participants.map((p: any) => p.id)));
        setStep(2);
      }
    }
  }, [preselectedGameId, games, participants, step]);

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setManualWinnerId(null);
    setRounds([{}]);
    setCurrentRound(0);
    // Default: select all participants
    if (participants) {
      setSelectedParticipantIds(new Set(participants.map((p: any) => p.id)));
    }
    setStep(2);
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleScoreChange = (participantId: string, value: string) => {
    setRounds((prev) => {
      const updated = [...prev];
      updated[currentRound] = {
        ...updated[currentRound],
        [participantId]: value,
      };
      return updated;
    });
  };

  const handleAddRound = () => {
    setRounds((prev) => [...prev, {}]);
    setCurrentRound(rounds.length);
  };

  const handleRemoveRound = (idx: number) => {
    if (rounds.length <= 1) return;
    setRounds((prev) => prev.filter((_, i) => i !== idx));
    setCurrentRound((prev) => Math.min(prev, rounds.length - 2));
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

      // Calculate final scores — sum rounds if multiple, otherwise use single round
      let scoreEntries;
      if (rounds.length > 1 && !isManualWinner) {
        const roundTotals = sumRoundScores(rounds, selectedIds);
        scoreEntries = selectedIds.map((id) => ({
          participantId: id,
          score: roundTotals[id] ?? 0,
        }));
      } else {
        scoreEntries = selectedIds.map((id) => ({
          participantId: id,
          score: rounds[0][id] ? Number(rounds[0][id]) : null,
        }));
      }

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
    rounds,
    isManualWinner,
    manualWinnerId,
    scoringType,
    meetupId,
    selectedIds,
    createSession,
    finalizeSession,
    router,
  ]);

  const canFinalize = useMemo(() => {
    if (selectedIds.length === 0) return false;
    if (isManualWinner) return !!manualWinnerId;
    // At least one score entered in any round
    return rounds.some((round) =>
      selectedIds.some((id) => round[id] && round[id] !== "")
    );
  }, [selectedIds, rounds, isManualWinner, manualWinnerId]);

  const stepTitle = step === 1 ? "Choose a Game" : step === 2 ? "Select Players" : isManualWinner ? "Select Winner" : "Enter Scores";

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
                if (step === 3) {
                  setStep(2);
                } else {
                  setStep(1);
                  setSelectedGame(null);
                }
              }}
              className="flex items-center text-[#007AFF] -ml-1.5"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="text-[17px]">
                {step === 3 ? "Players" : "Games"}
              </span>
            </button>
          )}
        </div>
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
          Record Game
        </h1>
        {selectedGame && (
          <p className="text-[15px] text-gray-500 mt-0.5">
            {selectedGame.name}
            {step === 3 && ` \u2022 ${selectedParticipants.length} players`}
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

        {/* Step 2: Participant selection */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide px-1">
              Who&apos;s Playing?
            </p>

            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              {participantsLoading ? (
                <div className="p-4 space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonBlock className="h-10 w-10 rounded-full" />
                      <SkeletonBlock className="h-4 w-24 flex-1" />
                      <SkeletonBlock className="h-7 w-7 rounded-full" />
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
                    const isSelected = selectedParticipantIds.has(p.id);

                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleParticipant(p.id)}
                        className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:bg-gray-50 transition-colors"
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
                          {isGuest && (
                            <p className="text-[13px] text-gray-400">Guest</p>
                          )}
                        </div>
                        <div
                          className={cn(
                            "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                            isSelected
                              ? "bg-[#007AFF] border-[#007AFF]"
                              : "border-gray-300"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (selectedParticipantIds.size >= 2) {
                  setStep(3);
                }
              }}
              disabled={selectedParticipantIds.size < 2}
              className={cn(
                "w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
                selectedParticipantIds.size < 2 && "opacity-50"
              )}
            >
              Next ({selectedParticipantIds.size} selected)
            </button>
          </div>
        )}

        {/* Step 3: Score entry / Manual winner / Rounds */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide px-1">
              {stepTitle}
            </p>

            {/* Round tabs (only show if >1 round) */}
            {!isManualWinner && rounds.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {rounds.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentRound(idx)}
                    className={cn(
                      "relative flex items-center gap-1 px-4 py-2 rounded-full text-[15px] font-semibold whitespace-nowrap transition-colors shrink-0",
                      currentRound === idx
                        ? "bg-[#007AFF] text-white"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    R{idx + 1}
                    {rounds.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRound(idx);
                        }}
                        className="ml-1 -mr-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </button>
                ))}
                <button
                  onClick={handleAddRound}
                  className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            )}

            <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="divide-y divide-gray-100">
                {selectedParticipants.map((p: any) => {
                  const name = getName(p);
                  const isGuest = !!p.guest_id;
                  const isLeader =
                    rounds.length > 1 && leaderId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 transition-colors",
                        isLeader && "bg-green-50"
                      )}
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center text-white text-[15px] font-bold shrink-0",
                            isGuest ? "bg-orange-400" : "bg-[#007AFF]"
                          )}
                        >
                          {name[0].toUpperCase()}
                        </div>
                        {isLeader && (
                          <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-yellow-400 flex items-center justify-center">
                            <Crown className="h-3 w-3 text-yellow-800" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[17px] font-semibold text-gray-900 truncate">
                          {name}
                        </p>
                        {rounds.length > 1 && totals && (
                          <p className="text-[13px] text-gray-500">
                            Total: {totals[p.id] ?? 0}
                          </p>
                        )}
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
                        /* Score input for current round */
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          value={rounds[currentRound]?.[p.id] ?? ""}
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
            </div>

            {/* Add Round button (for non-manual games) */}
            {!isManualWinner && rounds.length <= 1 && (
              <button
                onClick={handleAddRound}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 rounded-[14px] py-3.5 text-[15px] font-semibold text-gray-600 active:scale-[0.98] transition-transform"
              >
                <Plus className="h-4 w-4" />
                Add Round
              </button>
            )}

            {/* Totals summary (multi-round) */}
            {!isManualWinner && rounds.length > 1 && totals && (
              <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4">
                <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Totals ({rounds.length} rounds)
                </p>
                <div className="space-y-2">
                  {selectedParticipants
                    .sort(
                      (a: any, b: any) =>
                        (totals[b.id] ?? 0) - (totals[a.id] ?? 0)
                    )
                    .map((p: any, idx: number) => {
                      const name = getName(p);
                      const isTop = idx === 0 && (totals[p.id] ?? 0) > 0;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {isTop && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                            <span
                              className={cn(
                                "text-[15px]",
                                isTop
                                  ? "font-bold text-gray-900"
                                  : "text-gray-600"
                              )}
                            >
                              {name}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[17px] font-bold tabular-nums",
                              isTop ? "text-gray-900" : "text-gray-500"
                            )}
                          >
                            {totals[p.id] ?? 0}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

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
