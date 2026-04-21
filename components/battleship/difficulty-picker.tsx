"use client";

import {
  patternForDifficulty,
  patternCellCount,
  patternLabel,
} from "@/lib/games/battleship/constants";

const DIFFS = [1, 2, 3, 4, 5, 6] as const;

const labels: Record<number, string> = {
  1: "Facile",
  2: "Facile+",
  3: "Moyen",
  4: "Moyen+",
  5: "Difficile",
  6: "Expert",
};

// Mini glyph schematic of each pattern. Uses ● for the origin and ○ for extras.
const glyphs: Record<number, string> = {
  1: "●",
  2: "●●",
  3: "●●●",
  4: "⊥",
  5: "✚",
  6: "▦",
};

export function DifficultyPicker({
  onPick,
  disabled,
}: {
  onPick: (d: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="eyebrow text-center mb-5">
        Choisis la difficulté de ta question
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {DIFFS.map((d) => {
          const p = patternForDifficulty(d);
          const cells = patternCellCount(p);
          const label = patternLabel(p);
          return (
            <button
              key={d}
              onClick={() => onPick(d)}
              disabled={disabled}
              className="surface-soft text-left transition-all"
              style={{
                appearance: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                padding: 22,
                background: "var(--ink-2)",
                color: "var(--fg-0)",
                fontFamily: "var(--ff-ui)",
                opacity: disabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = "var(--accent-edge)";
                  e.currentTarget.style.background = "var(--ink-3)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.background = "var(--ink-2)";
              }}
            >
              <div
                className="display leading-none mb-3"
                style={{
                  fontSize: 40,
                  color: "var(--accent)",
                  letterSpacing: "-0.05em",
                }}
              >
                {glyphs[d]}
              </div>
              <div className="font-semibold mb-1" style={{ fontSize: 17 }}>
                Niveau {d} · {labels[d]}
              </div>
              <div className="muted text-xs">
                {label} · {cells} case{cells > 1 ? "s" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
