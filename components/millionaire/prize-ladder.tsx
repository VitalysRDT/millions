"use client";

import { TIERS_EUR, SAFETY_TIER_INDEXES } from "@/lib/games/millionaire/constants";

function fmtSimple(n: number): string {
  if (n >= 1_000_000) return "1 000 000 €";
  if (n >= 1_000) return `${(n / 1000).toLocaleString("fr-FR")} 000 €`;
  return `${n} €`;
}

export function PrizeLadder({ currentTier }: { currentTier: number }) {
  return (
    <div className="sticky self-start" style={{ top: 88 }}>
      <div className="surface p-3.5">
        <div className="eyebrow text-center mb-3" style={{ color: "var(--accent)" }}>
          Tableau des gains
        </div>
        <div className="flex flex-col gap-0.5">
          {[...TIERS_EUR]
            .map((_, i) => i)
            .reverse()
            .map((i) => {
              const n = i + 1;
              const amt = TIERS_EUR[i];
              const isWon = currentTier >= n;
              const isCurrent = currentTier + 1 === n;
              const isSafety = SAFETY_TIER_INDEXES.includes(i);

              let bg = "transparent";
              let color: string = "var(--fg-3)";
              let fontWeight = 500;
              let border = "1px solid transparent";

              if (isCurrent) {
                bg = "linear-gradient(180deg, var(--accent), oklch(68% 0.14 var(--accent-h)))";
                color = "var(--ink-0)";
                fontWeight = 700;
              } else if (isWon) {
                bg = "var(--accent-soft)";
                color = "var(--accent)";
                fontWeight = 500;
              } else if (isSafety) {
                color = "var(--fg-0)";
                fontWeight = 700;
                border = "1px solid var(--accent-edge)";
              }

              return (
                <div
                  key={n}
                  className="flex items-center justify-between relative transition-all"
                  style={{
                    padding: "9px 14px",
                    borderRadius: 8,
                    background: bg,
                    color,
                    fontWeight,
                    fontSize: 13,
                    border,
                    animation: isCurrent ? "pulse-accent 1.6s ease-in-out infinite" : "none",
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: 10, opacity: 0.6, width: 20 }}
                  >
                    {String(n).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ff-display)",
                      fontSize: 16,
                      flex: 1,
                      textAlign: "right",
                      paddingRight: isSafety ? 16 : 0,
                    }}
                  >
                    {fmtSimple(amt)}
                  </span>
                  {isSafety && !isCurrent && (
                    <span
                      className="absolute"
                      style={{
                        right: 8,
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        background: "var(--accent)",
                      }}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
