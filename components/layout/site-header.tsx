"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar } from "@/components/common/avatar";
import { LogOut, Trophy, User2 } from "lucide-react";
import { postJson } from "@/lib/utils/fetcher";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const { user, isAuthed } = useCurrentUser();
  const router = useRouter();
  const logout = async () => {
    await postJson("/api/auth/logout", {});
    router.push("/login");
    router.refresh();
  };
  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-bg-deep/40 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-display text-2xl text-gold-gradient font-bold tracking-tight">
          Millions
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/play"
            className="text-white/70 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition"
          >
            Jouer
          </Link>
          <Link
            href="/leaderboard"
            className="text-white/70 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4" /> Classement
          </Link>
          {isAuthed && user ? (
            <>
              <Link
                href="/me"
                className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition"
              >
                <Avatar seed={user.avatarSeed} pseudo={user.pseudo} size={28} />
                <span className="text-sm font-medium text-white/90">{user.pseudo}</span>
              </Link>
              <button
                onClick={logout}
                aria-label="Déconnexion"
                className="ml-1 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-gradient text-bg-deep text-sm font-semibold"
            >
              <User2 className="w-4 h-4" /> Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
