"use client";

import { patternForDifficulty, patternCellCount } from "@/lib/games/battleship/constants";

const DIFFS = [1, 2, 3, 4, 5, 6] as const;

const labels: Record<number, string> = {
  1: "Facile",
  2: "Facile",
  3: "Moyen",
  4: "Moyen",
  5: "Difficile",
  6: "Expert",
};

const glyphs: Record<number, string> = {
  1: "·",
  2: "·",
  3: "—",
  4: "—",
  5: "+",
  6: "■",
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
          const rewardLabel =
            cells === 1 ? "1 tir" : cells === 3 ? "Ligne 3" : "Croix 5";
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
                  fontSize: 46,
                  color: "var(--accent)",
                }}
              >
                {glyphs[d]}
              </div>
              <div className="font-semibold mb-1" style={{ fontSize: 17 }}>
                Niveau {d}
              </div>
              <div className="muted text-xs">
                {labels[d]} · {rewardLabel}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
