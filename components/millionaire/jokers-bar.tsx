"use client";

import { Percent, Users, Phone, RefreshCw } from "lucide-react";
import type { Joker } from "@/lib/games/millionaire/constants";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const JOKERS: { id: Joker; icon: typeof Percent; label: string }[] = [
  { id: "fifty", icon: Percent, label: "50:50" },
  { id: "public", icon: Users, label: "Public" },
  { id: "phone", icon: Phone, label: "Ami" },
  { id: "switch", icon: RefreshCw, label: "Switch" },
];

export function JokersBar({
  remaining,
  onUse,
  disabled,
}: {
  remaining: Joker[];
  onUse: (j: Joker) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      {JOKERS.map(({ id, icon: Icon, label }) => {
        const used = !remaining.includes(id);
        return (
          <motion.button
            key={id}
            onClick={() => onUse(id)}
            disabled={used || disabled}
            whileHover={!used && !disabled ? { scale: 1.06 } : {}}
            whileTap={!used && !disabled ? { scale: 0.95 } : {}}
            className={cn(
              "relative flex flex-col items-center gap-1 w-20 h-20 rounded-2xl border-2 transition-all",
              used
                ? "border-white/10 bg-white/[0.02] opacity-30"
                : "border-gold/30 bg-gold/10 hover:border-gold hover:bg-gold/20 hover:shadow-gold-soft",
            )}
          >
            <Icon className={cn("w-6 h-6", used ? "text-white/30" : "text-gold")} />
            <span className={cn("text-xs font-semibold", used ? "text-white/30" : "text-gold")}>
              {label}
            </span>
            {used && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-full h-0.5 bg-white/30 rotate-[-15deg]" />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
