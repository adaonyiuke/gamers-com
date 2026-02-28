#!/usr/bin/env npx tsx
/**
 * backfill-bgg-art.ts — Fetch BGG box art for games missing images.
 *
 * Usage:
 *   npx tsx scripts/backfill-bgg-art.ts
 *   npx tsx scripts/backfill-bgg-art.ts --limit 5
 *   npx tsx scripts/backfill-bgg-art.ts --dry-run
 *   npx tsx scripts/backfill-bgg-art.ts --delay 2000
 *
 * Requires BGG_API_TOKEN in .env.local (or environment).
 * Also requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
import { config } from "dotenv";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Load .env.local (explicit for safety across dotenv versions)
// ---------------------------------------------------------------------------
config({ path: resolve(process.cwd(), ".env.local") });

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function getFlag(name: string): boolean {
  return args.includes(`--${name}`);
}
function getFlagValue(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

const dryRun = getFlag("dry-run");
const limit = getFlagValue("limit") ? parseInt(getFlagValue("limit")!, 10) : undefined;
const delay = getFlagValue("delay") ? parseInt(getFlagValue("delay")!, 10) : 1500;

// ---------------------------------------------------------------------------
// Validate environment
// ---------------------------------------------------------------------------
const bggToken = process.env.BGG_API_TOKEN;
if (!bggToken || bggToken.length === 0) {
  console.error("ERROR: BGG_API_TOKEN is not set. Cannot backfill without a token.");
  console.error("Set it in .env.local or your environment, then re-run.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// BGG helpers (inlined to avoid path alias issues in standalone script)
// ---------------------------------------------------------------------------
const BGG_SEARCH_URL = "https://boardgamegeek.com/xmlapi2/search";
const BGG_THING_URL = "https://boardgamegeek.com/xmlapi2/thing";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => tagName === "item" || tagName === "name",
});

function normalizeGameName(name: string): string {
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}

type BggSearchItem = { id: number; name: string; yearPublished: number | null };

function parseBggSearchXml(xml: string): BggSearchItem[] {
  try {
    const parsed = xmlParser.parse(xml);
    const items = parsed?.items?.item;
    if (!items || !Array.isArray(items)) return [];
    return items
      .filter((item: Record<string, unknown>) => item["@_type"] === "boardgame")
      .map((item: Record<string, unknown>) => {
        const names = Array.isArray(item.name) ? item.name : [item.name];
        const primaryName = names.find((n: Record<string, unknown>) => n["@_type"] === "primary");
        const nameValue = (primaryName?.["@_value"] as string) ?? (names[0]?.["@_value"] as string) ?? "";
        const yearPub = item.yearpublished as Record<string, unknown> | undefined;
        const year = yearPub?.["@_value"] ? Number(yearPub["@_value"]) : null;
        return { id: Number(item["@_id"]), name: nameValue, yearPublished: year };
      })
      .filter((item: BggSearchItem) => item.id > 0 && item.name.length > 0);
  } catch {
    return [];
  }
}

function pickBestBggMatch(items: BggSearchItem[], gameName: string) {
  if (items.length === 0) return { status: "missing" as const };
  const normalized = normalizeGameName(gameName);
  const exactMatches = items.filter((item) => normalizeGameName(item.name) === normalized);
  if (exactMatches.length === 1) return { status: "matched" as const, bggId: exactMatches[0].id };
  if (exactMatches.length > 1) {
    const sorted = [...exactMatches].sort((a, b) => (b.yearPublished ?? 0) - (a.yearPublished ?? 0));
    return { status: "matched" as const, bggId: sorted[0].id };
  }
  if (items.length === 1) return { status: "matched" as const, bggId: items[0].id };
  return { status: "ambiguous" as const };
}

function parseBggThingXml(xml: string) {
  try {
    const parsed = xmlParser.parse(xml);
    const items = parsed?.items?.item;
    const item = Array.isArray(items) ? items[0] : items;
    if (!item) return { image: null, thumbnail: null };
    return {
      image: typeof item.image === "string" ? item.image : null,
      thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : null,
    };
  } catch {
    return { image: null, thumbnail: null };
  }
}

async function fetchBgg(url: string, maxRetries = 3): Promise<string | null> {
  const headers: Record<string, string> = { Authorization: `Bearer ${bggToken}` };
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return await res.text();
      if (res.status === 202 || res.status === 429) {
        const wait = Math.pow(2, attempt + 1) * 1000;
        await sleep(wait);
        continue;
      }
      return null;
    } catch {
      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }
      return null;
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("BGG Art Backfill");
  console.log(`  dry-run: ${dryRun}`);
  console.log(`  limit:   ${limit ?? "all"}`);
  console.log(`  delay:   ${delay}ms between games`);
  console.log("");

  // Find games needing art
  let query = supabase
    .from("games")
    .select("id, name, image_status, image_url")
    .or("image_status.in.(pending_auth,pending,missing,ambiguous,error),image_url.is.null")
    .order("name", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: games, error } = await query;
  if (error) {
    console.error("Failed to fetch games:", error.message);
    process.exit(1);
  }

  if (!games || games.length === 0) {
    console.log("No games need backfilling. All done!");
    process.exit(0);
  }

  console.log(`Found ${games.length} game(s) to process.\n`);

  const stats = { ok: 0, missing: 0, ambiguous: 0, error: 0, skipped: 0 };

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const prefix = `[${i + 1}/${games.length}]`;

    if (dryRun) {
      console.log(`${prefix} ${game.name} (status: ${game.image_status}) — would process`);
      stats.skipped++;
      continue;
    }

    process.stdout.write(`${prefix} ${game.name}... `);

    // Search BGG
    const searchQuery = encodeURIComponent(normalizeGameName(game.name));
    const searchXml = await fetchBgg(`${BGG_SEARCH_URL}?type=boardgame&query=${searchQuery}`);

    if (!searchXml) {
      console.log("BGG search failed");
      await supabase.from("games").update({ image_status: "error", image_updated_at: new Date().toISOString() }).eq("id", game.id);
      stats.error++;
      await sleep(delay);
      continue;
    }

    const items = parseBggSearchXml(searchXml);
    const match = pickBestBggMatch(items, game.name);

    if (match.status === "missing") {
      console.log("no results on BGG");
      await supabase.from("games").update({ image_status: "missing", bgg_id: null, image_url: null, thumbnail_url: null, image_source: null, image_updated_at: new Date().toISOString() }).eq("id", game.id);
      stats.missing++;
      await sleep(delay);
      continue;
    }

    if (match.status === "ambiguous") {
      console.log(`ambiguous (${items.length} results)`);
      await supabase.from("games").update({ image_status: "ambiguous", bgg_id: null, image_url: null, thumbnail_url: null, image_source: null, image_updated_at: new Date().toISOString() }).eq("id", game.id);
      stats.ambiguous++;
      await sleep(delay);
      continue;
    }

    // Fetch thing details
    const thingXml = await fetchBgg(`${BGG_THING_URL}?id=${match.bggId}`);
    if (!thingXml) {
      console.log("BGG thing fetch failed");
      await supabase.from("games").update({ image_status: "error", image_updated_at: new Date().toISOString() }).eq("id", game.id);
      stats.error++;
      await sleep(delay);
      continue;
    }

    const images = parseBggThingXml(thingXml);
    const status = images.image ? "ok" : "missing";

    await supabase.from("games").update({
      bgg_id: match.bggId,
      image_url: images.image,
      thumbnail_url: images.thumbnail,
      image_source: "bgg",
      image_status: status,
      image_updated_at: new Date().toISOString(),
    }).eq("id", game.id);

    if (status === "ok") {
      console.log(`OK (bgg_id: ${match.bggId})`);
      stats.ok++;
    } else {
      console.log(`matched but no image (bgg_id: ${match.bggId})`);
      stats.missing++;
    }

    // Pace requests
    if (i < games.length - 1) {
      await sleep(delay);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`  OK:        ${stats.ok}`);
  console.log(`  Missing:   ${stats.missing}`);
  console.log(`  Ambiguous: ${stats.ambiguous}`);
  console.log(`  Errors:    ${stats.error}`);
  if (dryRun) console.log(`  Skipped:   ${stats.skipped} (dry run)`);
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
