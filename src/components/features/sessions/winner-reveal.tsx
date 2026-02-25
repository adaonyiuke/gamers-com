"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";

interface WinnerRevealProps {
  winnerName: string;
  onDismiss: () => void;
}

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = [
    "#FFD700",
    "#FF6B6B",
    "#4ECDC4",
    "#007AFF",
    "#FF9F43",
    "#A55EEA",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${x}%`,
        top: "50%",
      }}
      initial={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -120 - Math.random() * 180],
        x: [-40 + Math.random() * 80],
        scale: [1, 1.2, 0.6],
        rotate: [0, 360 + Math.random() * 360],
      }}
      transition={{
        duration: 1.5 + Math.random() * 0.8,
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
}

export function WinnerReveal({ winnerName, onDismiss }: WinnerRevealProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDismiss, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: 0.3 + Math.random() * 0.4,
    x: 10 + Math.random() * 80,
  }));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            setShow(false);
            setTimeout(onDismiss, 300);
          }}
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Confetti */}
            {confettiParticles.map((p) => (
              <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />
            ))}

            {/* Trophy */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 12,
                delay: 0.1,
              }}
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                boxShadow: "0 8px 32px rgba(255, 165, 0, 0.4)",
              }}
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>

            {/* Winner text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-center"
            >
              <p className="text-white/70 text-[15px] font-medium uppercase tracking-widest mb-2">
                Winner
              </p>
              <motion.h2
                className="text-white text-[34px] font-bold tracking-tight"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.6,
                  type: "spring",
                  stiffness: 150,
                  damping: 12,
                }}
              >
                {winnerName}
              </motion.h2>
            </motion.div>

            {/* Tap to dismiss */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5 }}
              className="text-white text-[13px] mt-8"
            >
              Tap to dismiss
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
