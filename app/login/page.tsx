"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
      await postJson<LoginResponse>("/api/auth/login", { pseudo: pseudo.trim() });
      router.push("/play");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/" className="text-display text-5xl text-gold-gradient font-bold tracking-tight">
            Millions
          </Link>
          <p className="mt-3 text-white/50 text-sm tracking-wide uppercase">
            Choisis ton pseudo pour entrer
          </p>
        </div>

        <form onSubmit={submit} className="surface-elevated rounded-3xl p-8 space-y-5">
          <label className="block">
            <span className="text-white/60 text-xs uppercase tracking-widest mb-2 block">Pseudo</span>
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
            <p className="text-danger text-sm text-center">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-gold w-full text-base py-4">
            {loading ? "Connexion..." : "Entrer dans le jeu"}
          </button>
          <p className="text-center text-white/30 text-xs">
            Pas de mot de passe. Ton pseudo + un cookie suffisent.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
