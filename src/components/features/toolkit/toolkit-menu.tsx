"use client";

import { motion } from "framer-motion";
import { Calculator, Hourglass, Dice5, Coins } from "lucide-react";

const tools = [
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "timer", label: "Timer", icon: Hourglass },
  { id: "dice", label: "Dice", icon: Dice5 },
  { id: "coin", label: "Coin Flip", icon: Coins },
] as const;

export type ToolId = (typeof tools)[number]["id"];

type ToolkitMenuProps = {
  onSelect: (toolId: ToolId) => void;
};

export function ToolkitMenu({ onSelect }: ToolkitMenuProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-none">
      <div className="max-w-[430px] mx-auto relative">
        <div className="absolute right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+148px)] flex flex-col-reverse gap-3 items-end">
          {tools.map((tool, index) => (
            <motion.button
              key={tool.id}
              onClick={() => onSelect(tool.id)}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 24,
                delay: index * 0.05,
              }}
              className="pointer-events-auto flex items-center gap-3"
            >
              <span className="bg-white/95 backdrop-blur-sm text-[14px] font-semibold text-gray-800 px-3.5 py-2 rounded-full shadow-md">
                {tool.label}
              </span>
              <div className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center">
                <tool.icon className="h-5 w-5 text-[#842AEB]" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
