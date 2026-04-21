"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar } from "@/components/common/avatar";

interface HistoryEntry {
  id: string;
  gameType: "millionaire" | "battleship";
  isWinner: boolean;
  score: number;
  endedAt: string;
}

export default function MePage() {
  const { user, isLoading } = useCurrentUser();
  const { data: hist } = useSWR<{ entries: HistoryEntry[] }>("/api/history/me?limit=30");

  if (isLoading || !user) {
    return (
      <>
        <SiteHeader />
        <p className="p-10 text-center" style={{ color: "var(--fg-3)" }}>
          Chargement…
        </p>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="screen max-w-[900px] mx-auto px-5 sm:px-7 py-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-10"
        >
          <Avatar seed={user.avatarSeed} pseudo={user.pseudo} size={64} />
          <div className="min-w-0">
            <div className="eyebrow mb-1">Profil</div>
            <h1
              className="display m-0 truncate"
              style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 1 }}
            >
              {user.pseudo}
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 mb-10">
          <Stat label="Parties" value={user.stats.totalGames.toString()} />
          <Stat label="Victoires" value={user.stats.totalWins.toString()} />
          <Stat
            label="Meilleur gain"
            value={`${user.stats.bestScore.toLocaleString("fr-FR")} €`}
            accent
          />
        </div>

        <div className="eyebrow mb-3">Historique</div>
        <div className="surface p-4">
          {!hist?.entries.length && (
            <p className="text-center py-10" style={{ color: "var(--fg-3)" }}>
              Aucune partie pour l'instant.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            {hist?.entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm"
                style={{
                  background: "var(--ink-2)",
                  border: "1px solid var(--ink-3)",
                }}
              >
                <span
                  className="eyebrow text-[10px] flex-shrink-0"
                  style={{ width: 74 }}
                >
                  {e.gameType === "millionaire" ? "Millions" : "Bataille"}
                </span>
                <span
                  className="text-xs font-semibold flex-shrink-0"
                  style={{
                    color: e.isWinner ? "var(--good)" : "var(--fg-3)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {e.isWinner ? "Victoire" : "Défaite"}
                </span>
                <span
                  className="ml-auto mono text-sm"
                  style={{ color: "var(--accent)" }}
                >
                  {e.gameType === "millionaire"
                    ? `${e.score.toLocaleString("fr-FR")} €`
                    : ""}
                </span>
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "var(--fg-3)" }}
                >
                  {new Date(e.endedAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="surface text-center p-4 sm:p-5">
      <div className="eyebrow mb-1.5" style={{ fontSize: 10 }}>
        {label}
      </div>
      <div
        className="display truncate"
        style={{
          fontSize: "clamp(18px, 3vw, 28px)",
          color: accent ? "var(--accent)" : "var(--fg-0)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
