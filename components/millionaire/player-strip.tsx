"use client";

import type { LobbyState, MillionairePlayerStateLite } from "@/lib/games/shared/types";
import { Avatar } from "@/components/common/avatar";
import { TIERS_EUR } from "@/lib/games/millionaire/constants";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function PlayerStrip({
  state,
  myUserId,
}: {
  state: LobbyState;
  myUserId: string;
}) {
  const m = state.millionaire!;

  const renderPlayer = (ps: MillionairePlayerStateLite) => {
    const meta = state.players.find((x) => x.userId === ps.userId);
    if (!meta) return null;
    const me = ps.userId === myUserId;
    const tierEur = ps.currentTier > 0 ? TIERS_EUR[ps.currentTier - 1] : 0;
    const fmt =
      tierEur >= 1_000_000
        ? "1 M €"
        : tierEur >= 1000
          ? `${(tierEur / 1000).toLocaleString("fr-FR")} 000 €`
          : `${tierEur} €`;
    return (
      <motion.div
        key={ps.userId}
        layout
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all",
          me
            ? "border-gold/50 bg-gradient-to-br from-gold/15 to-gold/5 shadow-gold-soft"
            : "border-bg-border bg-bg-card/80",
          !ps.alive && "opacity-50 grayscale",
        )}
      >
        <Avatar seed={meta.avatarSeed} pseudo={meta.pseudo} size={36} />
        <div className="min-w-0 pr-1">
          <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
            {meta.pseudo}
            {me && <span className="text-gold text-[10px] uppercase">toi</span>}
          </div>
          <div className="text-xs font-mono text-gold/80">{fmt}</div>
        </div>
        {ps.alive && m.roundState === "answering" && (
          <span className="ml-1">
            {ps.hasAnswered ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <span className="block w-2.5 h-2.5 rounded-full bg-gold animate-pulse-gold" />
            )}
          </span>
        )}
        {!ps.alive && <X className="w-5 h-5 text-danger ml-1" />}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {m.playerStates.map((ps) => renderPlayer(ps))}
    </div>
  );
}
