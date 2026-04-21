"use client";

import type { LobbyState, MillionairePlayerStateLite } from "@/lib/games/shared/types";
import { Avatar } from "@/components/common/avatar";

export function PlayerStrip({
  state,
  myUserId,
}: {
  state: LobbyState;
  myUserId: string;
}) {
  const m = state.millionaire!;

  return (
    <div
      className="surface-soft flex items-center gap-2.5 overflow-x-auto p-4 w-full"
      style={{ minHeight: 60 }}
    >
      <div
        className="eyebrow whitespace-nowrap mr-2"
        style={{ flexShrink: 0 }}
      >
        En direct
      </div>
      {m.playerStates.map((ps) => renderPlayer(state, ps, myUserId, m.roundState))}
    </div>
  );
}

function renderPlayer(
  state: LobbyState,
  ps: MillionairePlayerStateLite,
  myUserId: string,
  roundState: string,
) {
  const meta = state.players.find((x) => x.userId === ps.userId);
  if (!meta) return null;
  const you = ps.userId === myUserId;
  const alive = ps.alive;
  const answered = ps.hasAnswered;
  const answering = roundState === "answering" && alive && !answered;

  return (
    <div
      key={ps.userId}
      className="flex items-center gap-2 flex-shrink-0"
      style={{
        padding: "8px 12px 8px 8px",
        borderRadius: 999,
        background: you ? "var(--accent-soft)" : alive ? "var(--ink-2)" : "transparent",
        border: `1px solid ${you ? "var(--accent-edge)" : "var(--ink-3)"}`,
        opacity: alive ? 1 : 0.35,
        filter: alive ? "none" : "grayscale(1)",
      }}
    >
      <Avatar seed={meta.avatarSeed} pseudo={meta.pseudo} size={26} />
      <div className="text-[13px] font-semibold truncate max-w-[100px]">{meta.pseudo}</div>
      <div className="mono text-[11px]" style={{ color: "var(--fg-2)" }}>
        {alive ? `T${ps.currentTier}` : "OUT"}
      </div>
      {alive && (
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: answered ? "var(--good)" : "var(--accent)",
            animation: answering ? "pulse-accent 1s ease infinite" : "none",
          }}
        />
      )}
    </div>
  );
}
