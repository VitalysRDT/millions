"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import type { LobbyState, BattleshipQuestionPublic } from "@/lib/games/shared/types";
import { Grid, type GridCellState } from "@/components/battleship/grid";
import {
  GRID_SIZE,
  patternLabel,
  patternCanRotate,
  patternRotationCount,
  type Rotation,
} from "@/lib/games/battleship/constants";
import { DifficultyPicker } from "@/components/battleship/difficulty-picker";
import { QuestionPanel } from "@/components/battleship/question-panel";
import { postJson } from "@/lib/utils/fetcher";
import { motion } from "framer-motion";
import { Avatar } from "@/components/common/avatar";
import { nanoid } from "nanoid";
import { expandPattern } from "@/lib/games/battleship/shot-resolver";
import { Check, RotateCcw, RotateCw, Undo2 } from "lucide-react";
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
  const [aim, setAim] = useState<[number, number] | null>(null);
  const [aimHistory, setAimHistory] = useState<[number, number][]>([]);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [busy, setBusy] = useState(false);
  const idemRef = useRef<string>(nanoid());
  const lastTurnRef = useRef<number>(bs.turnNumber);

  const shootMode = myTurn && bs.questionPhase === "shooting";

  useEffect(() => {
    if (lastTurnRef.current !== bs.turnNumber) {
      lastTurnRef.current = bs.turnNumber;
      idemRef.current = nanoid();
      setPendingChoice(null);
      setAim(null);
      setAimHistory([]);
      setRotation(0);
    }
  }, [bs.turnNumber]);

  // Reset aim when leaving shooting phase
  useEffect(() => {
    if (!shootMode) {
      setAim(null);
      setAimHistory([]);
      setRotation(0);
    }
  }, [shootMode]);

  useEffect(() => {
    const id = setInterval(() => {
      postJson(`/api/battleship/${state.code}/tick`, {}).catch(() => undefined);
    }, 1500);
    return () => clearInterval(id);
  }, [state.code]);

  const { data: myShipsData } = useSWR<MyShipsResponse>(
    `/api/battleship/${state.code}/my-ships`,
  );
  const myShipCells = new Set<string>();
  for (const ship of myShipsData?.ships ?? []) {
    for (const [x, y] of ship.cells) myShipCells.add(`${x},${y}`);
  }

  const reward = bs.currentQuestion?.patternReward ?? "single";
  const aimCells: [number, number][] = aim ? expandPattern(aim, reward, rotation) : [];
  const hoverCells: [number, number][] =
    shootMode && hover && !aim ? expandPattern(hover, reward, rotation) : [];
  const highlightCells = aim ? aimCells : hoverCells;

  const enemyGrid: GridCellState[][] = (() => {
    const g = emptyGrid();
    for (const c of bs.publicGrids[opponent.userId] ?? []) {
      g[c.x]![c.y] = c.result === "miss" ? "miss" : c.result === "sunk" ? "sunk" : "hit";
    }
    // Overlay aim cells (when locked in)
    if (aim) {
      for (const [x, y] of aimCells) {
        if (g[x]![y] === "empty") g[x]![y] = "aim";
      }
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

  const onCellClickEnemy = (x: number, y: number) => {
    if (!shootMode) return;
    // "drag & drop" simplified to tap-to-aim. Only empty cells are valid targets.
    const already = bs.publicGrids[opponent.userId] ?? [];
    if (already.some((c) => c.x === x && c.y === y)) return;
    if (aim) setAimHistory((h) => [...h, aim]);
    setAim([x, y]);
  };

  const confirmShot = async () => {
    if (!aim || busy) return;
    setBusy(true);
    try {
      await postJson(`/api/battleship/${state.code}/shoot`, {
        origin: [aim[0], aim[1]],
        rotation,
        clientIdemKey: idemRef.current + ":shot",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const rotateShot = () => {
    const count = patternRotationCount(reward);
    if (count === 1) return;
    const step = 360 / count; // 180 for line2/line3, 90 for tShape
    setRotation((r) => (((r + step) % 360) as Rotation));
  };

  const clearAim = () => {
    if (aim) setAimHistory((h) => [...h, aim]);
    setAim(null);
  };

  const undoAim = () => {
    setAimHistory((h) => {
      if (h.length === 0) {
        setAim(null);
        return h;
      }
      const prev = h[h.length - 1]!;
      setAim(prev);
      return h.slice(0, -1);
    });
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
            onCellClick={shootMode ? onCellClickEnemy : undefined}
            onCellHover={(x, y) => setHover([x, y])}
            onCellLeave={() => setHover(null)}
            highlight={highlightCells}
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
        {myTurn && bs.questionPhase === "idle" && (
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

        {myTurn && bs.questionPhase === "revealing" && bs.currentQuestion && bs.deadlineAt && (
          <QuestionPanel
            question={bs.currentQuestion as BattleshipQuestionPublic}
            deadlineAt={bs.deadlineAt}
            selectedIdx={bs.revealedChosenIndex ?? pendingChoice}
            revealedCorrectIdx={bs.revealedCorrectIndex}
            myChoiceWasCorrect={false}
            onSelect={() => undefined}
          />
        )}

        {myTurn && bs.questionPhase === "shooting" && bs.currentQuestion && (
          <ShootPanel
            question={bs.currentQuestion as BattleshipQuestionPublic}
            aim={aim}
            aimHistoryLength={aimHistory.length}
            rotation={rotation}
            onConfirm={confirmShot}
            onClear={clearAim}
            onUndo={undoAim}
            onRotate={rotateShot}
            busy={busy}
          />
        )}

        {myTurn && bs.questionPhase === "shot_resolved" && (
          <ShotResolvedPanel
            lastShot={bs.lastShot}
            iAm="shooter"
          />
        )}

        {!myTurn && bs.questionPhase === "shot_resolved" && (
          <ShotResolvedPanel
            lastShot={bs.lastShot}
            iAm="defender"
            opponentName={opponent.pseudo}
          />
        )}

        {!myTurn && bs.questionPhase !== "shot_resolved" && (
          <div className="flex items-center justify-center gap-3.5 py-8">
            <Avatar seed={opponent.avatarSeed} pseudo={opponent.pseudo} size={36} />
            <div className="display text-center" style={{ fontSize: 22, color: "var(--fg-2)" }}>
              {bs.questionPhase === "answering"
                ? `${opponent.pseudo} réfléchit à sa question…`
                : bs.questionPhase === "revealing"
                  ? `${opponent.pseudo} s'est trompé…`
                  : bs.questionPhase === "shooting"
                    ? `${opponent.pseudo} vise…`
                    : `Tour de ${opponent.pseudo}`}
            </div>
          </div>
        )}
      </div>
      <span className="hidden">{me.pseudo}</span>
    </div>
  );
}

function ShootPanel({
  question,
  aim,
  aimHistoryLength,
  rotation,
  onConfirm,
  onClear,
  onUndo,
  onRotate,
  busy,
}: {
  question: BattleshipQuestionPublic;
  aim: [number, number] | null;
  aimHistoryLength: number;
  rotation: Rotation;
  onConfirm: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRotate: () => void;
  busy: boolean;
}) {
  const rewardLabel = patternLabel(question.patternReward);
  const canRotate = patternCanRotate(question.patternReward);
  const LETTERS = "ABCDEFGHIJ";

  return (
    <div className="text-center py-3 sm:py-4">
      <div
        className="chip mb-3 inline-flex"
        style={{
          color: "var(--good)",
          borderColor: "var(--good)",
          background: "oklch(72% 0.18 150 / 0.14)",
        }}
      >
        ✓ Bonne réponse
      </div>
      <div
        className="display mb-2"
        style={{ fontSize: "clamp(22px, 4vw, 28px)" }}
      >
        {aim ? "Confirme ton tir" : "Choisis une case à frapper"}
      </div>
      <div className="muted text-sm mb-5">
        {aim
          ? `Cible : ${LETTERS[aim[0]]}${aim[1] + 1} · ${rewardLabel}`
          : `Tape une case de la grille ennemie. Récompense : ${rewardLabel}.`}
        {canRotate && (
          <> · Rotation : <strong style={{ color: "var(--accent)" }}>{rotation}°</strong></>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5 justify-center">
        {canRotate && (
          <button
            onClick={onRotate}
            disabled={busy}
            className="btn"
            title="Pivoter le pattern (sans quitter la visée)"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden sm:inline">Pivoter</span>
          </button>
        )}
        <button
          onClick={onUndo}
          disabled={aimHistoryLength === 0 || busy}
          className="btn"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline">Annuler</span>
        </button>
        <button
          onClick={onClear}
          disabled={!aim || busy}
          className="btn"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Effacer cible</span>
        </button>
        <button
          onClick={onConfirm}
          disabled={!aim || busy}
          className="btn btn-primary"
          style={{ padding: "12px 22px" }}
        >
          <Check className="w-4 h-4" />
          {busy ? "Tir…" : "Valider le tir"}
        </button>
      </div>
    </div>
  );
}

function ShotResolvedPanel({
  lastShot,
  iAm,
  opponentName,
}: {
  lastShot?: {
    shooterUserId: string;
    cells: { x: number; y: number; result: "miss" | "hit" | "sunk"; shipSize?: number }[];
    sunk: boolean;
    gameOver: boolean;
  };
  iAm: "shooter" | "defender";
  opponentName?: string;
}) {
  const hits = lastShot?.cells.filter((c) => c.result === "hit" || c.result === "sunk").length ?? 0;
  const misses = lastShot?.cells.filter((c) => c.result === "miss").length ?? 0;
  const sunkShip = lastShot?.cells.find((c) => c.result === "sunk");
  const allMiss = hits === 0 && misses > 0;

  let title: string;
  let color: string;
  if (sunkShip) {
    title = iAm === "shooter" ? "Bateau coulé !" : "Ton bateau a coulé…";
    color = iAm === "shooter" ? "var(--good)" : "var(--bad)";
  } else if (hits > 0) {
    title = iAm === "shooter" ? `Touché ! (${hits})` : `Impact ! (${hits})`;
    color = iAm === "shooter" ? "var(--good)" : "var(--bad)";
  } else if (allMiss) {
    title = iAm === "shooter" ? "Raté." : `${opponentName ?? "L'adversaire"} a manqué.`;
    color = "var(--fg-2)";
  } else {
    title = "Tir résolu";
    color = "var(--fg-1)";
  }

  return (
    <div className="text-center py-4 sm:py-6">
      <div
        className="display"
        style={{ fontSize: "clamp(26px, 5vw, 36px)", color, lineHeight: 1.1 }}
      >
        {title}
      </div>
      <div className="muted text-sm mt-3">
        {hits > 0 && (
          <>
            {hits} case{hits > 1 ? "s" : ""} touchée{hits > 1 ? "s" : ""}
            {misses > 0 && <> · {misses} manquée{misses > 1 ? "s" : ""}</>}
          </>
        )}
        {hits === 0 && misses > 0 && (
          <>
            {misses} case{misses > 1 ? "s" : ""} à l'eau
          </>
        )}
      </div>
      <div className="muted text-xs mt-4 italic">
        {iAm === "shooter" ? "Tour adverse dans quelques secondes…" : "À toi de jouer bientôt…"}
      </div>
    </div>
  );
}
