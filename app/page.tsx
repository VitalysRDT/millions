"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <div className="screen max-w-[1280px] mx-auto px-5 sm:px-7 pt-14 sm:pt-[72px] pb-24 sm:pb-[120px]">
        {/* HERO */}
        <div className="relative text-center pt-6 sm:pt-10">
          <div className="chip accent mb-6 sm:mb-7">
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-[3px]"
              style={{
                background: "var(--accent)",
                boxShadow: "0 0 8px var(--accent-glow)",
              }}
            />
            Temps réel · 2—8 joueurs
          </div>
          <h1
            className="display m-0"
            style={{
              fontSize: "clamp(64px, 14vw, 136px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            <span className="shine">Millions</span>
          </h1>
          <p
            className="mx-auto max-w-[560px] text-base sm:text-lg leading-relaxed mt-6 sm:mt-7 px-2"
            style={{ color: "var(--fg-1)" }}
          >
            Deux jeux de plateau classiques, un seul code de partie. Affronte tes amis sur le quiz à paliers, ou duelle-les en bataille navale où chaque tir se gagne à la question.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-3.5 mt-8 sm:mt-9">
            <Link href="/play" className="btn btn-primary" style={{ padding: "16px 28px", fontSize: 15 }}>
              Lancer une partie  →
            </Link>
            <Link href="/leaderboard" className="btn btn-ghost" style={{ padding: "16px 28px", fontSize: 15 }}>
              Voir le classement
            </Link>
          </div>

          <div
            className="absolute left-0 right-0 -z-10 pointer-events-none"
            style={{
              top: -80,
              bottom: -40,
              background:
                "radial-gradient(500px 180px at 50% 50%, var(--accent-soft), transparent 70%)",
              filter: "blur(10px)",
            }}
          />
        </div>

        {/* TWO GAMES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-16 sm:mt-[88px]">
          <GameCard
            index="01"
            title="Qui veut gagner des Millions"
            sub="Battle royale 2—8"
            description="15 paliers, 1 000 000 € à la clé. Chaque joueur répond en parallèle sur sa propre question. Rate un palier non-certain et tu es éliminé."
            stats={[
              ["Joueurs", "2–8"],
              ["Durée", "~12 min"],
              ["Jokers", "4"],
            ]}
            href="/play"
            accentVar="var(--accent)"
          />
          <GameCard
            index="02"
            title="Bataille navale à questions"
            sub="Duel 1 vs 1"
            description="Chaque tir doit être déverrouillé par une bonne réponse. Plus la question est dure, plus ta salve est large — croix ou zone."
            stats={[
              ["Joueurs", "1v1"],
              ["Grille", "10×10"],
              ["Salves", "3 types"],
            ]}
            href="/play"
            accentVar="var(--cool)"
          />
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-20 sm:mt-[100px]">
          <div className="eyebrow text-center mb-2">Le protocole</div>
          <h2 className="display text-center m-0 mb-10 sm:mb-12" style={{ fontSize: "clamp(28px, 5vw, 42px)" }}>
            Invite, joue, gagne — en trois pas.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              { n: "I", t: "Crée ton lobby", d: "Un pseudo, un code à 6 lettres. Partage-le sur n'importe quel canal." },
              { n: "II", t: "Attends tes amis", d: "Ils rejoignent avec le code. Tout le monde clique sur Prêt, l'hôte lance." },
              { n: "III", t: "Vise les millions", d: "Questions synchronisées, polling 1s, jokers à distance. Tout est en Redis." },
            ].map((step) => (
              <div key={step.n} className="surface p-7">
                <div
                  className="display leading-none mb-4 opacity-80"
                  style={{ fontSize: 56, color: "var(--accent)" }}
                >
                  {step.n}
                </div>
                <div className="text-[17px] font-semibold mb-2">{step.t}</div>
                <div className="muted text-[14px] leading-relaxed">{step.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function GameCard({
  index,
  title,
  sub,
  description,
  stats,
  href,
  accentVar,
}: {
  index: string;
  title: string;
  sub: string;
  description: string;
  stats: [string, string][];
  href: string;
  accentVar: string;
}) {
  return (
    <Link
      href={href}
      className="surface group p-9 relative overflow-hidden cursor-pointer transition-all block"
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-edge)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
    >
      <div
        aria-hidden
        className="absolute pointer-events-none rounded-full"
        style={{
          top: -80,
          right: -80,
          width: 260,
          height: 260,
          background: `radial-gradient(circle, ${accentVar} 0%, transparent 60%)`,
          opacity: 0.16,
          filter: "blur(40px)",
        }}
      />
      <div className="flex justify-between items-start mb-7">
        <div
          className="mono text-[11px]"
          style={{ color: "var(--fg-3)", letterSpacing: "0.2em" }}
        >
          {index} / 02
        </div>
        <div className="chip">{sub}</div>
      </div>
      <h3 className="display text-[28px] sm:text-[34px] leading-[1.1] m-0 mb-3.5">{title}</h3>
      <p className="muted text-sm leading-relaxed mb-7">{description}</p>
      <div
        className="flex gap-6 pt-5"
        style={{ borderTop: "1px solid var(--ink-3)" }}
      >
        {stats.map(([k, v]) => (
          <div key={k}>
            <div className="eyebrow mb-1" style={{ fontSize: 10 }}>{k}</div>
            <div className="display text-[17px]">{v}</div>
          </div>
        ))}
      </div>
    </Link>
  );
}
