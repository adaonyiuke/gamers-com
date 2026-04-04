"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";

type CoinResult = "heads" | "tails";

export function CoinFlip() {
  const [result, setResult] = useState<CoinResult>("heads");
  const [flipping, setFlipping] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [rotation, setRotation] = useState(0);
  const prevRotation = useRef(0);

  const flipCoin = useCallback(() => {
    if (flipping) return;

    const outcome: CoinResult = Math.random() < 0.5 ? "heads" : "tails";
    const faceOffset = outcome === "tails" ? 180 : 0;
    // 5-7 full spins forward from current position
    const spins = (5 + Math.floor(Math.random() * 3)) * 360;
    // Calculate next rotation that lands on the correct face
    const base = prevRotation.current + spins;
    // Adjust so rotation % 360 === faceOffset
    const currentMod = base % 360;
    const adjustment = (faceOffset - currentMod + 360) % 360;
    const nextRotation = base + adjustment;

    prevRotation.current = nextRotation;
    setRotation(nextRotation);
    setResult(outcome);
    setFlipping(true);
    setHasFlipped(true);

    setTimeout(() => {
      setFlipping(false);
      navigator.vibrate?.(30);
    }, 1600);
  }, [flipping]);

  return (
    <div className="pb-4 flex flex-col items-center">
      {/* Coin */}
      <div className="mb-6 mt-2" style={{ perspective: 800 }}>
        <motion.div
          className="relative"
          style={{
            width: 180,
            height: 180,
            transformStyle: "preserve-3d",
          }}
          animate={{ rotateX: rotation }}
          transition={
            hasFlipped
              ? { duration: 1.6, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0 }
          }
        >
          {/* Heads (front) */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Image
              src="/coin-heads.svg"
              alt="Heads"
              width={180}
              height={180}
              className="drop-shadow-lg"
              priority
            />
          </div>

          {/* Tails (back) */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateX(180deg)",
            }}
          >
            <Image
              src="/coin-tails.svg"
              alt="Tails"
              width={180}
              height={180}
              className="drop-shadow-lg"
              priority
            />
          </div>
        </motion.div>
      </div>

      {/* Result text */}
      {hasFlipped && !flipping && (
        <motion.p
          key={result + rotation}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[20px] font-semibold text-gray-900 mb-6 capitalize"
        >
          {result}!
        </motion.p>
      )}
      {(!hasFlipped || flipping) && <div className="h-[28px] mb-6" />}

      {/* Flip button */}
      <button
        onClick={flipCoin}
        disabled={flipping}
        className={cn(
          "px-10 py-3.5 rounded-full text-[17px] font-semibold text-white active:scale-[0.96] transition-all shadow-lg",
          flipping
            ? "bg-gray-400 shadow-gray-400/25"
            : "bg-[#842AEB] shadow-purple-500/25"
        )}
      >
        {flipping ? "Flipping..." : hasFlipped ? "Flip Again" : "Flip"}
      </button>
    </div>
  );
}
