"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar } from "@/components/common/avatar";
import { LogOut } from "lucide-react";
import { postJson } from "@/lib/utils/fetcher";

export function SiteHeader() {
  const { user, isAuthed } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const logout = async () => {
    await postJson("/api/auth/logout", {});
    router.push("/login");
    router.refresh();
  };

  const tabs = [
    { id: "landing", label: "Accueil", href: "/" },
    { id: "play", label: "Jouer", href: "/play" },
    { id: "leaderboard", label: "Classement", href: "/leaderboard" },
  ];

  const currentTab =
    pathname === "/"
      ? "landing"
      : pathname.startsWith("/leaderboard")
        ? "leaderboard"
        : pathname.startsWith("/play") ||
            pathname.startsWith("/me")
          ? "play"
          : null;

  return (
    <nav
      className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-7 py-3 sm:py-3.5"
      style={{
        borderBottom: "1px solid oklch(22% 0.03 270 / 0.5)",
        background: "oklch(10% 0.02 280 / 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 display text-lg sm:text-xl"
        style={{ letterSpacing: "0.01em" }}
      >
        <span
          aria-hidden
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{
            background: "var(--accent)",
            boxShadow: "0 0 12px var(--accent-glow)",
          }}
        />
        <span>Millions</span>
      </Link>

      <div
        className="hidden sm:flex gap-1 p-1 rounded-[10px]"
        style={{
          background: "var(--ink-1)",
          border: "1px solid var(--ink-3)",
        }}
      >
        {tabs.map((t) => {
          const selected = currentTab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              aria-selected={selected}
              className="px-3.5 py-2 rounded-[7px] text-[13px] font-medium transition-colors"
              style={{
                letterSpacing: "0.01em",
                color: selected ? "var(--accent)" : "var(--fg-2)",
                background: selected ? "var(--accent-soft)" : "transparent",
                boxShadow: selected ? "inset 0 0 0 1px var(--accent-edge)" : "none",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isAuthed && user ? (
          <>
            <Link
              href="/me"
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl transition"
              style={{
                background: "var(--ink-1)",
                border: "1px solid var(--ink-3)",
              }}
            >
              <Avatar seed={user.avatarSeed} pseudo={user.pseudo} size={24} />
              <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate" style={{ color: "var(--fg-1)" }}>
                {user.pseudo}
              </span>
            </Link>
            <button
              onClick={logout}
              aria-label="Déconnexion"
              className="p-2 rounded-lg transition"
              style={{ color: "var(--fg-2)" }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary text-xs sm:text-sm">
            Se connecter
          </Link>
        )}
      </div>
    </nav>
  );
}
