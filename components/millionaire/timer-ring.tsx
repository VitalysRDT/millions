"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { QUESTION_TIMER_MS } from "@/lib/games/millionaire/constants";

export function TimerRing({ deadlineAt }: { deadlineAt: number }) {
  const remaining = useCountdown(deadlineAt);
  const total = QUESTION_TIMER_MS / 1000;
  const ratio = Math.max(0, Math.min(1, remaining / total));
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - ratio);
  const danger = remaining <= 5;

  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={danger ? "#ff5470" : "#f5c542"}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.2s linear, stroke 0.2s",
            filter: danger ? "drop-shadow(0 0 8px #ff5470)" : "drop-shadow(0 0 8px #f5c542)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-3xl font-bold font-mono ${danger ? "text-danger" : "text-white"}`}
        >
          {remaining}
        </span>
      </div>
    </div>
  );
}
