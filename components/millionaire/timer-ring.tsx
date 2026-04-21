"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { QUESTION_TIMER_MS } from "@/lib/games/millionaire/constants";

export function TimerRing({
  deadlineAt,
  size = 140,
}: {
  deadlineAt: number;
  size?: number;
}) {
  const remaining = useCountdown(deadlineAt);
  const total = QUESTION_TIMER_MS / 1000;
  const pct = Math.max(0, Math.min(1, remaining / total));
  const stroke = 6;
  const r = size / 2 - stroke - 4;
  const circ = 2 * Math.PI * r;
  const danger = remaining <= 5;
  const color = danger ? "var(--bad)" : "var(--accent)";
  const glow = danger ? "var(--bad)" : "var(--accent-glow)";

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r + 4 + i * 3}
            fill="none"
            stroke="oklch(100% 0 0 / 0.05)"
            strokeWidth="1"
          />
        ))}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ink-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.95s linear, stroke 0.2s",
            filter: `drop-shadow(0 0 6px ${glow})`,
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <div
          className="display leading-none"
          style={{
            fontSize: size * 0.36,
            color: danger ? "var(--bad)" : "var(--fg-0)",
            fontFamily: "var(--ff-display)",
          }}
        >
          {Math.ceil(remaining)}
        </div>
        <div
          className="mt-1"
          style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            color: "var(--fg-3)",
          }}
        >
          SECONDES
        </div>
      </div>
    </div>
  );
}
