"use client";

import { motion } from "framer-motion";
import { useCountdown } from "@/hooks/use-countdown";
import { QUESTION_TIMER_MS } from "@/lib/games/millionaire/constants";

export function TimerRing({ deadlineAt }: { deadlineAt: number }) {
  const remaining = useCountdown(deadlineAt);
  const total = QUESTION_TIMER_MS / 1000;
  const ratio = Math.max(0, Math.min(1, remaining / total));
  // Internal SVG coordinate system — we let Tailwind w/h scale it.
  const VIEW = 144;
  const stroke = 8;
  const radius = (VIEW - stroke * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - ratio);
  const danger = remaining <= 5;
  const color = danger ? "#ff5470" : "#f5c542";

  return (
    <motion.div
      animate={danger ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 0.8, repeat: danger ? Infinity : 0 }}
      className="relative inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36"
    >
      <span
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${color}55 0%, transparent 70%)` }}
      />
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="relative -rotate-90 w-full h-full">
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={radius}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          fill="none"
        />
        <defs>
          <linearGradient id="ring-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe28a" />
            <stop offset="50%" stopColor="#f5c542" />
            <stop offset="100%" stopColor="#c8941b" />
          </linearGradient>
        </defs>
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={radius}
          stroke={danger ? color : "url(#ring-gold)"}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.25s linear, stroke 0.2s",
            filter: `drop-shadow(0 0 14px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-3xl sm:text-5xl md:text-6xl font-bold font-mono leading-none ${
            danger ? "text-danger" : "text-white"
          }`}
        >
          {remaining}
        </span>
        <span className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/40">
          secondes
        </span>
      </div>
    </motion.div>
  );
}
