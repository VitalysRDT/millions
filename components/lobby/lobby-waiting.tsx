"use client";

import { useState } from "react";
import type { LobbyState } from "@/lib/games/shared/types";
import { Avatar } from "@/components/common/avatar";
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

  const gridCols =
    state.maxPlayers <= 2
      ? "grid-cols-1 sm:grid-cols-2"
      : state.maxPlayers <= 4
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className="screen max-w-[900px] mx-auto px-5 sm:px-7 py-12 pb-28">
      <button onClick={leave} disabled={busy} className="btn btn-ghost mb-8">
        ← Retour
      </button>

      {/* GAME TYPE */}
      <div className="flex justify-center mb-8">
        <div className="chip accent">
          {state.gameType === "millionaire"
            ? "Qui veut gagner des Millions · 2—8"
            : "Bataille navale à questions · 1v1"}
        </div>
      </div>

      {/* CODE */}
      <div className="surface relative overflow-hidden text-center p-10 mb-6">
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 300,
            height: 200,
            background: "radial-gradient(ellipse, var(--accent-soft), transparent 70%)",
          }}
        />
        <div className="eyebrow mb-4 relative">Code de la partie</div>
        <button
          onClick={copy}
          className="flex items-center gap-4 mx-auto relative"
          style={{ appearance: "none", border: 0, background: "transparent", cursor: "pointer", padding: 0 }}
        >
          <div
            className="mono shine"
            style={{ fontSize: "clamp(42px, 10vw, 72px)", letterSpacing: "0.2em", fontWeight: 700, lineHeight: 1 }}
          >
            {state.code}
          </div>
          <div
            className="px-2.5 py-2 rounded-lg font-semibold"
            style={{
              background: "var(--ink-2)",
              border: "1px solid var(--ink-3)",
              color: copied ? "var(--good)" : "var(--fg-1)",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {copied ? "Copié ✓" : "Copier"}
          </div>
        </button>
        <div className="muted mt-3.5 text-sm">
          Partage ce code avec tes amis. La partie démarre quand tout le monde est prêt.
        </div>
      </div>

      {/* PLAYERS */}
      <div className="surface p-7 mb-6">
        <div className="flex justify-between items-center mb-5">
          <div className="eyebrow">
            Joueurs · {state.players.length}/{state.maxPlayers}
          </div>
          <div className="mono text-[11px]" style={{ color: "var(--fg-3)" }}>
            {allReady ? "TOUS PRÊTS" : "EN ATTENTE"}
          </div>
        </div>
        <div className={`grid ${gridCols} gap-2.5`}>
          {slots.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3.5 py-3.5 rounded-xl transition-all"
              style={{
                background: p ? "var(--ink-2)" : "transparent",
                border: `1px ${p ? "solid" : "dashed"} ${p?.isReady ? "var(--accent-edge)" : "var(--ink-3)"}`,
                minHeight: 60,
              }}
            >
              {p ? (
                <>
                  <Avatar seed={p.avatarSeed} pseudo={p.pseudo} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span className="truncate">{p.pseudo}</span>
                      {state.hostUserId === p.userId && (
                        <span title="Hôte" style={{ color: "var(--accent)", fontSize: 10 }}>★</span>
                      )}
                    </div>
                    <div
                      className="text-[11px] uppercase"
                      style={{
                        letterSpacing: "0.1em",
                        color: p.isReady ? "var(--good)" : "var(--fg-3)",
                      }}
                    >
                      {p.isReady ? "Prêt" : "Attente"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="muted text-[12px] italic mx-auto">Slot libre</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button onClick={toggleReady} disabled={busy} className="btn flex-1">
          {me?.isReady ? "Annuler prêt" : "Je suis prêt"}
        </button>
        {isHost && (
          <button
            onClick={start}
            disabled={busy || !allReady}
            className="btn btn-primary"
            style={{ flex: 2 }}
            title={!allReady ? "En attente que tous soient prêts" : "Démarrer"}
          >
            ▶ Démarrer la partie
          </button>
        )}
      </div>

      {!allReady && state.players.length >= 2 && (
        <p className="text-xs text-center mt-4" style={{ color: "var(--fg-3)" }}>
          En attente que tous les joueurs soient prêts…
        </p>
      )}
      {state.players.length < 2 && (
        <p className="text-xs text-center mt-4" style={{ color: "var(--fg-3)" }}>
          Il faut au moins 2 joueurs pour démarrer.
        </p>
      )}
    </div>
  );
}
