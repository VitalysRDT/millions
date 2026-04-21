"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { mutate } from "swr";
import { postJson } from "@/lib/utils/fetcher";
import Link from "next/link";

type LoginResponse = { userId: string; pseudo: string; avatarSeed: string };

export default function LoginPage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const me = await postJson<LoginResponse>("/api/auth/login", {
        pseudo: pseudo.trim(),
      });
      await mutate(
        "/api/auth/me",
        {
          userId: me.userId,
          pseudo: me.pseudo,
          avatarSeed: me.avatarSeed,
          stats: { totalGames: 0, totalWins: 0, bestScore: 0 },
        },
        { revalidate: true },
      );
      router.replace("/play");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link
            href="/"
            className="display inline-block"
            style={{
              fontSize: "clamp(48px, 10vw, 64px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            <span className="shine">Millions</span>
          </Link>
          <p className="eyebrow mt-4">Choisis ton pseudo pour entrer</p>
        </div>

        <form onSubmit={submit} className="surface p-7 sm:p-8 space-y-5">
          <label className="block">
            <span className="eyebrow block mb-2.5">Pseudo</span>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              maxLength={24}
              required
              minLength={3}
              autoFocus
              placeholder="WONDERPLAYER"
              className="input-field"
            />
          </label>
          {error && (
            <p className="text-sm text-center" style={{ color: "var(--bad)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
            style={{ padding: "14px 24px", justifyContent: "center" }}
          >
            {loading ? "Connexion…" : "Entrer dans le jeu"}
          </button>
          <p
            className="text-center text-xs"
            style={{ color: "var(--fg-3)" }}
          >
            Pas de mot de passe. Ton pseudo + un cookie suffisent.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
