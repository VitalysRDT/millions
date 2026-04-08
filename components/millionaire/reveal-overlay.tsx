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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center px-4"
      >
        {/* Backdrop */}
        <span className="absolute inset-0 bg-bg-deep/50 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.5, y: -30, rotate: -3 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
          className={`relative px-12 py-8 md:px-16 md:py-10 rounded-[32px] border-2 backdrop-blur-2xl flex items-center gap-5 ${
            ok
              ? "border-success bg-success/15 text-success shadow-[0_0_80px_rgba(33,210,124,0.5)]"
              : "border-danger bg-danger/15 text-danger shadow-[0_0_80px_rgba(255,84,112,0.5)]"
          }`}
        >
          <span
            className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center ${
              ok ? "bg-success/30" : "bg-danger/30"
            }`}
          >
            {ok ? (
              <Check className="w-10 h-10 md:w-12 md:h-12 stroke-[3]" />
            ) : (
              <X className="w-10 h-10 md:w-12 md:h-12 stroke-[3]" />
            )}
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] mb-1 opacity-70">
              Question {m.lastReveal.round} / 15
            </p>
            <p className="text-display text-4xl md:text-5xl font-bold">
              {ok ? "Bonne réponse !" : "Mauvaise réponse"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
