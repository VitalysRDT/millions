"use client";

import { motion } from "framer-motion";
import { Trophy, Home } from "lucide-react";
import type { LobbyState } from "@/lib/games/shared/types";
import { TIERS_EUR } from "@/lib/games/millionaire/constants";
import { Avatar } from "@/components/common/avatar";
import Link from "next/link";

export function FinalScreen({ state }: { state: LobbyState }) {
  const m = state.millionaire!;
  const sorted = [...m.playerStates].sort((a, b) => {
    const aPrize = a.alive ? TIERS_EUR[a.currentTier - 1] ?? 0 : a.finalPrizeEur ?? 0;
    const bPrize = b.alive ? TIERS_EUR[b.currentTier - 1] ?? 0 : b.finalPrizeEur ?? 0;
    return bPrize - aPrize;
  });
  const winner = state.players.find((p) => p.userId === m.winnerUserId);
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl text-center"
      >
        <Trophy className="w-20 h-20 text-gold mx-auto mb-6" />
        <h1 className="text-display text-5xl font-bold mb-3">
          {winner ? (
            <>
              <span className="text-gold-gradient">{winner.pseudo}</span> remporte
            </>
          ) : (
            "Partie terminée"
          )}
        </h1>
        {winner && (
          <p className="text-3xl font-mono text-gold mb-12">
            {(() => {
              const winnerState = m.playerStates.find((p) => p.userId === winner.userId);
              const prize = winnerState?.alive
                ? TIERS_EUR[winnerState.currentTier - 1] ?? 0
                : winnerState?.finalPrizeEur ?? 0;
              return `${prize.toLocaleString("fr-FR")} €`;
            })()}
          </p>
        )}

        <div className="surface-elevated rounded-3xl p-6 mb-8">
          <h3 className="text-sm uppercase tracking-widest text-white/40 mb-4">
            Classement final
          </h3>
          <div className="space-y-2">
            {sorted.map((ps, i) => {
              const meta = state.players.find((p) => p.userId === ps.userId)!;
              const prize = ps.alive
                ? TIERS_EUR[ps.currentTier - 1] ?? 0
                : ps.finalPrizeEur ?? 0;
              return (
                <div
                  key={ps.userId}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.04]"
                >
                  <span className="font-bold text-2xl text-gold w-8 text-center">
                    {i + 1}
                  </span>
                  <Avatar seed={meta.avatarSeed} pseudo={meta.pseudo} size={36} />
                  <span className="flex-1 text-left font-medium">{meta.pseudo}</span>
                  <span className="font-mono text-gold">
                    {prize.toLocaleString("fr-FR")} €
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Link href="/play" className="btn-gold inline-flex">
          <Home className="w-4 h-4" />
          Retour au hub
        </Link>
      </motion.div>
    </div>
  );
}
