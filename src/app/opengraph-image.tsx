import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Game Night — track your game nights";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #160728 0%, #842AEB 60%, #3F48EB 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Dice emoji */}
        <div style={{ fontSize: 80, marginBottom: 20 }}>🎲</div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            marginBottom: 12,
            letterSpacing: "-0.02em",
          }}
        >
          Game Night
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.7)",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Track scores, build your leaderboard, and see who really is the best.
        </div>

        {/* Brand bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 40,
            padding: "10px 24px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: 100,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#EBC31C",
              letterSpacing: "0.05em",
            }}
          >
            gamenight.clubplay.io
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
