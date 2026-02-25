export type ScoringType = "highest_wins" | "lowest_wins" | "manual_winner";

export interface ScoreEntry {
  participantId: string;
  score: number | null;
}

export function sumRoundScores(
  rounds: Record<string, string>[],
  participantIds: string[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const id of participantIds) {
    totals[id] = 0;
    for (const round of rounds) {
      const val = round[id];
      if (val && val !== "") {
        totals[id] += Number(val) || 0;
      }
    }
  }
  return totals;
}

export function calculateWinner(
  entries: ScoreEntry[],
  scoringType: ScoringType
): string | null {
  if (entries.length === 0) return null;

  const validEntries = entries.filter((e) => e.score !== null);
  if (validEntries.length === 0) return null;

  if (scoringType === "manual_winner") {
    return null; // Manual selection required
  }

  const sorted = [...validEntries].sort((a, b) => {
    if (scoringType === "highest_wins") {
      return (b.score ?? 0) - (a.score ?? 0);
    }
    return (a.score ?? 0) - (b.score ?? 0);
  });

  return sorted[0].participantId;
}
