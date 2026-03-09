#!/usr/bin/env npx tsx
/**
 * import-bgg-catalog.ts — Import BGG CSV into the bgg_catalog table.
 *
 * Usage:
 *   npx tsx scripts/import-bgg-catalog.ts path/to/boardgames_ranks.csv
 *   npx tsx scripts/import-bgg-catalog.ts path/to/boardgames_ranks.csv --dry-run
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uses service role key to bypass RLS for bulk insert.
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");

if (!csvPath) {
  console.error("Usage: npx tsx scripts/import-bgg-catalog.ts <csv-path> [--dry-run]");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Supabase client (service role for bulk inserts)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ---------------------------------------------------------------------------
// CSV parsing (simple — handles quoted fields with commas)
// ---------------------------------------------------------------------------
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseIntOrNull(val: string): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function parseFloatOrNull(val: string): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("BGG Catalog Import");
  console.log(`  CSV:     ${csvPath}`);
  console.log(`  dry-run: ${dryRun}`);
  console.log("");

  const rl = createInterface({
    input: createReadStream(resolve(csvPath!)),
    crlfDelay: Infinity,
  });

  let headerParsed = false;
  let batch: Record<string, unknown>[] = [];
  const BATCH_SIZE = 500;
  let totalRows = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  for await (const line of rl) {
    if (!headerParsed) {
      headerParsed = true;
      continue; // skip header row
    }

    const fields = parseCSVLine(line);
    if (fields.length < 8) continue; // malformed row

    const row = {
      bgg_id: parseIntOrNull(fields[0]),
      name: fields[1],
      year_published: parseIntOrNull(fields[2]),
      rank: parseIntOrNull(fields[3]),
      bayes_average: parseFloatOrNull(fields[4]),
      average: parseFloatOrNull(fields[5]),
      users_rated: parseIntOrNull(fields[6]),
      is_expansion: fields[7] === "1",
      abstracts_rank: parseIntOrNull(fields[8] ?? ""),
      cgs_rank: parseIntOrNull(fields[9] ?? ""),
      childrensgames_rank: parseIntOrNull(fields[10] ?? ""),
      familygames_rank: parseIntOrNull(fields[11] ?? ""),
      partygames_rank: parseIntOrNull(fields[12] ?? ""),
      strategygames_rank: parseIntOrNull(fields[13] ?? ""),
      thematic_rank: parseIntOrNull(fields[14] ?? ""),
      wargames_rank: parseIntOrNull(fields[15] ?? ""),
    };

    if (!row.bgg_id || !row.name) continue; // skip invalid rows

    batch.push(row);
    totalRows++;

    if (batch.length >= BATCH_SIZE) {
      if (!dryRun) {
        const { error } = await supabase.from("bgg_catalog").upsert(batch, {
          onConflict: "bgg_id",
        });
        if (error) {
          console.error(`  Batch error at row ~${totalRows}: ${error.message}`);
          totalErrors += batch.length;
        } else {
          totalInserted += batch.length;
        }
      }
      if (totalRows % 10000 === 0) {
        process.stdout.write(`  ${totalRows.toLocaleString()} rows processed...\r`);
      }
      batch = [];
    }
  }

  // Flush remaining
  if (batch.length > 0 && !dryRun) {
    const { error } = await supabase.from("bgg_catalog").upsert(batch, {
      onConflict: "bgg_id",
    });
    if (error) {
      console.error(`  Final batch error: ${error.message}`);
      totalErrors += batch.length;
    } else {
      totalInserted += batch.length;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`  Total rows:  ${totalRows.toLocaleString()}`);
  if (dryRun) {
    console.log(`  (dry run — nothing inserted)`);
  } else {
    console.log(`  Inserted:    ${totalInserted.toLocaleString()}`);
    console.log(`  Errors:      ${totalErrors.toLocaleString()}`);
  }
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
