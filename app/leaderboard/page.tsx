"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
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
      <main className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Trophy className="w-14 h-14 text-gold mx-auto mb-4" />
            <h1 className="text-display text-5xl font-bold mb-2">
              <span className="text-gold-gradient">Classement</span>
            </h1>
            <p className="text-white/50">Les meilleurs gains au Millionnaire</p>
          </motion.div>

          <div className="surface-elevated rounded-3xl p-4">
            {isLoading && (
              <p className="text-center text-white/40 py-12">Chargement...</p>
            )}
            {data?.entries.length === 0 && (
              <p className="text-center text-white/40 py-12">
                Aucune partie terminée pour le moment.
              </p>
            )}
            <div className="space-y-1">
              {data?.entries.map((e, i) => {
                const podium = i < 3;
                return (
                  <motion.div
                    key={`${e.userId}-${e.endedAt}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl ${
                      podium
                        ? "bg-gold/10 border border-gold/30"
                        : "bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`w-8 text-center font-bold ${
                        i === 0
                          ? "text-gold text-xl"
                          : i === 1
                            ? "text-white/80 text-lg"
                            : i === 2
                              ? "text-white/60 text-lg"
                              : "text-white/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Avatar seed={e.avatarSeed} pseudo={e.pseudo} size={36} />
                    <span className="flex-1 font-medium text-white/90">{e.pseudo}</span>
                    <span className="font-mono text-gold font-semibold">
                      {e.score.toLocaleString("fr-FR")} €
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
