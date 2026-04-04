"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ToolkitFab } from "./toolkit-fab";
import { ToolkitMenu, type ToolId } from "./toolkit-menu";
import { ToolkitSheet } from "./toolkit-sheet";
import { ScoreCalculator } from "./tools/score-calculator";
import { TimerTool } from "./tools/timer-tool";
import { DiceRoller } from "./tools/dice-roller";
import { CoinFlip } from "./tools/coin-flip";

export function GameToolkit() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  function handleFabTap() {
    if (activeTool) {
      setActiveTool(null);
    } else {
      setMenuOpen((prev) => !prev);
    }
  }

  function handleSelectTool(toolId: ToolId) {
    setMenuOpen(false);
    setActiveTool(toolId);
  }

  return (
    <>
      {/* Backdrop for menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[55] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Tool menu */}
      <AnimatePresence>
        {menuOpen && <ToolkitMenu onSelect={handleSelectTool} />}
      </AnimatePresence>

      {/* FAB */}
      <ToolkitFab isOpen={menuOpen || !!activeTool} onTap={handleFabTap} />

      {/* Active tool sheet */}
      <AnimatePresence>
        {activeTool === "calculator" && (
          <ToolkitSheet
            title="Calculator"
            onClose={() => setActiveTool(null)}
          >
            <ScoreCalculator />
          </ToolkitSheet>
        )}
        {activeTool === "timer" && (
          <ToolkitSheet
            title="Timer"
            onClose={() => setActiveTool(null)}
          >
            <TimerTool />
          </ToolkitSheet>
        )}
        {activeTool === "dice" && (
          <ToolkitSheet
            title="Dice"
            onClose={() => setActiveTool(null)}
          >
            <DiceRoller />
          </ToolkitSheet>
        )}
        {activeTool === "coin" && (
          <ToolkitSheet
            title="Coin Flip"
            onClose={() => setActiveTool(null)}
          >
            <CoinFlip />
          </ToolkitSheet>
        )}
      </AnimatePresence>
    </>
  );
}
