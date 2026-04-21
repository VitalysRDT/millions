"use client";

import { motion } from "framer-motion";
import type { LobbyState } from "@/lib/games/shared/types";
import { TIERS_EUR } from "@/lib/games/millionaire/constants";
import { Avatar } from "@/components/common/avatar";
import Link from "next/link";

function fmt(n: number): string {
  if (n >= 1_000_000) return "1 000 000 €";
  if (n >= 1_000) return `${(n / 1000).toLocaleString("fr-FR")} 000 €`;
  return `${n} €`;
}

export function FinalScreen({ state }: { state: LobbyState }) {
  const m = state.millionaire!;
  const sorted = [...m.playerStates].sort((a, b) => {
    const aPrize = a.alive ? TIERS_EUR[a.currentTier - 1] ?? 0 : a.finalPrizeEur ?? 0;
    const bPrize = b.alive ? TIERS_EUR[b.currentTier - 1] ?? 0 : b.finalPrizeEur ?? 0;
    return bPrize - aPrize;
  });
  const winner = state.players.find((p) => p.userId === m.winnerUserId);
  const winnerState = winner
    ? m.playerStates.find((p) => p.userId === winner.userId)
    : undefined;
  const winnerPrize = winnerState
    ? winnerState.alive
      ? TIERS_EUR[winnerState.currentTier - 1] ?? 0
      : winnerState.finalPrizeEur ?? 0
    : 0;

  return (
    <div className="screen min-h-[80vh] flex items-center justify-center px-5 sm:px-7 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[780px] text-center"
      >
        <div className="eyebrow mb-4">Résultat</div>
        <div
          className="display m-0"
          style={{ fontSize: "clamp(48px, 10vw, 96px)", lineHeight: 1 }}
        >
          {winner ? (
            <span className="shine">Millionnaire</span>
          ) : (
            <span style={{ color: "var(--fg-2)" }}>Partie terminée</span>
          )}
        </div>
        <div
          className="display muted mt-2 mb-10 italic"
          style={{ fontSize: 22 }}
        >
          {winner ? (
            <>
              <strong style={{ color: "var(--fg-0)", fontStyle: "normal", fontWeight: 600 }}>
                {winner.pseudo}
              </strong>{" "}
              remporte <span className="mono" style={{ color: "var(--accent)" }}>{fmt(winnerPrize)}</span>
            </>
          ) : (
            "La flotte est à quai."
          )}
        </div>

        <div className="surface p-6 sm:p-7 mb-10 text-left">
          <div className="eyebrow mb-4">Classement de la partie</div>
          <div className="flex flex-col gap-1.5">
            {sorted.map((ps, i) => {
              const meta = state.players.find((p) => p.userId === ps.userId);
              if (!meta) return null;
              const prize = ps.alive
                ? TIERS_EUR[ps.currentTier - 1] ?? 0
                : ps.finalPrizeEur ?? 0;
              const isYou = winner?.userId === ps.userId && i === 0;
              return (
                <div
                  key={ps.userId}
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-[10px]"
                  style={{
                    background: isYou ? "var(--accent-soft)" : "transparent",
                    border: `1px solid ${isYou ? "var(--accent-edge)" : "transparent"}`,
                  }}
                >
                  <div
                    className="mono"
                    style={{ width: 24, color: "var(--fg-3)", fontSize: 12 }}
                  >
                    #{i + 1}
                  </div>
                  <Avatar seed={meta.avatarSeed} pseudo={meta.pseudo} size={28} />
                  <div
                    className="flex-1 text-sm truncate"
                    style={{ fontWeight: isYou ? 700 : 500 }}
                  >
                    {meta.pseudo}
                  </div>
                  <div
                    className="mono text-[13px]"
                    style={{ color: isYou ? "var(--accent)" : "var(--fg-1)" }}
                  >
                    T{ps.currentTier} · {fmt(prize)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/play" className="btn btn-primary">
            Rejouer
          </Link>
          <Link href="/" className="btn">
            Retour au hub
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
