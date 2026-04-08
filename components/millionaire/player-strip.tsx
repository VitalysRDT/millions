"use client";

import type { LobbyState, MillionairePlayerStateLite } from "@/lib/games/shared/types";
import { Avatar } from "@/components/common/avatar";
import { TIERS_EUR } from "@/lib/games/millionaire/constants";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export function PlayerStrip({
  state,
  myUserId,
}: {
  state: LobbyState;
  myUserId: string;
}) {
  const m = state.millionaire!;
  const playerSummary = (ps: MillionairePlayerStateLite) => {
    const meta = state.players.find((x) => x.userId === ps.userId);
    if (!meta) return null;
    const me = ps.userId === myUserId;
    const tierEur = ps.currentTier > 0 ? TIERS_EUR[ps.currentTier - 1] : 0;
    return (
      <motion.div
        key={ps.userId}
        layout
        className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
          me ? "border-gold/40 bg-gold/5" : "border-bg-border bg-bg-card/60"
        } ${!ps.alive ? "opacity-50 grayscale" : ""}`}
      >
        <Avatar seed={meta.avatarSeed} pseudo={meta.pseudo} size={32} />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
            {meta.pseudo}
            {me && <span className="text-gold text-[10px]">• toi</span>}
          </div>
          <div className="text-[10px] font-mono text-white/50">
            {tierEur >= 1000 ? `${(tierEur / 1000).toLocaleString("fr-FR")} 000 €` : `${tierEur} €`}
          </div>
        </div>
        {ps.alive && m.roundState === "answering" && (
          <span className="ml-auto">
            {ps.hasAnswered ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse-gold" />
            )}
          </span>
        )}
        {!ps.alive && <X className="w-4 h-4 text-danger ml-auto" />}
      </motion.div>
    );
  };
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {m.playerStates.map((ps) => playerSummary(ps))}
    </div>
  );
}
