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
        <section className="relative pt-16 sm:pt-20 md:pt-28 pb-16 sm:pb-24 md:pb-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] sm:text-xs font-medium tracking-wider uppercase mb-6 sm:mb-8"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Le jeu qui change tout
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-display text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[0.95]"
            >
              <span className="text-gold-gradient">Millions</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-4 sm:mt-6 text-base sm:text-xl text-white/60 max-w-2xl mx-auto px-2"
            >
              Affronte tes amis sur deux jeux légendaires. Lobbies en temps réel,
              questions à gogo, suspense maximal.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <Link href="/play" className="btn-gold text-base sm:text-lg w-full sm:w-auto">
                Lancer une partie
              </Link>
              <Link href="/leaderboard" className="btn-ghost w-full sm:w-auto">
                <Trophy className="w-4 h-4" />
                Classement
              </Link>
            </motion.div>
          </div>

          <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-royal/40 rounded-full blur-[120px] pointer-events-none" />
        </section>

        {/* GAMES */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-24 relative z-10">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-5 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/play" className="group block">
                <div className="relative h-full surface-elevated rounded-2xl sm:rounded-3xl p-6 sm:p-10 overflow-hidden hover:border-gold/40 transition-all duration-500">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold/20 rounded-full blur-3xl group-hover:bg-gold/30 transition-all" />
                  <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-gold mb-4 sm:mb-6 relative" />
                  <h3 className="text-display text-2xl sm:text-3xl font-bold mb-3 relative">
                    Qui veut gagner des millions
                  </h3>
                  <p className="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base relative">
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
                <div className="relative h-full surface-elevated rounded-2xl sm:rounded-3xl p-6 sm:p-10 overflow-hidden hover:border-gold/40 transition-all duration-500">
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-royal/40 rounded-full blur-3xl group-hover:bg-royal/60 transition-all" />
                  <Anchor className="w-10 h-10 sm:w-12 sm:h-12 text-gold mb-4 sm:mb-6 relative" />
                  <h3 className="text-display text-2xl sm:text-3xl font-bold mb-3 relative">
                    Bataille navale à questions
                  </h3>
                  <p className="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base relative">
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
