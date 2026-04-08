"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Anchor, Sparkles, Users, Zap, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="relative overflow-hidden">
        {/* HERO */}
        <section className="relative pt-28 pb-32 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium tracking-wider uppercase mb-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Le jeu qui change tout
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-display text-7xl md:text-8xl font-bold tracking-tight leading-[0.95]"
            >
              <span className="text-gold-gradient">Millions</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 text-xl text-white/60 max-w-2xl mx-auto"
            >
              Affronte tes amis sur deux jeux légendaires. Lobbies en temps réel,
              questions à gogo, suspense maximal.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Link href="/play" className="btn-gold text-lg">
                Lancer une partie
              </Link>
              <Link href="/leaderboard" className="btn-ghost">
                <Trophy className="w-4 h-4" />
                Classement
              </Link>
            </motion.div>
          </div>

          {/* Subtle gold orbs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-royal/40 rounded-full blur-[120px] pointer-events-none" />
        </section>

        {/* GAMES */}
        <section className="px-6 pb-24 relative z-10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/play" className="group block">
                <div className="relative h-full surface-elevated rounded-3xl p-10 overflow-hidden hover:border-gold/40 transition-all duration-500">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold/20 rounded-full blur-3xl group-hover:bg-gold/30 transition-all" />
                  <Crown className="w-12 h-12 text-gold mb-6 relative" />
                  <h3 className="text-display text-3xl font-bold mb-3 relative">
                    Qui veut gagner des millions
                  </h3>
                  <p className="text-white/60 mb-8 relative">
                    15 questions, 1 million d'euros à la clé. Mode battle royale —
                    jusqu'à 8 joueurs en parallèle, élimination en direct.
                  </p>
                  <div className="flex items-center gap-4 text-xs uppercase tracking-wider text-white/40 relative">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> 2-8 joueurs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> 30s/question
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Link href="/play" className="group block">
                <div className="relative h-full surface-elevated rounded-3xl p-10 overflow-hidden hover:border-gold/40 transition-all duration-500">
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-royal/40 rounded-full blur-3xl group-hover:bg-royal/60 transition-all" />
                  <Anchor className="w-12 h-12 text-gold mb-6 relative" />
                  <h3 className="text-display text-3xl font-bold mb-3 relative">
                    Bataille navale à questions
                  </h3>
                  <p className="text-white/60 mb-8 relative">
                    Chaque tir doit être déverrouillé par une bonne réponse. Plus la
                    question est dure, plus tu tires fort.
                  </p>
                  <div className="flex items-center gap-4 text-xs uppercase tracking-wider text-white/40 relative">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> 1v1
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Tirs en croix
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
