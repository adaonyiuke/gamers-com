/**
 * game-rules.test.ts — Drift-prevention tests for scoring type consistency.
 *
 * These tests ensure the centralized game-rules module stays in sync with:
 *   1. The database CHECK constraint (games.scoring_type)
 *   2. The Supabase-generated TypeScript types
 *   3. All UI components that render or accept scoring types
 *
 * Run: npx vitest run src/lib/utils/__tests__/game-rules.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  GAME_SCORING_TYPES,
  SCORING_LABELS,
  SCORING_DESCRIPTIONS,
  SCORING_OPTIONS,
  SCORING_TYPE_ENUM,
  isGameScoringType,
  getGameScoringMode,
  requiresScoreEntry,
  isManualWinnerType,
  calculateWinner,
  getPlacementWinner,
  validateResultInput,
  getScoringLabel,
  type GameScoringType,
} from "../game-rules";

// ---------------------------------------------------------------------------
// 1. Constant completeness — every scoring type has labels, descriptions, etc.
// ---------------------------------------------------------------------------

describe("Constant completeness", () => {
  it("GAME_SCORING_TYPES matches DB constraint values", () => {
    // DB constraint: CHECK (scoring_type IN ('highest_wins','lowest_wins','manual_winner','placement'))
    const dbValues = ["highest_wins", "lowest_wins", "manual_winner", "placement"];
    expect([...GAME_SCORING_TYPES].sort()).toEqual([...dbValues].sort());
  });

  it("every type has a label", () => {
    for (const t of GAME_SCORING_TYPES) {
      expect(SCORING_LABELS[t]).toBeDefined();
      expect(SCORING_LABELS[t].length).toBeGreaterThan(0);
    }
  });

  it("every type has a description", () => {
    for (const t of GAME_SCORING_TYPES) {
      expect(SCORING_DESCRIPTIONS[t]).toBeDefined();
      expect(SCORING_DESCRIPTIONS[t].length).toBeGreaterThan(0);
    }
  });

  it("SCORING_OPTIONS covers every type", () => {
    const optionValues = SCORING_OPTIONS.map((o) => o.value);
    expect(optionValues.sort()).toEqual([...GAME_SCORING_TYPES].sort());
  });

  it("SCORING_OPTIONS have label + description from the canonical maps", () => {
    for (const opt of SCORING_OPTIONS) {
      expect(opt.label).toBe(SCORING_LABELS[opt.value]);
      expect(opt.description).toBe(SCORING_DESCRIPTIONS[opt.value]);
    }
  });

  it("SCORING_TYPE_ENUM matches GAME_SCORING_TYPES", () => {
    expect([...SCORING_TYPE_ENUM]).toEqual([...GAME_SCORING_TYPES]);
  });
});

// ---------------------------------------------------------------------------
// 2. Type guard
// ---------------------------------------------------------------------------

describe("isGameScoringType", () => {
  it("accepts valid values", () => {
    for (const t of GAME_SCORING_TYPES) {
      expect(isGameScoringType(t)).toBe(true);
    }
  });

  it("rejects invalid values", () => {
    expect(isGameScoringType("")).toBe(false);
    expect(isGameScoringType("unknown")).toBe(false);
    expect(isGameScoringType("HIGHEST_WINS")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Scoring mode classification
// ---------------------------------------------------------------------------

describe("getGameScoringMode", () => {
  it("classifies winner-based types", () => {
    expect(getGameScoringMode("highest_wins")).toBe("winner");
    expect(getGameScoringMode("lowest_wins")).toBe("winner");
    expect(getGameScoringMode("manual_winner")).toBe("winner");
  });

  it("classifies placement type", () => {
    expect(getGameScoringMode("placement")).toBe("placement");
  });
});

describe("requiresScoreEntry", () => {
  it("highest_wins and lowest_wins require scores", () => {
    expect(requiresScoreEntry("highest_wins")).toBe(true);
    expect(requiresScoreEntry("lowest_wins")).toBe(true);
  });

  it("manual_winner and placement do not require scores", () => {
    expect(requiresScoreEntry("manual_winner")).toBe(false);
    expect(requiresScoreEntry("placement")).toBe(false);
  });
});

describe("isManualWinnerType", () => {
  it("only manual_winner returns true", () => {
    expect(isManualWinnerType("manual_winner")).toBe(true);
    expect(isManualWinnerType("highest_wins")).toBe(false);
    expect(isManualWinnerType("lowest_wins")).toBe(false);
    expect(isManualWinnerType("placement")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Winner calculation
// ---------------------------------------------------------------------------

describe("calculateWinner", () => {
  const entries = [
    { participantId: "a", score: 10 },
    { participantId: "b", score: 20 },
    { participantId: "c", score: 5 },
  ];

  it("highest_wins returns highest scorer", () => {
    expect(calculateWinner(entries, "highest_wins")).toBe("b");
  });

  it("lowest_wins returns lowest scorer", () => {
    expect(calculateWinner(entries, "lowest_wins")).toBe("c");
  });

  it("manual_winner returns null", () => {
    expect(calculateWinner(entries, "manual_winner")).toBeNull();
  });

  it("placement returns null", () => {
    expect(calculateWinner(entries, "placement")).toBeNull();
  });

  it("returns null for empty entries", () => {
    expect(calculateWinner([], "highest_wins")).toBeNull();
  });

  it("skips null scores", () => {
    const withNulls = [
      { participantId: "a", score: null },
      { participantId: "b", score: 5 },
    ];
    expect(calculateWinner(withNulls, "highest_wins")).toBe("b");
  });
});

describe("getPlacementWinner", () => {
  it("returns participant with placement 1", () => {
    const entries = [
      { participantId: "a", placement: 2 },
      { participantId: "b", placement: 1 },
      { participantId: "c", placement: 3 },
    ];
    expect(getPlacementWinner(entries)).toBe("b");
  });

  it("returns null if no 1st place", () => {
    const entries = [
      { participantId: "a", placement: 2 },
      { participantId: "b", placement: 3 },
    ];
    expect(getPlacementWinner(entries)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. getScoringLabel
// ---------------------------------------------------------------------------

describe("getScoringLabel", () => {
  it("returns label for known types", () => {
    expect(getScoringLabel("highest_wins")).toBe("Highest Wins");
    expect(getScoringLabel("placement")).toBe("Placement");
  });

  it("returns raw string for unknown types", () => {
    expect(getScoringLabel("unknown_type")).toBe("unknown_type");
  });
});

// ---------------------------------------------------------------------------
// 6. Validation
// ---------------------------------------------------------------------------

describe("validateResultInput", () => {
  it("rejects fewer than 2 players", () => {
    expect(
      validateResultInput("highest_wins", { scores: [], placements: [], manualWinnerId: null }, 1)
    ).toBe("At least 2 players are required.");
  });

  it("requires at least one score for score-based types", () => {
    const draft = {
      scores: [
        { participantId: "a", score: null },
        { participantId: "b", score: null },
      ],
      placements: [],
      manualWinnerId: null,
    };
    expect(validateResultInput("highest_wins", draft, 2)).toBe("Enter at least one score.");
    expect(validateResultInput("lowest_wins", draft, 2)).toBe("Enter at least one score.");
  });

  it("accepts valid score entry", () => {
    const draft = {
      scores: [
        { participantId: "a", score: 10 },
        { participantId: "b", score: null },
      ],
      placements: [],
      manualWinnerId: null,
    };
    expect(validateResultInput("highest_wins", draft, 2)).toBeNull();
  });

  it("requires winner selection for manual_winner", () => {
    const draft = { scores: [], placements: [], manualWinnerId: null };
    expect(validateResultInput("manual_winner", draft, 2)).toBe("Select a winner.");
  });

  it("accepts manual_winner with selection", () => {
    const draft = { scores: [], placements: [], manualWinnerId: "a" };
    expect(validateResultInput("manual_winner", draft, 2)).toBeNull();
  });

  it("requires 1st place for placement", () => {
    const draft = {
      scores: [],
      placements: [{ participantId: "a", placement: 2 }],
      manualWinnerId: null,
    };
    expect(validateResultInput("placement", draft, 2)).toBe("Assign 1st place.");
  });

  it("accepts placement with 1st place assigned", () => {
    const draft = {
      scores: [],
      placements: [
        { participantId: "a", placement: 1 },
        { participantId: "b", placement: 2 },
      ],
      manualWinnerId: null,
    };
    expect(validateResultInput("placement", draft, 2)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. Drift QA checklist (meta-test)
// ---------------------------------------------------------------------------

describe("Drift QA Checklist", () => {
  /**
   * When adding a new scoring type:
   *
   * 1. DB migration:
   *    - Add value to games.scoring_type CHECK constraint
   *    - If needed, add columns to score_entries
   *
   * 2. Regenerate types:
   *    npx supabase gen types typescript --project-id syyjqhsmasrsqhorgoxs > src/lib/supabase/types.ts
   *
   * 3. Update game-rules.ts:
   *    - Add to GAME_SCORING_TYPES array
   *    - Add to SCORING_LABELS map
   *    - Add to SCORING_DESCRIPTIONS map
   *    - Add cases in getGameScoringMode()
   *    - Add cases in requiresScoreEntry()
   *    - Add case in calculateWinner()
   *    - Add case in validateResultInput()
   *    - SCORING_OPTIONS and SCORING_TYPE_ENUM derive automatically
   *
   * 4. Update useFinalizeSession (sessions.ts):
   *    - Handle the new mode's data shape in score_entries upsert
   *
   * 5. Update new session page (sessions/new/page.tsx):
   *    - Add entry UI for the new mode in step 3
   *    - Update handleFinalize to build entries for the new mode
   *    - Update canFinalize validation
   *
   * 6. Update useGameTopPerformers (games.ts):
   *    - Add aggregation logic for the new mode
   *
   * 7. Build and run tests:
   *    npx next build
   *    npx vitest run src/lib/utils/__tests__/game-rules.test.ts
   *
   * The exhaustive switch + `never` pattern in game-rules.ts will cause
   * compile errors if you add a type but forget a case — this is intentional.
   */
  it("exhaustive switches will catch missing cases at compile time", () => {
    // This test just documents that the pattern exists.
    // The real guard is TypeScript's `never` type in the default branches.
    const allModes = GAME_SCORING_TYPES.map(getGameScoringMode);
    expect(allModes.length).toBe(GAME_SCORING_TYPES.length);
  });
});
