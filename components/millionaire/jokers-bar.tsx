"use client";

import type { Joker } from "@/lib/games/millionaire/constants";

const JOKERS: { id: Joker; glyph: string; label: string }[] = [
  { id: "fifty", glyph: "50", label: "50:50" },
  { id: "public", glyph: "◊◊", label: "Public" },
  { id: "phone", glyph: "☏", label: "Ami" },
  { id: "switch", glyph: "↻", label: "Switch" },
];

export function JokersBar({
  remaining,
  onUse,
  disabled,
}: {
  remaining: Joker[];
  onUse: (j: Joker) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-center gap-3 sm:gap-3.5 flex-wrap">
      {JOKERS.map((j) => {
        const used = !remaining.includes(j.id);
        const enabled = !used && !disabled;
        return (
          <button
            key={j.id}
            onClick={() => onUse(j.id)}
            disabled={!enabled}
            className="relative flex flex-col items-center justify-center overflow-hidden transition-all"
            style={{
              appearance: "none",
              cursor: enabled ? "pointer" : "default",
              width: 108,
              height: 96,
              borderRadius: 14,
              background: used ? "transparent" : "linear-gradient(180deg, var(--accent-soft), transparent)",
              border: `1.5px solid ${used ? "var(--ink-3)" : "var(--accent-edge)"}`,
              color: used ? "var(--fg-3)" : "var(--accent)",
              opacity: enabled ? 1 : used ? 0.35 : 0.6,
              fontFamily: "var(--ff-ui)",
              gap: 6,
            }}
          >
            <div className="display" style={{ fontSize: 28, lineHeight: 1 }}>
              {j.glyph}
            </div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {j.label}
            </div>
            {used && (
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, transparent 0 6px, oklch(100% 0 0 / 0.04) 6px 7px)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
