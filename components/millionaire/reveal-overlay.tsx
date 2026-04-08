"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LobbyState } from "@/lib/games/shared/types";

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
        className="fixed inset-0 z-40 pointer-events-none flex items-start justify-center pt-32"
      >
        <motion.div
          initial={{ scale: 0.6, y: -40 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 18 }}
          className={`px-10 py-6 rounded-3xl border-2 backdrop-blur-2xl ${
            ok
              ? "border-success bg-success/20 text-success"
              : "border-danger bg-danger/20 text-danger"
          }`}
        >
          <p className="text-xs uppercase tracking-widest mb-1 opacity-80">
            Question {m.lastReveal.round}
          </p>
          <p className="text-display text-4xl font-bold">
            {ok ? "Bonne réponse !" : "Mauvaise réponse"}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
