"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

// ─── Dot positions for each face (viewBox 0-100) ───────────────────────────

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

// ─── 3D Cube face positioning ──────────────────────────────────────────────

// Where to place each face value on the cube (matches CodePen layout)
function faceTransform(value: number, half: number): string {
  switch (value) {
    case 6: return `rotateY(0deg) translateZ(${half}px)`;       // front
    case 1: return `rotateX(180deg) translateZ(${half}px)`;     // back
    case 5: return `rotateY(90deg) translateZ(${half}px)`;      // right
    case 2: return `rotateY(-90deg) translateZ(${half}px)`;     // left
    case 3: return `rotateX(90deg) translateZ(${half}px)`;      // top
    case 4: return `rotateX(-90deg) translateZ(${half}px)`;     // bottom
    default: return "";
  }
}

// Cube rotation needed to show a given face value to the viewer
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 180, y: 0 },
  2: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: -90 },
  6: { x: 0, y: 0 },
};

// ─── Single face SVG ───────────────────────────────────────────────────────

function FaceSvg({ value, size }: { value: number; size: number }) {
  const dots = DOT_POSITIONS[value];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="2" y="2" width="96" height="96" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="2" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={8} fill="#1F2937" />
      ))}
    </svg>
  );
}

// ─── 3D Dice ───────────────────────────────────────────────────────────────

function Dice3D({
  value,
  size = 70,
  spinOffset,
}: {
  value: number;
  size?: number;
  spinOffset: { x: number; y: number };
}) {
  const half = size / 2;
  const target = FACE_ROTATIONS[value];

  return (
    <div style={{ width: size, height: size, perspective: size * 4 }}>
      <div
        style={{
          width: size,
          height: size,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(${spinOffset.x + target.x}deg) rotateY(${spinOffset.y + target.y}deg)`,
          transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((face) => (
          <div
            key={face}
            className="absolute inset-0"
            style={{
              transform: faceTransform(face, half),
              backfaceVisibility: "hidden",
            }}
          >
            <FaceSvg value={face} size={size} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DiceRoller() {
  const [diceCount, setDiceCount] = useState(2);
  const [values, setValues] = useState<number[]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [spinOffsets, setSpinOffsets] = useState<{ x: number; y: number }[]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);

  const rollDice = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setHasRolled(true);

    const results = Array.from({ length: diceCount }, () =>
      Math.floor(Math.random() * 6) + 1
    );

    // Add 2-4 exact full spins per die so they land flat on the target face
    setSpinOffsets((prev) =>
      results.map((_, i) => ({
        x: (prev[i]?.x ?? 0) + (2 + Math.floor(Math.random() * 3)) * 360,
        y: (prev[i]?.y ?? 0) + (2 + Math.floor(Math.random() * 3)) * 360,
      }))
    );
    setValues(results);

    setTimeout(() => {
      setRolling(false);
      navigator.vibrate?.(30);
    }, 1200);
  }, [rolling, diceCount]);

  function changeDiceCount(count: number) {
    setDiceCount(count);
    setValues(Array.from({ length: count }, () => 1));
    setSpinOffsets(Array.from({ length: count }, () => ({ x: 0, y: 0 })));
    setHasRolled(false);
  }

  const total = values.reduce((a, b) => a + b, 0);
  const diceSize = diceCount <= 2 ? 70 : diceCount === 3 ? 60 : 52;

  return (
    <div className="pb-4 flex flex-col items-center">
      {/* Dice count selector */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => changeDiceCount(n)}
            className={cn(
              "w-11 h-11 rounded-full text-[15px] font-semibold transition-all active:scale-[0.94]",
              diceCount === n
                ? "bg-[#842AEB] text-white shadow-md shadow-purple-500/25"
                : "bg-gray-100 text-gray-600 active:bg-gray-200"
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* 3D Dice display */}
      <div className="flex items-center justify-center gap-4 mb-4 min-h-[100px]">
        {values.map((val, i) => (
          <Dice3D
            key={i}
            value={val}
            size={diceSize}
            spinOffset={spinOffsets[i] ?? { x: 0, y: 0 }}
          />
        ))}
      </div>

      {/* Total */}
      {hasRolled && !rolling && diceCount > 1 && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[14px] font-semibold text-gray-500 mb-5"
        >
          Total: <span className="text-gray-900 text-[16px]">{total}</span>
        </motion.p>
      )}
      {(!hasRolled || rolling || diceCount <= 1) && (
        <div className="h-[24px] mb-5" />
      )}

      {/* Roll button */}
      <button
        onClick={rollDice}
        disabled={rolling}
        className={cn(
          "px-10 py-3.5 rounded-full text-[17px] font-semibold text-white active:scale-[0.96] transition-all shadow-lg",
          rolling
            ? "bg-gray-400 shadow-gray-400/25"
            : "bg-[#842AEB] shadow-purple-500/25"
        )}
      >
        {rolling ? "Rolling..." : hasRolled ? "Roll Again" : "Roll"}
      </button>
    </div>
  );
}
