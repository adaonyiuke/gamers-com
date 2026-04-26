/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/lib/utils/badges";

const BADGE_GLOW: Record<string, string> = {
  champion:   "#F59E0B",
  on_fire:    "#FF2DEA",
  strategist: "#007AFF",
  wildcard:   "#00C7BE",
  regular:    "#F59E0B",
  veteran:    "#6B7280",
};

// 8 sparkle positions (angle in degrees from top, radius ~88px)
const SPARKLES = [0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
  const rad = (deg * Math.PI) / 180;
  const r = 88 + (i % 3) * 10;
  return {
    x: Math.round(Math.sin(rad) * r),
    y: Math.round(-Math.cos(rad) * r),
    size: 5 + (i % 3) * 3,
    delay: i * 0.07,
  };
});

interface Props {
  badges: Badge[];
  currentIndex: number;
  onNext: () => void;
  onDismiss: () => void;
}

export function BadgeCelebrationModal({
  badges,
  currentIndex,
  onNext,
  onDismiss,
}: Props) {
  const badge = badges[currentIndex];
  if (!badge) return null;

  const glow = BADGE_GLOW[badge.type] ?? "#888888";
  const isLast = currentIndex === badges.length - 1;

  return (
    <>
      <style>{`
        @keyframes gn-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes gn-card-in {
          from { opacity: 0; transform: scale(0.85) translateY(32px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes gn-badge-in {
          0%   { opacity: 0; transform: scale(0.4); }
          70%  { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes gn-glow-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.9;  transform: scale(1.12); }
        }
        @keyframes gn-sparkle {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
        }
        @keyframes gn-text-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          animation: "gn-backdrop-in 0.25s ease both",
        }}
        onClick={onDismiss}
      />

      {/* Card */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 360,
            background: "#fff",
            borderRadius: 32,
            padding: "44px 28px 28px",
            textAlign: "center",
            boxShadow: "0 32px 64px -12px rgba(0,0,0,0.45)",
            animation: "gn-card-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            pointerEvents: "auto",
          }}
        >
          {/* Multi-badge counter */}
          {badges.length > 1 && (
            <span
              style={{
                position: "absolute",
                top: 18,
                right: 22,
                fontSize: 12,
                fontWeight: 700,
                color: "#9ca3af",
                letterSpacing: "0.05em",
              }}
            >
              {currentIndex + 1} / {badges.length}
            </span>
          )}

          {/* Label */}
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: glow,
              marginBottom: 22,
              animation: "gn-text-in 0.4s ease 0.15s both",
            }}
          >
            New Badge Unlocked!
          </p>

          {/* Badge image with glow + sparkles */}
          <div
            style={{
              position: "relative",
              width: 148,
              height: 148,
              margin: "0 auto 28px",
              animation: "gn-badge-in 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.05s both",
            }}
          >
            {/* Glow halo */}
            <div
              style={{
                position: "absolute",
                inset: -24,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${glow}55 0%, transparent 68%)`,
                animation: "gn-glow-pulse 2.2s ease-in-out 0.6s infinite",
              }}
            />

            {/* Sparkle burst */}
            {SPARKLES.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: s.size,
                  height: s.size,
                  marginTop: -(s.size / 2),
                  marginLeft: -(s.size / 2),
                  borderRadius: "50%",
                  background: glow,
                  animation: `gn-sparkle 0.55s ease-out ${0.1 + s.delay}s both`,
                  ["--tx" as string]: `${s.x}px`,
                  ["--ty" as string]: `${s.y}px`,
                }}
              />
            ))}

            <img
              src={`/badges/${badge.type}-front.png`}
              alt={badge.label}
              style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: `drop-shadow(0 8px 24px ${glow}88)`,
              }}
            />
          </div>

          {/* Badge name */}
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 8,
              lineHeight: 1.1,
              animation: "gn-text-in 0.4s ease 0.25s both",
            }}
          >
            {badge.label}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: 15,
              color: "#6b7280",
              lineHeight: 1.45,
              marginBottom: 32,
              animation: "gn-text-in 0.4s ease 0.3s both",
            }}
          >
            {badge.description}
          </p>

          {/* CTA */}
          <button
            onClick={isLast ? onDismiss : onNext}
            style={{
              width: "100%",
              padding: "16px",
              background: "#111827",
              color: "#fff",
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              animation: "gn-text-in 0.4s ease 0.35s both",
            }}
          >
            {isLast ? "Awesome! 🎉" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
