import { z } from "zod";

export const PseudoSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[A-Za-z0-9_\- ]+$/, "letters, digits, _ - and spaces only");

export const LoginInput = z.object({ pseudo: PseudoSchema });

export const CreateLobbyInput = z.object({
  gameType: z.enum(["millionaire", "battleship"]),
  maxPlayers: z.number().int().min(2).max(8).optional(),
});

export const AnswerInput = z.object({
  round: z.number().int().min(1).max(15),
  chosenIndex: z.number().int().min(0).max(3),
  clientIdemKey: z.string().min(8).max(64),
});

export const JokerInput = z.object({
  joker: z.enum(["fifty", "public", "phone", "switch"]),
});

export const ReadyInput = z.object({ ready: z.boolean() });

export const PlaceShipsInput = z.object({
  ships: z
    .array(
      z.object({
        size: z.number().int().min(2).max(5),
        cells: z.array(z.tuple([z.number().int().min(0).max(9), z.number().int().min(0).max(9)])),
      }),
    )
    .length(5),
});

export const RequestQuestionInput = z.object({
  difficulty: z.number().int().min(1).max(6),
});

export const BattleshipAnswerInput = z.object({
  chosenIndex: z.number().int().min(0).max(3),
  clientIdemKey: z.string().min(8).max(64),
});

export const ShootInput = z.object({
  cells: z
    .array(z.tuple([z.number().int().min(0).max(9), z.number().int().min(0).max(9)]))
    .min(1)
    .max(5),
  clientIdemKey: z.string().min(8).max(64),
});
