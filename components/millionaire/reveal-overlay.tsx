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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center px-4"
      >
        <span
          className="absolute inset-0"
          style={{
            background: "oklch(10% 0.02 280 / 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />
        <motion.div
          initial={{ scale: 0.8, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="surface relative flex items-center gap-5 px-10 py-7 md:px-14 md:py-8"
          style={{
            borderColor: color,
            boxShadow: `0 0 60px ${ok ? "oklch(72% 0.18 150 / 0.35)" : "oklch(65% 0.22 25 / 0.35)"}`,
          }}
        >
          <span
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: 72,
              height: 72,
              background: ok ? "oklch(72% 0.18 150 / 0.25)" : "oklch(65% 0.22 25 / 0.25)",
              color,
            }}
          >
            {ok ? (
              <Check className="w-10 h-10 stroke-[3]" />
            ) : (
              <X className="w-10 h-10 stroke-[3]" />
            )}
          </span>
          <div>
            <p
              className="text-xs uppercase mb-1"
              style={{
                letterSpacing: "0.25em",
                color: "var(--fg-2)",
              }}
            >
              Question {m.lastReveal.round} / 15
            </p>
            <p
              className="display"
              style={{
                fontSize: "clamp(28px, 4.5vw, 44px)",
                lineHeight: 1,
                color,
              }}
            >
              {ok ? "Bonne réponse !" : "Mauvaise réponse"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
