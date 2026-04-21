"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { useCurrentUser } from "@/hooks/use-current-user";
import { postJson } from "@/lib/utils/fetcher";

type CreateResponse = { code: string };

export default function PlayHubPage() {
  const router = useRouter();
  const { user, isAuthed, isLoading } = useCurrentUser();
  const [creating, setCreating] = useState<"millionaire" | "battleship" | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthed) {
      router.replace("/login");
    }
  }, [isLoading, isAuthed, router]);

  if (isLoading || !isAuthed || !user) {
    return (
      <>
        <SiteHeader />
        <p className="p-10 text-center text-sm" style={{ color: "var(--fg-3)" }}>
          Chargement...
        </p>
      </>
    );
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
    const code = joinCode.trim();
    if (code.length !== 4 || !/^\d{4}$/.test(code)) return;
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
      <div className="screen max-w-[900px] mx-auto px-5 sm:px-7 py-10 sm:py-12 pb-28">
        <div className="text-center mb-10 sm:mb-12">
          <div className="eyebrow mb-2.5">Bienvenue</div>
          <h1 className="display m-0" style={{ fontSize: "clamp(34px, 7vw, 64px)", lineHeight: 1 }}>
            Salut, <span className="shine">{user.pseudo}</span>
          </h1>
          <p className="muted mt-3 text-sm sm:text-base">
            Crée une partie ou rejoins un code existant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
          <button
            onClick={() => create("millionaire")}
            disabled={creating !== null}
            className="surface text-left p-7 relative overflow-hidden transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ cursor: creating !== null ? "not-allowed" : "pointer" }}
            onMouseEnter={(e) => {
              if (creating === null) e.currentTarget.style.borderColor = "var(--accent-edge)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "";
            }}
          >
            <div
              aria-hidden
              className="absolute pointer-events-none rounded-full"
              style={{
                top: -70,
                right: -70,
                width: 220,
                height: 220,
                background: "radial-gradient(circle, var(--accent) 0%, transparent 60%)",
                opacity: 0.14,
                filter: "blur(40px)",
              }}
            />
            <div className="flex justify-between items-start mb-6">
              <div className="mono text-[11px]" style={{ color: "var(--fg-3)", letterSpacing: "0.2em" }}>
                01 / 02
              </div>
              <div className="chip">2—8 joueurs</div>
            </div>
            <h3 className="display text-[26px] sm:text-[30px] leading-[1.1] m-0 mb-3">
              Qui veut gagner des Millions
            </h3>
            <p className="muted text-sm leading-relaxed mb-6">
              Lobby battle royale 2–8 joueurs, 15 paliers, 1 M€ à la clé.
            </p>
            <div className="flex items-center gap-2" style={{ color: "var(--accent)", fontWeight: 600 }}>
              {creating === "millionaire" ? "Création…" : "Créer un lobby"}
              <span>→</span>
            </div>
          </button>

          <button
            onClick={() => create("battleship")}
            disabled={creating !== null}
            className="surface text-left p-7 relative overflow-hidden transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ cursor: creating !== null ? "not-allowed" : "pointer" }}
            onMouseEnter={(e) => {
              if (creating === null) e.currentTarget.style.borderColor = "var(--accent-edge)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "";
            }}
          >
            <div
              aria-hidden
              className="absolute pointer-events-none rounded-full"
              style={{
                top: -70,
                right: -70,
                width: 220,
                height: 220,
                background: "radial-gradient(circle, var(--cool) 0%, transparent 60%)",
                opacity: 0.14,
                filter: "blur(40px)",
              }}
            />
            <div className="flex justify-between items-start mb-6">
              <div className="mono text-[11px]" style={{ color: "var(--fg-3)", letterSpacing: "0.2em" }}>
                02 / 02
              </div>
              <div className="chip">1 vs 1</div>
            </div>
            <h3 className="display text-[26px] sm:text-[30px] leading-[1.1] m-0 mb-3">
              Bataille navale à questions
            </h3>
            <p className="muted text-sm leading-relaxed mb-6">
              Duel 1v1, chaque tir débloqué par une bonne réponse.
            </p>
            <div className="flex items-center gap-2" style={{ color: "var(--accent)", fontWeight: 600 }}>
              {creating === "battleship" ? "Création…" : "Créer un duel"}
              <span>→</span>
            </div>
          </button>
        </div>

        <div className="surface p-6 sm:p-7">
          <div className="eyebrow mb-4">Rejoindre un lobby</div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              maxLength={4}
              className="input-field flex-1"
            />
            <button
              onClick={join}
              disabled={joining || joinCode.length !== 4}
              className="btn btn-primary"
              style={{ padding: "14px 24px" }}
            >
              {joining ? "…" : "Entrer"}
            </button>
          </div>
          {error && (
            <p className="text-sm mt-4" style={{ color: "var(--bad)" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
