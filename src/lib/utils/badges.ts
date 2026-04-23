export interface Badge {
  id: string;
  label: string;
  type: "champion" | "on_fire" | "strategist" | "wildcard" | "regular" | "veteran";
  description: string;
}

export const BADGES: Badge[] = [
  {
    id: "champion",
    label: "Champion",
    type: "champion",
    description: "#1 win rate in the group",
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
    description: "Wins across 3+ different games",
  },
  {
    id: "wildcard",
    label: "Wildcard",
    type: "wildcard",
    description: "Won a game on first play",
  },
  {
    id: "regular",
    label: "Regular",
    type: "regular",
    description: "Attended 5+ meetups",
  },
  {
    id: "veteran",
    label: "Veteran",
    type: "veteran",
    description: "Played 15+ games",
  },
];

export interface MemberBadgeInput {
  winRate: number;
  totalSessions: number;
  currentStreak: number;
  uniqueGameWins: number;
  hasFirstPlayWin: boolean;
  isTopWinRate: boolean;
  meetupsAttended: number;
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
  if (input.meetupsAttended >= 5) {
    earned.push(BADGES[4]); // Regular
  }
  if (input.totalSessions >= 15) {
    earned.push(BADGES[5]); // Veteran
  }

  return earned;
}
