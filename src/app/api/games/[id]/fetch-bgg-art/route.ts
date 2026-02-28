import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBggEnabled } from "@/lib/utils/bgg-config";
import {
  normalizeGameName,
  pickBestBggMatch,
  parseBggSearchXml,
  parseBggThingXml,
  fetchWithRetry,
} from "@/lib/utils/bgg";

const BGG_SEARCH_URL = "https://boardgamegeek.com/xmlapi2/search";
const BGG_THING_URL = "https://boardgamegeek.com/xmlapi2/thing";

async function updateGameImageFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameId: string,
  fields: Record<string, unknown>
) {
  await supabase
    .from("games")
    .update({
      ...fields,
      image_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;

  try {
    // 0. Short-circuit if BGG is disabled (no token)
    if (!isBggEnabled()) {
      const supabase = await createClient();
      await updateGameImageFields(supabase, gameId, {
        image_status: "pending_auth",
        bgg_id: null,
        image_url: null,
        thumbnail_url: null,
        image_source: null,
      });
      return NextResponse.json({ status: "disabled" });
    }

    const supabase = await createClient();

    // 1. Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Read the game row
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, name, bgg_id, image_status")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // 3. Optionally accept a name override from request body
    let body: { name?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }
    const searchName = body.name ?? game.name;

    // 4. Call BGG search with retry
    const query = encodeURIComponent(normalizeGameName(searchName));
    const searchUrl = `${BGG_SEARCH_URL}?type=boardgame&query=${query}`;
    const searchXml = await fetchWithRetry(searchUrl);

    if (!searchXml) {
      await updateGameImageFields(supabase, gameId, {
        image_status: "error",
      });
      return NextResponse.json(
        { status: "error", reason: "BGG search failed" },
        { status: 502 }
      );
    }

    // 5. Parse search results and pick best match
    const items = parseBggSearchXml(searchXml);
    const match = pickBestBggMatch(items, searchName);

    if (match.status === "missing") {
      await updateGameImageFields(supabase, gameId, {
        image_status: "missing",
        bgg_id: null,
        image_url: null,
        thumbnail_url: null,
        image_source: null,
      });
      return NextResponse.json({ status: "missing" });
    }

    if (match.status === "ambiguous") {
      await updateGameImageFields(supabase, gameId, {
        image_status: "ambiguous",
        bgg_id: null,
        image_url: null,
        thumbnail_url: null,
        image_source: null,
      });
      return NextResponse.json({ status: "ambiguous" });
    }

    // 6. Fetch thing details for the matched BGG ID
    const thingUrl = `${BGG_THING_URL}?id=${match.bggId}`;
    const thingXml = await fetchWithRetry(thingUrl);

    if (!thingXml) {
      await updateGameImageFields(supabase, gameId, {
        image_status: "error",
      });
      return NextResponse.json(
        { status: "error", reason: "BGG thing fetch failed" },
        { status: 502 }
      );
    }

    const images = parseBggThingXml(thingXml);

    // 7. Update game row with image data
    await updateGameImageFields(supabase, gameId, {
      bgg_id: match.bggId,
      image_url: images.image,
      thumbnail_url: images.thumbnail,
      image_source: "bgg",
      image_status: images.image ? "ok" : "missing",
    });

    return NextResponse.json({
      status: images.image ? "ok" : "missing",
      bggId: match.bggId,
      imageUrl: images.image,
      thumbnailUrl: images.thumbnail,
    });
  } catch (err) {
    // Catch-all: don't crash the route
    console.error("BGG art fetch error:", err);
    try {
      const supabase = await createClient();
      await updateGameImageFields(supabase, gameId, {
        image_status: "error",
      });
    } catch {
      // Best-effort DB update
    }
    return NextResponse.json(
      { status: "error", reason: "Unexpected error" },
      { status: 500 }
    );
  }
}
