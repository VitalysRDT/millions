"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar } from "@/components/common/avatar";
import { Trophy, GamepadIcon, Award } from "lucide-react";

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
        <p className="p-10 text-center text-white/50">Chargement...</p>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6 mb-12"
          >
            <Avatar seed={user.avatarSeed} pseudo={user.pseudo} size={88} />
            <div>
              <h1 className="text-display text-4xl font-bold mb-1">{user.pseudo}</h1>
              <p className="text-white/50 text-sm">Joueur Millions</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 mb-12">
            <Stat icon={GamepadIcon} label="Parties" value={user.stats.totalGames.toString()} />
            <Stat icon={Award} label="Victoires" value={user.stats.totalWins.toString()} />
            <Stat
              icon={Trophy}
              label="Meilleur gain"
              value={`${user.stats.bestScore.toLocaleString("fr-FR")} €`}
            />
          </div>

          <h2 className="text-sm uppercase tracking-widest text-white/40 mb-3">
            Historique
          </h2>
          <div className="surface-elevated rounded-3xl p-4">
            {!hist?.entries.length && (
              <p className="text-center text-white/40 py-12">Aucune partie pour l'instant.</p>
            )}
            <div className="space-y-1">
              {hist?.entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03]"
                >
                  <span className="text-xs uppercase tracking-wider text-white/40 w-24">
                    {e.gameType === "millionaire" ? "Millionnaire" : "Bataille"}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      e.isWinner ? "text-success" : "text-white/40"
                    }`}
                  >
                    {e.isWinner ? "Victoire" : "Défaite"}
                  </span>
                  <span className="ml-auto font-mono text-gold">
                    {e.gameType === "millionaire"
                      ? `${e.score.toLocaleString("fr-FR")} €`
                      : ""}
                  </span>
                  <span className="text-xs text-white/30">
                    {new Date(e.endedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="surface-elevated rounded-2xl p-5 text-center">
      <Icon className="w-5 h-5 text-gold mx-auto mb-2" />
      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="font-mono font-bold text-xl text-white">{value}</p>
    </div>
  );
}
