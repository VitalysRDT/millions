"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Crown, LogOut, Play } from "lucide-react";
import type { LobbyState } from "@/lib/games/shared/types";
import { Avatar } from "@/components/common/avatar";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/utils/fetcher";
import { useRouter } from "next/navigation";

export function LobbyWaiting({
  state,
  currentUserId,
}: {
  state: LobbyState;
  currentUserId: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const me = state.players.find((p) => p.userId === currentUserId);
  const isHost = state.hostUserId === currentUserId;
  const allReady =
    state.players.length >= 2 && state.players.every((p) => p.isReady);

  const slots = Array.from({ length: state.maxPlayers }, (_, i) =>
    state.players.find((p) => p.slot === i),
  );

  const copy = async () => {
    await navigator.clipboard.writeText(state.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleReady = async () => {
    setBusy(true);
    try {
      await postJson(`/api/lobbies/${state.code}/ready`, { ready: !me?.isReady });
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    setBusy(true);
    try {
      await postJson(`/api/lobbies/${state.code}/start`, {});
    } catch (e) {
      alert(e instanceof Error ? e.message : "erreur");
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    try {
      await postJson(`/api/lobbies/${state.code}/leave`, {});
      router.push("/play");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
          Lobby — {state.gameType === "millionaire" ? "Qui veut gagner des millions" : "Bataille navale"}
        </p>
        <h1 className="text-display text-4xl md:text-5xl font-bold mb-6">Code de la partie</h1>

        <button
          onClick={copy}
          className="group inline-flex items-center gap-3 px-8 py-5 rounded-2xl bg-gold/10 border-2 border-gold/30 hover:border-gold/60 transition"
        >
          <span className="font-mono text-4xl font-bold tracking-[0.4em] text-gold-gradient">
            {state.code}
          </span>
          {copied ? (
            <Check className="w-5 h-5 text-success" />
          ) : (
            <Copy className="w-5 h-5 text-white/40 group-hover:text-gold transition" />
          )}
        </button>
        <p className="text-white/40 text-xs mt-3">
          {copied ? "Copié !" : "Clique pour copier et partager"}
        </p>
      </motion.div>

      <div className="surface-elevated rounded-3xl p-6 mb-6">
        <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">
          Joueurs ({state.players.length}/{state.maxPlayers})
        </h2>
        <div className="space-y-2">
          {slots.map((p, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl ${
                p ? "bg-white/[0.04]" : "bg-white/[0.01] border border-dashed border-white/10"
              }`}
            >
              {p ? (
                <>
                  <Avatar seed={p.avatarSeed} pseudo={p.pseudo} size={40} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{p.pseudo}</span>
                      {state.hostUserId === p.userId && (
                        <Crown className="w-4 h-4 text-gold" />
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full font-medium ${
                      p.isReady
                        ? "bg-success/15 text-success"
                        : "bg-white/[0.05] text-white/40"
                    }`}
                  >
                    {p.isReady ? "Prêt" : "En attente"}
                  </span>
                </>
              ) : (
                <span className="text-white/30 text-sm italic mx-auto">
                  Slot libre
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={toggleReady} disabled={busy} variant={me?.isReady ? "ghost" : "gold"} className="flex-1">
          {me?.isReady ? "Annuler prêt" : "Je suis prêt"}
        </Button>
        {isHost && (
          <Button onClick={start} disabled={busy || !allReady} variant="gold" className="flex-1">
            <Play className="w-4 h-4" />
            Démarrer la partie
          </Button>
        )}
        <Button onClick={leave} disabled={busy} variant="ghost">
          <LogOut className="w-4 h-4" />
          Quitter
        </Button>
      </div>
      {!allReady && state.players.length >= 2 && (
        <p className="text-white/30 text-xs text-center mt-4">
          En attente que tous les joueurs soient prêts...
        </p>
      )}
      {state.players.length < 2 && (
        <p className="text-white/30 text-xs text-center mt-4">
          Il faut au moins 2 joueurs pour démarrer.
        </p>
      )}
    </div>
  );
}
