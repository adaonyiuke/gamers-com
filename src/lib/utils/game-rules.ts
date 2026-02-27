/**
 * game-rules.ts — Single source of truth for all scoring-type logic.
 *
 * Every component / hook that needs to know about scoring types MUST import
 * from this file. No string literals like "highest_wins" should appear in UI
 * or query code outside of this module.
 */

// ---------------------------------------------------------------------------
// 1. Core type
// ---------------------------------------------------------------------------

/** All valid values for `games.scoring_type` in the database. */
export const GAME_SCORING_TYPES = [
  "highest_wins",
  "lowest_wins",
  "manual_winner",
  "placement",
] as const;

export type GameScoringType = (typeof GAME_SCORING_TYPES)[number];

/** Runtime guard — returns true if `value` is a valid GameScoringType. */
export function isGameScoringType(value: string): value is GameScoringType {
  return (GAME_SCORING_TYPES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// 2. Scoring mode
// ---------------------------------------------------------------------------

/** High-level mode: does the game track numeric scores or placements? */
export type ScoringMode = "winner" | "placement";

export function getGameScoringMode(scoringType: GameScoringType): ScoringMode {
  switch (scoringType) {
    case "highest_wins":
    case "lowest_wins":
    case "manual_winner":
      return "winner";
    case "placement":
      return "placement";
    default: {
      const _exhaustive: never = scoringType;
      throw new Error(`Unknown scoring type: ${_exhaustive}`);
    }
  }
}

/** Does this scoring type require numeric score entry? */
export function requiresScoreEntry(scoringType: GameScoringType): boolean {
  switch (scoringType) {
    case "highest_wins":
    case "lowest_wins":
      return true;
    case "manual_winner":
    case "placement":
      return false;
    default: {
      const _exhaustive: never = scoringType;
      throw new Error(`Unknown scoring type: ${_exhaustive}`);
    }
  }
}

/** Does this scoring type require manual winner selection (no auto-calc)? */
export function isManualWinnerType(scoringType: GameScoringType): boolean {
  return scoringType === "manual_winner";
}

// ---------------------------------------------------------------------------
// 3. Display constants — labels, descriptions, options
// ---------------------------------------------------------------------------

export const SCORING_LABELS: Record<GameScoringType, string> = {
  highest_wins: "Highest Wins",
  lowest_wins: "Lowest Wins",
  manual_winner: "Manual Winner",
  placement: "Placement",
};

export const SCORING_DESCRIPTIONS: Record<GameScoringType, string> = {
  highest_wins: "The player with the highest score wins the game.",
  lowest_wins: "The player with the lowest score wins (e.g., golf).",
  manual_winner: "You pick the winner yourself — no scores needed.",
  placement: "Players are ranked by placement (1st, 2nd, 3rd…).",
};

/** Array used by form components (segmented controls, dropdowns, etc.). */
export const SCORING_OPTIONS = GAME_SCORING_TYPES.map((value) => ({
  value,
  label: SCORING_LABELS[value],
  description: SCORING_DESCRIPTIONS[value],
}));

// ---------------------------------------------------------------------------
// 4. Winner calculation
// ---------------------------------------------------------------------------

export interface ScoreEntry {
  participantId: string;
  score: number | null;
}

export interface PlacementEntry {
  participantId: string;
  placement: number;
}

/**
 * Sums round-based scores for each participant.
 * Used for multi-round games (e.g. Catan with expansion rounds).
 */
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

/**
 * Auto-determines the winner based on scoring type and entries.
 * Returns the participantId of the winner, or null for manual_winner / placement.
 */
export function calculateWinner(
  entries: ScoreEntry[],
  scoringType: GameScoringType
): string | null {
  if (entries.length === 0) return null;

  switch (scoringType) {
    case "manual_winner":
    case "placement":
      return null; // Selection is manual or derived from placement order

    case "highest_wins": {
      const valid = entries.filter((e) => e.score !== null);
      if (valid.length === 0) return null;
      const sorted = [...valid].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      return sorted[0].participantId;
    }

    case "lowest_wins": {
      const valid = entries.filter((e) => e.score !== null);
      if (valid.length === 0) return null;
      const sorted = [...valid].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
      return sorted[0].participantId;
    }

    default: {
      const _exhaustive: never = scoringType;
      throw new Error(`Unknown scoring type: ${_exhaustive}`);
    }
  }
}

/**
 * Derives the winner from placement entries (1st place).
 */
export function getPlacementWinner(
  entries: PlacementEntry[]
): string | null {
  const first = entries.find((e) => e.placement === 1);
  return first?.participantId ?? null;
}

// ---------------------------------------------------------------------------
// 5. Result formatting
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable result label for a scoring type.
 * Used in session detail, game picker tiles, etc.
 */
export function getScoringLabel(scoringType: string): string {
  if (isGameScoringType(scoringType)) {
    return SCORING_LABELS[scoringType];
  }
  return scoringType;
}

// ---------------------------------------------------------------------------
// 6. Validation
// ---------------------------------------------------------------------------

export interface ResultDraft {
  scores: ScoreEntry[];
  placements: PlacementEntry[];
  manualWinnerId: string | null;
}

/**
 * Validates that a result draft is complete enough to finalize.
 * Returns an error message or null if valid.
 */
export function validateResultInput(
  scoringType: GameScoringType,
  draft: ResultDraft,
  participantCount: number
): string | null {
  if (participantCount < 2) {
    return "At least 2 players are required.";
  }

  switch (scoringType) {
    case "highest_wins":
    case "lowest_wins": {
      const hasAnyScore = draft.scores.some((s) => s.score !== null);
      if (!hasAnyScore) return "Enter at least one score.";
      return null;
    }

    case "manual_winner": {
      if (!draft.manualWinnerId) return "Select a winner.";
      return null;
    }

    case "placement": {
      if (draft.placements.length === 0) return "Assign placements.";
      // Ensure 1st place is assigned
      const hasFirst = draft.placements.some((p) => p.placement === 1);
      if (!hasFirst) return "Assign 1st place.";
      return null;
    }

    default: {
      const _exhaustive: never = scoringType;
      throw new Error(`Unknown scoring type: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Zod schema value (for form validation)
// ---------------------------------------------------------------------------

/** Tuple for z.enum() — use as z.enum(SCORING_TYPE_ENUM) */
export const SCORING_TYPE_ENUM = [
  "highest_wins",
  "lowest_wins",
  "manual_winner",
  "placement",
] as const satisfies readonly [GameScoringType, ...GameScoringType[]];
