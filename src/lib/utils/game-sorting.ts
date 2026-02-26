import type { GameWithStats } from "@/lib/queries/games";

export type SortMode = "name" | "name_desc" | "recent" | "most" | "least";
export type QuickFilter = "recent" | "most" | "least" | null;

export function sortGames(
  games: GameWithStats[],
  sortMode: SortMode
): GameWithStats[] {
  const sorted = [...games];

  switch (sortMode) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "name_desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;

    case "recent":
      sorted.sort((a, b) => {
        // Never-played games go to the bottom
        if (!a.last_played_at && !b.last_played_at) return a.name.localeCompare(b.name);
        if (!a.last_played_at) return 1;
        if (!b.last_played_at) return -1;
        return b.last_played_at.localeCompare(a.last_played_at);
      });
      break;

    case "most":
      sorted.sort((a, b) => {
        if (b.play_count !== a.play_count) return b.play_count - a.play_count;
        return a.name.localeCompare(b.name);
      });
      break;

    case "least":
      sorted.sort((a, b) => {
        if (a.play_count !== b.play_count) return a.play_count - b.play_count;
        return a.name.localeCompare(b.name);
      });
      break;
  }

  return sorted;
}

export function filterGamesBySearch(
  games: GameWithStats[],
  searchText: string
): GameWithStats[] {
  if (!searchText.trim()) return games;
  const q = searchText.toLowerCase().trim();
  return games.filter((g) => g.name.toLowerCase().includes(q));
}
