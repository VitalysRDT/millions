"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LobbyState } from "@/lib/games/shared/types";
import { Check, X } from "lucide-react";

export function RevealOverlay({
  state,
  myUserId,
}: {
  state: LobbyState;
  myUserId: string;
}) {
  const m = state.millionaire!;
  if (m.roundState !== "revealing" || !m.lastReveal) return null;
  const myReveal = m.lastReveal.perPlayer.find((p) => p.userId === myUserId);
  const ok = myReveal?.correct ?? false;
  const color = ok ? "var(--good)" : "var(--bad)";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="fixed left-1/2 -translate-x-1/2 top-20 sm:top-24 z-40 pointer-events-none flex items-center justify-center px-4"
      >
        <div
          className="surface flex items-center gap-4 px-6 py-4 sm:px-8 sm:py-5"
          style={{
            borderColor: color,
            boxShadow: `0 0 40px ${ok ? "oklch(72% 0.18 150 / 0.35)" : "oklch(65% 0.22 25 / 0.35)"}, 0 20px 40px -10px oklch(10% 0.02 280 / 0.8)`,
            background:
              "linear-gradient(180deg, oklch(13% 0.025 275 / 0.98), oklch(12% 0.025 275 / 0.98))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <span
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: 44,
              height: 44,
              background: ok ? "oklch(72% 0.18 150 / 0.25)" : "oklch(65% 0.22 25 / 0.25)",
              color,
            }}
          >
            {ok ? (
              <Check className="w-6 h-6 stroke-[3]" />
            ) : (
              <X className="w-6 h-6 stroke-[3]" />
            )}
          </span>
          <div className="text-left">
            <p
              className="text-[10px] uppercase mb-0.5"
              style={{
                letterSpacing: "0.22em",
                color: "var(--fg-2)",
              }}
            >
              Question {m.lastReveal.round} / 15
            </p>
            <p
              className="display"
              style={{
                fontSize: "clamp(20px, 3vw, 28px)",
                lineHeight: 1,
                color,
              }}
            >
              {ok ? "Bonne réponse !" : "Mauvaise réponse"}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
