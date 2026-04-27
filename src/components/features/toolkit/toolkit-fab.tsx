"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ToolCase, X } from "lucide-react";

type ToolkitFabProps = {
  isOpen: boolean;
  onTap: () => void;
};

export function ToolkitFab({ isOpen, onTap }: ToolkitFabProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-none">
      <div className="max-w-[430px] mx-auto relative">
        <button
          onClick={onTap}
          aria-label="Game tools"
          aria-expanded={isOpen}
          className="pointer-events-auto absolute right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] w-14 h-14 rounded-full bg-[#842AEB] text-white shadow-lg shadow-black/20 flex items-center justify-center active:scale-[0.92] transition-transform"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="wrench"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ToolCase className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
