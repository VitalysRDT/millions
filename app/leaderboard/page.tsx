"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar } from "@/components/common/avatar";

interface Entry {
  userId: string;
  pseudo: string;
  avatarSeed: string;
  score: number;
  endedAt: string;
}

export default function LeaderboardPage() {
  const { data, isLoading } = useSWR<{ entries: Entry[] }>(
    "/api/leaderboard/millionaire?limit=100",
  );
  return (
    <>
      <SiteHeader />
      <main className="screen max-w-[900px] mx-auto px-5 sm:px-7 py-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="eyebrow mb-3">Tableau des champions</div>
          <h1
            className="display m-0"
            style={{ fontSize: "clamp(38px, 8vw, 64px)", lineHeight: 1 }}
          >
            <span className="shine">Classement</span>
          </h1>
          <p className="muted text-sm mt-3">
            Les meilleurs gains au Millionnaire.
          </p>
        </motion.div>

        <div className="surface p-5 sm:p-6">
          {isLoading && (
            <p className="text-center py-12" style={{ color: "var(--fg-3)" }}>
              Chargement…
            </p>
          )}
          {data?.entries.length === 0 && (
            <p className="text-center py-12" style={{ color: "var(--fg-3)" }}>
              Aucune partie terminée pour le moment.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            {data?.entries.map((e, i) => {
              const podium = i < 3;
              return (
                <motion.div
                  key={`${e.userId}-${e.endedAt}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-[10px]"
                  style={{
                    background: podium ? "var(--accent-soft)" : "transparent",
                    border: `1px solid ${podium ? "var(--accent-edge)" : "transparent"}`,
                  }}
                >
                  <div
                    className="mono text-center"
                    style={{
                      width: 28,
                      color:
                        i === 0
                          ? "var(--accent)"
                          : podium
                            ? "var(--fg-1)"
                            : "var(--fg-3)",
                      fontWeight: i === 0 ? 700 : 500,
                      fontSize: i === 0 ? 16 : 13,
                    }}
                  >
                    #{i + 1}
                  </div>
                  <Avatar seed={e.avatarSeed} pseudo={e.pseudo} size={28} />
                  <span
                    className="flex-1 text-sm truncate"
                    style={{
                      color: "var(--fg-0)",
                      fontWeight: podium ? 600 : 500,
                    }}
                  >
                    {e.pseudo}
                  </span>
                  <span
                    className="mono text-sm flex-shrink-0"
                    style={{ color: podium ? "var(--accent)" : "var(--fg-1)" }}
                  >
                    {e.score.toLocaleString("fr-FR")} €
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
