"use client";

import { Percent, Users, Phone, RefreshCw, type LucideIcon } from "lucide-react";
import type { Joker } from "@/lib/games/millionaire/constants";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const JOKERS: { id: Joker; icon: LucideIcon; label: string }[] = [
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
    <div className="flex items-center justify-center gap-4 md:gap-5">
      {JOKERS.map(({ id, icon: Icon, label }) => {
        const used = !remaining.includes(id);
        const enabled = !used && !disabled;
        return (
          <motion.button
            key={id}
            onClick={() => onUse(id)}
            disabled={used || disabled}
            whileHover={enabled ? { scale: 1.08, y: -3 } : {}}
            whileTap={enabled ? { scale: 0.96 } : {}}
            className={cn(
              "relative group flex flex-col items-center justify-center gap-1.5",
              "w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-2xl border-2 transition-all",
              used
                ? "border-white/10 bg-white/[0.02] opacity-30"
                : "border-gold/40 bg-gradient-to-br from-gold/15 to-gold/5 hover:border-gold hover:shadow-gold",
            )}
          >
            {/* Halo glow on hover */}
            {enabled && (
              <span className="absolute -inset-2 rounded-3xl bg-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <Icon
              className={cn(
                "w-7 h-7 md:w-8 md:h-8 relative",
                used ? "text-white/30" : "text-gold drop-shadow-glow",
              )}
            />
            <span
              className={cn(
                "text-xs md:text-sm font-bold uppercase tracking-wider relative",
                used ? "text-white/30" : "text-gold",
              )}
            >
              {label}
            </span>
            {used && (
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-[120%] h-0.5 bg-white/40 rotate-[-15deg]" />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
