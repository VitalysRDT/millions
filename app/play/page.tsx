"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Crown, Anchor, ArrowRight, KeyRound } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/utils/fetcher";

type CreateResponse = { code: string };

export default function PlayHubPage() {
  const router = useRouter();
  const { user, isAuthed, isLoading } = useCurrentUser();
  const [creating, setCreating] = useState<"millionaire" | "battleship" | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoading && !isAuthed) {
    router.replace("/login");
    return null;
  }

  const create = async (gameType: "millionaire" | "battleship") => {
    setCreating(gameType);
    setError(null);
    try {
      const res = await postJson<CreateResponse>("/api/lobbies", {
        gameType,
        maxPlayers: gameType === "battleship" ? 2 : 6,
      });
      router.push(`/play/${gameType}/${res.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(null);
    }
  };

  const join = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) return;
    setJoining(true);
    setError(null);
    try {
      const res = await postJson<{ lobby: { gameType: string } }>(
        `/api/lobbies/${code}/join`,
        {},
      );
      router.push(`/play/${res.lobby.gameType}/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code invalide");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <h1 className="text-display text-5xl md:text-6xl font-bold mb-3">
              Salut, <span className="text-gold-gradient">{user?.pseudo}</span>
            </h1>
            <p className="text-white/50">Crée une partie ou rejoins un code.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => create("millionaire")}
              disabled={creating !== null}
              className="text-left surface-elevated rounded-3xl p-8 hover:border-gold/40 transition group disabled:opacity-50"
            >
              <Crown className="w-10 h-10 text-gold mb-4" />
              <h3 className="text-display text-2xl font-bold mb-2">Qui veut gagner des millions</h3>
              <p className="text-white/50 text-sm mb-6">
                Lobby battle royale 2-8 joueurs, 15 questions, 1M€ à la clé.
              </p>
              <div className="text-gold text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                {creating === "millionaire" ? "Création..." : "Créer un lobby"}
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => create("battleship")}
              disabled={creating !== null}
              className="text-left surface-elevated rounded-3xl p-8 hover:border-gold/40 transition group disabled:opacity-50"
            >
              <Anchor className="w-10 h-10 text-gold mb-4" />
              <h3 className="text-display text-2xl font-bold mb-2">Bataille navale à questions</h3>
              <p className="text-white/50 text-sm mb-6">
                Duel 1v1, chaque tir débloqué par une bonne réponse.
              </p>
              <div className="text-gold text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                {creating === "battleship" ? "Création..." : "Créer un duel"}
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="surface-elevated rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-5 h-5 text-gold" />
              <h3 className="text-xl font-semibold">Rejoindre un lobby</h3>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="CODE 6 LETTRES"
                maxLength={6}
                className="input-field flex-1"
              />
              <Button
                onClick={join}
                disabled={joining || joinCode.length !== 6}
                size="lg"
              >
                {joining ? "..." : "Entrer"}
              </Button>
            </div>
            {error && <p className="text-danger text-sm mt-4">{error}</p>}
          </motion.div>
        </div>
      </main>
    </>
  );
}
