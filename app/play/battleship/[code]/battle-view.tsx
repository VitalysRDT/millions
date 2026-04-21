"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import type { LobbyState, BattleshipQuestionPublic } from "@/lib/games/shared/types";
import { Grid, type GridCellState } from "@/components/battleship/grid";
import { GRID_SIZE } from "@/lib/games/battleship/constants";
import { DifficultyPicker } from "@/components/battleship/difficulty-picker";
import { QuestionPanel } from "@/components/battleship/question-panel";
import { postJson } from "@/lib/utils/fetcher";
import { motion } from "framer-motion";
import { Avatar } from "@/components/common/avatar";
import { nanoid } from "nanoid";
import { expandPattern } from "@/lib/games/battleship/shot-resolver";
import Link from "next/link";

interface MyShipsResponse {
  ships: { size: number; cells: [number, number][] }[];
}

function emptyGrid(): GridCellState[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "empty" as GridCellState),
  );
}

export function BattleView({
  state,
  myUserId,
}: {
  state: LobbyState;
  myUserId: string;
}) {
  const bs = state.battleship!;
  const opponent = state.players.find((p) => p.userId !== myUserId)!;
  const me = state.players.find((p) => p.userId === myUserId)!;
  const myTurn = bs.currentTurnUserId === myUserId;

  const [pendingChoice, setPendingChoice] = useState<number | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [shootMode, setShootMode] = useState(false);
  const idemRef = useRef<string>(nanoid());
  const lastTurnRef = useRef<number>(bs.turnNumber);

  useEffect(() => {
    if (lastTurnRef.current !== bs.turnNumber) {
      lastTurnRef.current = bs.turnNumber;
      idemRef.current = nanoid();
      setPendingChoice(null);
      setShootMode(false);
    }
  }, [bs.turnNumber]);

  useEffect(() => {
    if (bs.answeredCorrectly === true && bs.questionPhase === "answering") {
      setShootMode(true);
    }
  }, [bs.answeredCorrectly, bs.questionPhase]);

  useEffect(() => {
    const id = setInterval(() => {
      postJson(`/api/battleship/${state.code}/tick`, {}).catch(() => undefined);
    }, 2000);
    return () => clearInterval(id);
  }, [state.code]);

  const { data: myShipsData } = useSWR<MyShipsResponse>(
    `/api/battleship/${state.code}/my-ships`,
  );
  const myShipCells = new Set<string>();
  for (const ship of myShipsData?.ships ?? []) {
    for (const [x, y] of ship.cells) myShipCells.add(`${x},${y}`);
  }

  const enemyGrid: GridCellState[][] = (() => {
    const g = emptyGrid();
    for (const c of bs.publicGrids[opponent.userId] ?? []) {
      g[c.x]![c.y] = c.result === "miss" ? "miss" : c.result === "sunk" ? "sunk" : "hit";
    }
    return g;
  })();

  const myGrid: GridCellState[][] = (() => {
    const g = emptyGrid();
    for (const key of myShipCells) {
      const [xs, ys] = key.split(",");
      const x = Number(xs);
      const y = Number(ys);
      if (Number.isInteger(x) && Number.isInteger(y)) g[x]![y] = "ship";
    }
    for (const c of bs.publicGrids[myUserId] ?? []) {
      g[c.x]![c.y] = c.result === "miss" ? "miss" : c.result === "sunk" ? "sunk" : "hit";
    }
    return g;
  })();

  const reward = bs.currentQuestion?.patternReward ?? "single";
  const previewCells: [number, number][] = shootMode && hover ? expandPattern(hover, reward) : [];

  const askQuestion = async (difficulty: number) => {
    setBusy(true);
    try {
      await postJson(`/api/battleship/${state.code}/request-question`, { difficulty });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const answer = async (i: 0 | 1 | 2 | 3) => {
    if (pendingChoice !== null || busy) return;
    setPendingChoice(i);
    setBusy(true);
    try {
      await postJson(`/api/battleship/${state.code}/answer`, {
        chosenIndex: i,
        clientIdemKey: idemRef.current,
      });
    } finally {
      setBusy(false);
    }
  };

  const fireAt = async (x: number, y: number) => {
    if (!shootMode) return;
    if (busy) return;
    setBusy(true);
    try {
      await postJson(`/api/battleship/${state.code}/shoot`, {
        origin: [x, y],
        clientIdemKey: idemRef.current + ":shot",
      });
      setShootMode(false);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  // GAME OVER
  if (bs.phase === "finished") {
    const won = bs.winnerUserId === myUserId;
    return (
      <div className="screen min-h-[80vh] flex items-center justify-center px-5 sm:px-7">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="eyebrow mb-4">Résultat</div>
          <div
            className="display m-0"
            style={{ fontSize: "clamp(56px, 12vw, 96px)", lineHeight: 1 }}
          >
            {won ? (
              <span className="shine">Victoire</span>
            ) : (
              <span style={{ color: "var(--fg-2)" }}>Défaite</span>
            )}
          </div>
          <p
            className="display italic mt-2 mb-9"
            style={{ fontSize: 22, color: "var(--fg-2)" }}
          >
            {won
              ? `Tu as coulé toute la flotte de ${opponent.pseudo}.`
              : `${opponent.pseudo} t'a coulé.`}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/play" className="btn btn-primary">
              Rejouer
            </Link>
            <Link href="/" className="btn">
              Retour au hub
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="screen max-w-[1280px] mx-auto px-5 sm:px-7 py-7 pb-16">
      <div className="flex items-center justify-between mb-7">
        <Link href="/play" className="btn btn-ghost">
          ← Quitter
        </Link>
        <div className="text-center">
          <div className="eyebrow mb-1">Tour {bs.turnNumber}</div>
          <div
            className="display"
            style={{ fontSize: "clamp(22px, 3.5vw, 32px)", lineHeight: 1 }}
          >
            {myTurn ? (
              <span className="shine">À toi de jouer</span>
            ) : (
              <span className="muted">Tour de {opponent.pseudo}</span>
            )}
          </div>
        </div>
        <div style={{ width: 88 }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
        {/* Enemy grid */}
        <div className="surface p-5 sm:p-6">
          <div className="flex justify-between items-center mb-3.5">
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--bad)", fontSize: 18 }}>◎</span>
              <div className="eyebrow truncate">Flotte ennemie · {opponent.pseudo}</div>
            </div>
            <div className="mono text-[11px]" style={{ color: "var(--fg-2)" }}>
              {bs.shipsStatus[opponent.userId]?.remaining ?? 5}/5
            </div>
          </div>
          <Grid
            cells={enemyGrid}
            maxWidthPx={420}
            onCellClick={shootMode ? fireAt : undefined}
            onCellHover={(x, y) => setHover([x, y])}
            onCellLeave={() => setHover(null)}
            highlight={previewCells}
          />
        </div>

        {/* My grid */}
        <div className="surface p-5 sm:p-6">
          <div className="flex justify-between items-center mb-3.5">
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--accent)", fontSize: 18 }}>⚓</span>
              <div className="eyebrow">Ta flotte</div>
            </div>
            <div className="mono text-[11px]" style={{ color: "var(--fg-2)" }}>
              {bs.shipsStatus[myUserId]?.remaining ?? 5}/5
            </div>
          </div>
          <Grid cells={myGrid} maxWidthPx={420} />
        </div>
      </div>

      {/* Action panel */}
      <div className="surface p-6 sm:p-7 min-h-[200px]">
        {myTurn && bs.questionPhase === "idle" && !shootMode && (
          <DifficultyPicker onPick={askQuestion} disabled={busy} />
        )}
        {myTurn && bs.questionPhase === "answering" && bs.currentQuestion && bs.deadlineAt && (
          <QuestionPanel
            question={bs.currentQuestion as BattleshipQuestionPublic}
            deadlineAt={bs.deadlineAt}
            selectedIdx={pendingChoice}
            onSelect={answer}
          />
        )}
        {myTurn && shootMode && (
          <div className="text-center py-6">
            <div className="chip accent mb-4 inline-flex">Bonne réponse</div>
            <div className="display mb-2" style={{ fontSize: 24 }}>
              Choisis une case pour tirer.
            </div>
            <div className="muted text-sm">
              Survole la grille ennemie pour voir la zone d'impact.
            </div>
          </div>
        )}
        {!myTurn && (
          <div className="flex items-center justify-center gap-3.5 py-8">
            <Avatar seed={opponent.avatarSeed} pseudo={opponent.pseudo} size={36} />
            <div className="display" style={{ fontSize: 22, color: "var(--fg-2)" }}>
              {opponent.pseudo} prépare son tir…
            </div>
          </div>
        )}
      </div>
      <span className="hidden">{me.pseudo}</span>
    </div>
  );
}
