/**
 * scoring.ts — Re-exports from the centralized game-rules module.
 *
 * Kept for backward compatibility; new code should import from
 * "@/lib/utils/game-rules" directly.
 */

export type { GameScoringType as ScoringType } from "./game-rules";
export type { ScoreEntry } from "./game-rules";
export { sumRoundScores, calculateWinner } from "./game-rules";
