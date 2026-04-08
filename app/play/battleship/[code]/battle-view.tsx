"use client";

import { useEffect, useRef, useState } from "react";
import type { LobbyState, BattleshipQuestionPublic } from "@/lib/games/shared/types";
import { Grid, type GridCellState } from "@/components/battleship/grid";
import { GRID_SIZE } from "@/lib/games/battleship/constants";
import { DifficultyPicker } from "@/components/battleship/difficulty-picker";
import { QuestionPanel } from "@/components/battleship/question-panel";
import { postJson } from "@/lib/utils/fetcher";
import { motion } from "framer-motion";
import { Trophy, Anchor, Crosshair } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { nanoid } from "nanoid";
import { expandPattern } from "@/lib/games/battleship/shot-resolver";
import Link from "next/link";

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

  // Polling tick to expire questions
  useEffect(() => {
    const id = setInterval(() => {
      postJson(`/api/battleship/${state.code}/tick`, {}).catch(() => undefined);
    }, 2000);
    return () => clearInterval(id);
  }, [state.code]);

  // Build grids
  const enemyGrid: GridCellState[][] = (() => {
    const g = emptyGrid();
    for (const c of bs.publicGrids[opponent.userId] ?? []) {
      g[c.x]![c.y] = c.result === "miss" ? "miss" : c.result === "sunk" ? "sunk" : "hit";
    }
    return g;
  })();

  const myGrid: GridCellState[][] = (() => {
    const g = emptyGrid();
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
      const cells = expandPattern([x, y], reward);
      await postJson(`/api/battleship/${state.code}/shoot`, {
        cells,
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
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <Trophy className={`w-20 h-20 mx-auto mb-6 ${won ? "text-gold" : "text-white/30"}`} />
          <h1 className="text-display text-5xl font-bold mb-3">
            {won ? "Victoire" : "Défaite"}
          </h1>
          <p className="text-white/50 mb-8">
            {won
              ? `Tu as coulé toute la flotte de ${opponent.pseudo}.`
              : `${opponent.pseudo} t'a coulé.`}
          </p>
          <Link href="/play" className="btn-gold inline-flex">
            Retour au hub
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
          Tour {bs.turnNumber}
        </p>
        <h2 className="text-display text-3xl font-bold">
          {myTurn ? (
            <span className="text-gold-gradient">À toi de jouer</span>
          ) : (
            <span className="text-white/60">Tour de {opponent.pseudo}</span>
          )}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Enemy grid (target) */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Crosshair className="w-4 h-4 text-danger" />
            <h3 className="text-sm uppercase tracking-widest text-white/60">
              Flotte ennemie · {opponent.pseudo}
            </h3>
          </div>
          <div className="flex justify-center">
            <Grid
              cells={enemyGrid}
              cellPx={32}
              onCellClick={shootMode ? fireAt : undefined}
              onCellHover={(x, y) => setHover([x, y])}
              onCellLeave={() => setHover(null)}
              highlight={previewCells}
            />
          </div>
          <p className="text-xs text-white/40 mt-3">
            {bs.shipsStatus[opponent.userId]?.remaining ?? 5} bateau(x) restant(s)
          </p>
        </div>

        {/* My grid */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Anchor className="w-4 h-4 text-gold" />
            <h3 className="text-sm uppercase tracking-widest text-white/60">
              Ta flotte
            </h3>
          </div>
          <div className="flex justify-center">
            <Grid cells={myGrid} cellPx={32} />
          </div>
          <p className="text-xs text-white/40 mt-3">
            {bs.shipsStatus[myUserId]?.remaining ?? 5} bateau(x) restant(s)
          </p>
        </div>
      </div>

      {/* Action panel */}
      <div className="max-w-2xl mx-auto">
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
          <p className="text-center text-gold animate-pulse">
            Bonne réponse ! Choisis une cellule pour tirer.
          </p>
        )}
        {!myTurn && (
          <div className="text-center surface rounded-2xl p-6 flex items-center justify-center gap-4">
            <Avatar seed={opponent.avatarSeed} pseudo={opponent.pseudo} size={40} />
            <p className="text-white/60">{opponent.pseudo} prépare son tir...</p>
          </div>
        )}
      </div>
      {/* Hide unused vars warnings */}
      <span className="hidden">{me.pseudo}</span>
    </div>
  );
}
