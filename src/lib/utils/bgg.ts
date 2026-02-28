/**
 * bgg.ts — BoardGameGeek XML API2 helpers.
 *
 * Pure functions for searching, matching, and parsing BGG data.
 * No Supabase or Next.js dependencies — easy to test.
 */

import { XMLParser } from "fast-xml-parser";
import { getBggToken } from "./bgg-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BggSearchItem = {
  id: number;
  name: string;
  yearPublished: number | null;
};

export type BggThingResult = {
  image: string | null;
  thumbnail: string | null;
  primaryName: string | null;
};

export type BggMatchResult =
  | { status: "matched"; bggId: number }
  | { status: "ambiguous" }
  | { status: "missing" };

// ---------------------------------------------------------------------------
// Name normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a game name for BGG search comparison.
 * Trims whitespace, collapses multiple spaces, lowercases.
 */
export function normalizeGameName(name: string): string {
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// XML parsing
// ---------------------------------------------------------------------------

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Ensure single-item arrays are still arrays
  isArray: (tagName) => tagName === "item" || tagName === "name",
});

/**
 * Parses BGG search XML response into BggSearchItem[].
 *
 * Expected XML structure:
 * <items total="N">
 *   <item type="boardgame" id="123">
 *     <name type="primary" value="Catan"/>
 *     <yearpublished value="1995"/>
 *   </item>
 * </items>
 */
export function parseBggSearchXml(xml: string): BggSearchItem[] {
  try {
    const parsed = xmlParser.parse(xml);
    const items = parsed?.items?.item;
    if (!items || !Array.isArray(items)) return [];

    return items
      .filter((item: Record<string, unknown>) => item["@_type"] === "boardgame")
      .map((item: Record<string, unknown>) => {
        // Name can be a single object or array of objects
        const names = Array.isArray(item.name) ? item.name : [item.name];
        const primaryName = names.find(
          (n: Record<string, unknown>) => n["@_type"] === "primary"
        );
        const nameValue =
          (primaryName?.["@_value"] as string) ??
          (names[0]?.["@_value"] as string) ??
          "";

        const yearPub = item.yearpublished as
          | Record<string, unknown>
          | undefined;
        const year = yearPub?.["@_value"]
          ? Number(yearPub["@_value"])
          : null;

        return {
          id: Number(item["@_id"]),
          name: nameValue,
          yearPublished: year,
        };
      })
      .filter((item: BggSearchItem) => item.id > 0 && item.name.length > 0);
  } catch {
    return [];
  }
}

/**
 * Parses BGG thing XML response to extract image URLs.
 *
 * Expected XML structure:
 * <items>
 *   <item type="boardgame" id="123">
 *     <thumbnail>https://cf.geekdo-images.com/...</thumbnail>
 *     <image>https://cf.geekdo-images.com/...</image>
 *     <name type="primary" value="Catan"/>
 *   </item>
 * </items>
 */
export function parseBggThingXml(xml: string): BggThingResult {
  try {
    const parsed = xmlParser.parse(xml);
    const items = parsed?.items?.item;
    const item = Array.isArray(items) ? items[0] : items;
    if (!item) return { image: null, thumbnail: null, primaryName: null };

    const image = typeof item.image === "string" ? item.image : null;
    const thumbnail =
      typeof item.thumbnail === "string" ? item.thumbnail : null;

    // Get primary name
    const names = Array.isArray(item.name) ? item.name : [item.name];
    const primaryName = names.find(
      (n: Record<string, unknown>) => n?.["@_type"] === "primary"
    );
    const nameValue = (primaryName?.["@_value"] as string) ?? null;

    return { image, thumbnail, primaryName: nameValue };
  } catch {
    return { image: null, thumbnail: null, primaryName: null };
  }
}

// ---------------------------------------------------------------------------
// Match picking
// ---------------------------------------------------------------------------

/**
 * Given BGG search results and the original game name, picks the best match.
 *
 * Strategy:
 * 1. Exact name match (case-insensitive) → pick it. If tied, prefer most recent year.
 * 2. Single search result → use it.
 * 3. Otherwise → ambiguous.
 */
export function pickBestBggMatch(
  items: BggSearchItem[],
  gameName: string
): BggMatchResult {
  if (items.length === 0) return { status: "missing" };

  const normalized = normalizeGameName(gameName);

  // Pass 1: exact match
  const exactMatches = items.filter(
    (item) => normalizeGameName(item.name) === normalized
  );

  if (exactMatches.length === 1) {
    return { status: "matched", bggId: exactMatches[0].id };
  }

  if (exactMatches.length > 1) {
    // Multiple exact matches — prefer the one with the most recent year
    const sorted = [...exactMatches].sort(
      (a, b) => (b.yearPublished ?? 0) - (a.yearPublished ?? 0)
    );
    return { status: "matched", bggId: sorted[0].id };
  }

  // Pass 2: single result in the entire search
  if (items.length === 1) {
    return { status: "matched", bggId: items[0].id };
  }

  // Otherwise, too many non-exact results — ambiguous
  return { status: "ambiguous" };
}

// ---------------------------------------------------------------------------
// Fetch with retry
// ---------------------------------------------------------------------------

/**
 * Fetches a URL with retry logic for BGG rate limiting.
 * BGG may return 202 (queued) or 429 (throttled) — retries with backoff.
 * Returns the response text on success, or null on failure.
 */
export async function fetchWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<string | null> {
  const headers: Record<string, string> = {};
  const bggToken = getBggToken();
  if (bggToken) {
    headers["Authorization"] = `Bearer ${bggToken}`;
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers });

      if (res.ok) {
        const text = await res.text();
        return text;
      }

      // BGG returns 202 when request is queued — retry after delay
      if (res.status === 202 || res.status === 429) {
        const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Other error status — don't retry
      return null;
    } catch {
      // Network error — retry
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return null;
    }
  }

  return null;
}
