/**
 * bgg-config.ts — Server-side BGG feature gate.
 *
 * BGG integration is enabled only when BGG_API_TOKEN is set.
 * Import this in server code (API routes, scripts) — never on the client.
 */

export function isBggEnabled(): boolean {
  const token = process.env.BGG_API_TOKEN;
  return typeof token === "string" && token.length > 0;
}

export function getBggToken(): string | null {
  const token = process.env.BGG_API_TOKEN;
  if (typeof token === "string" && token.length > 0) return token;
  return null;
}
