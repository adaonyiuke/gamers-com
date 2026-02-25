export interface Badge {
  id: string;
  label: string;
  type: "champion" | "on_fire" | "strategist" | "wildcard";
  description: string;
}

export const BADGES: Badge[] = [
  {
    id: "champion",
    label: "Champion",
    type: "champion",
    description: "Highest overall win rate (min 5 sessions)",
  },
  {
    id: "on_fire",
    label: "On Fire",
    type: "on_fire",
    description: "3+ consecutive wins",
  },
  {
    id: "strategist",
    label: "Strategist",
    type: "strategist",
    description: "Won with 3+ different games",
  },
  {
    id: "wildcard",
    label: "Wildcard",
    type: "wildcard",
    description: "Won a game on first play",
  },
];

export interface MemberBadgeInput {
  winRate: number;
  totalSessions: number;
  currentStreak: number;
  uniqueGameWins: number;
  hasFirstPlayWin: boolean;
  isTopWinRate: boolean;
}

export function computeBadges(input: MemberBadgeInput): Badge[] {
  const earned: Badge[] = [];

  if (input.isTopWinRate && input.totalSessions >= 5) {
    earned.push(BADGES[0]); // Champion
  }
  if (input.currentStreak >= 3) {
    earned.push(BADGES[1]); // On Fire
  }
  if (input.uniqueGameWins >= 3) {
    earned.push(BADGES[2]); // Strategist
  }
  if (input.hasFirstPlayWin) {
    earned.push(BADGES[3]); // Wildcard
  }

  return earned;
}
