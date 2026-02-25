export type ScoringType = "highest_wins" | "lowest_wins" | "manual_winner";

export interface ScoreEntry {
  participantId: string;
  score: number | null;
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
