"use client";

const LETTERS = ["A", "B", "C", "D"] as const;

export type AnswerState = "idle" | "selected" | "locked" | "correct" | "wrong" | "hidden";

export function AnswerButton({
  index,
  text,
  state,
  onClick,
  disabled,
}: {
  index: 0 | 1 | 2 | 3;
  text: string;
  state: AnswerState;
  shape?: "left" | "right";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const isHidden = state === "hidden";
  const isInteractive = state === "idle" && !disabled && !isHidden;
  const locking = state === "selected";
  const isCorrect = state === "correct";
  const isWrongChosen = state === "wrong";

  let bg = "var(--ink-2)";
  let border = "var(--ink-3)";
  let color = "var(--fg-0)";

  if (isHidden) {
    bg = "transparent";
    border = "var(--ink-3)";
    color = "var(--fg-3)";
  } else if (isCorrect) {
    bg = "var(--good)";
    border = "var(--good)";
    color = "var(--ink-0)";
  } else if (isWrongChosen) {
    bg = "var(--bad)";
    border = "var(--bad)";
    color = "var(--fg-0)";
  } else if (locking) {
    bg = "var(--accent-soft)";
    border = "var(--accent)";
    color = "var(--accent)";
  } else if (state === "locked") {
    bg = "var(--ink-3)";
    color = "var(--fg-2)";
  }

  const shadow = isCorrect
    ? "0 0 32px oklch(72% 0.2 150 / 0.5)"
    : isWrongChosen
      ? "0 0 32px oklch(65% 0.22 25 / 0.4)"
      : "none";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isHidden || state === "locked" || isCorrect || isWrongChosen}
      className="relative w-full flex items-center gap-3 text-left overflow-hidden"
      style={{
        appearance: "none",
        cursor: isInteractive ? "pointer" : "default",
        background: bg,
        border: `1.5px solid ${border}`,
        color,
        padding: "16px 18px",
        borderRadius: 12,
        fontFamily: "var(--ff-ui)",
        fontSize: 15,
        fontWeight: 500,
        transition: "all 0.25s",
        opacity: isHidden ? 0.3 : 1,
        textDecoration: isHidden ? "line-through" : "none",
        animation: locking ? "pulse-accent 0.9s ease-in-out infinite" : "none",
        boxShadow: shadow,
      }}
    >
      <span
        className="flex items-center justify-center flex-shrink-0 rounded-full font-bold"
        style={{
          width: 28,
          height: 28,
          background:
            isCorrect || isWrongChosen || locking
              ? "oklch(100% 0 0 / 0.2)"
              : "var(--ink-0)",
          border: "1px solid currentColor",
          fontSize: 12,
        }}
      >
        {LETTERS[index]}
      </span>
      <span className="flex-1">{text}</span>
    </button>
  );
}
