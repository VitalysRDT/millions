import { redis } from "@/lib/redis/client";
import { k } from "@/lib/redis/keys";
import { applyLobbyMutation } from "@/lib/redis/lobby-state";
import { pickQuestionsByDifficulties } from "@/lib/db/queries";
import { shuffleIndices } from "@/lib/games/shared/shuffle";
import { difficultyForRound } from "./constants";
import type { LobbyState, MillionaireQuestionPublic } from "@/lib/games/shared/types";

export type JokerKind = "fifty" | "public" | "phone" | "switch";

export async function applyJoker(
  code: string,
  userId: string,
  joker: JokerKind,
): Promise<LobbyState> {
  const r = redis();
  // Some jokers need extra reads outside the lock — so we pre-fetch.
  const peek = await applyLobbyMutation(code, (state) => state);
  const m = peek.millionaire;
  if (!m) throw new Error("no_game");
  const ps = m.playerStates.find((p) => p.userId === userId);
  if (!ps) throw new Error("not_in_game");
  if (!ps.jokersRemaining.includes(joker)) throw new Error("joker_used");
  if (m.roundState !== "answering") throw new Error("not_answering");

  const correctRaw = await r.get<string | number>(k.gameCorrect(m.gameId, m.round));
  const correctIdx = Number(correctRaw);

  let switchPub: MillionaireQuestionPublic | null = null;
  let switchCorrect: number | null = null;
  if (joker === "switch") {
    const arr = await pickQuestionsByDifficulties([difficultyForRound(m.round)]);
    const picked = arr[0];
    if (picked) {
      const order = shuffleIndices(4);
      const all = [picked.correct, picked.incorrect1, picked.incorrect2, picked.incorrect3];
      const shuffled = order.map((i) => all[i]!) as [string, string, string, string];
      switchPub = {
        id: picked.id,
        text: picked.text,
        answers: shuffled,
        category: picked.category,
        difficulty: picked.difficulty,
      };
      switchCorrect = order.indexOf(0);
      await r.set(k.gameCorrect(m.gameId, m.round) + `:${userId}`, switchCorrect, { ex: 3600 });
    }
  }

  return applyLobbyMutation(code, (state) => {
    const mm = state.millionaire;
    if (!mm) return state;
    const player = mm.playerStates.find((p) => p.userId === userId);
    if (!player) return state;
    if (!player.jokersRemaining.includes(joker)) return state;

    player.jokersRemaining = player.jokersRemaining.filter((j) => j !== joker);

    if (joker === "fifty") {
      // Hide 2 incorrect answer indexes
      const incorrects: number[] = [];
      for (let i = 0; i < 4; i++) if (i !== correctIdx) incorrects.push(i);
      // shuffle and take 2
      for (let i = incorrects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrects[i], incorrects[j]] = [incorrects[j]!, incorrects[i]!];
      }
      player.fiftyHidden = incorrects.slice(0, 2).sort((a, b) => a - b);
    } else if (joker === "public") {
      // Build a distribution biased toward correct
      const diff = mm.question.difficulty;
      const baseCorrect = 35 + (7 - diff) * 6 + Math.floor(Math.random() * 10);
      const remaining = 100 - baseCorrect;
      const others = [0, 1, 2, 3].filter((i) => i !== correctIdx);
      const noise = others.map(() => 1 + Math.floor(Math.random() * 4));
      const total = noise.reduce((a, b) => a + b, 0);
      const share = others.map((_, i) => Math.round((noise[i]! / total) * remaining));
      const sum = share.reduce((a, b) => a + b, 0);
      share[0] = share[0]! + (remaining - sum);
      const dist = [0, 0, 0, 0];
      dist[correctIdx] = baseCorrect;
      others.forEach((idx, i) => (dist[idx] = share[i]!));
      player.publicVote = dist;
    } else if (joker === "phone") {
      const diff = mm.question.difficulty;
      const probRight = 0.4 + 0.08 * (7 - diff);
      const guess = Math.random() < probRight ? correctIdx : [0, 1, 2, 3].filter((i) => i !== correctIdx)[Math.floor(Math.random() * 3)]!;
      const quotes = [
        "Je suis presque sûr que c'est cette réponse.",
        "Hmm... je dirais celle-là, sans hésiter.",
        "Mon instinct me dit de partir là-dessus.",
        "J'ai un doute mais je tente cette option.",
      ];
      player.phoneFriend = {
        confidence: Math.min(0.95, probRight + Math.random() * 0.15),
        guess,
        quote: quotes[Math.floor(Math.random() * quotes.length)]!,
      };
    } else if (joker === "switch" && switchPub) {
      player.overrideQuestion = switchPub;
      // For switch, the global correct key is overridden ONLY for this player.
      // We use a separate per-player correct key (set above).
    }

    return state;
  });
}
