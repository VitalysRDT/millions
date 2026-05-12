/* eslint-disable no-console */
/**
 * Seed all questions from questions.json into Postgres.
 * Idempotent: uses ON CONFLICT (id) DO NOTHING.
 *
 * Run: pnpm db:seed
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

type RawQuestion = {
  id: number;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  category: string;
  difficulty: number;
  language: string;
};

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: dbUrl });

  const path = process.argv[2] ?? "questions.json";
  console.log(`[seed] reading ${path}`);
  const raw = JSON.parse(readFileSync(path, "utf8")) as RawQuestion[];
  console.log(`[seed] ${raw.length} questions to upsert`);

  // Filter & clamp invalid rows
  const valid = raw.filter(
    (q) =>
      Number.isInteger(q.id) &&
      typeof q.question === "string" &&
      typeof q.correct_answer === "string" &&
      Array.isArray(q.incorrect_answers) &&
      q.incorrect_answers.length === 3 &&
      q.incorrect_answers.every((s) => typeof s === "string") &&
      typeof q.category === "string" &&
      Number.isInteger(q.difficulty),
  );
  console.log(`[seed] ${valid.length} valid rows after filter`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < valid.length; i += BATCH) {
    const slice = valid.slice(i, i + BATCH);
    // Build a multi-row INSERT
    const values = slice
      .map(
        (_, k) =>
          `($${k * 8 + 1},$${k * 8 + 2},$${k * 8 + 3},$${k * 8 + 4},$${k * 8 + 5},$${k * 8 + 6},$${k * 8 + 7},$${k * 8 + 8})`,
      )
      .join(",");
    const params: (string | number)[] = [];
    for (const q of slice) {
      params.push(
        q.id,
        q.question,
        q.correct_answer,
        q.incorrect_answers[0]!,
        q.incorrect_answers[1]!,
        q.incorrect_answers[2]!,
        q.category.slice(0, 64),
        Math.max(1, Math.min(6, q.difficulty)),
      );
    }
    const query = `INSERT INTO questions (id, text, correct, incorrect_1, incorrect_2, incorrect_3, category, difficulty)
                   VALUES ${values}
                   ON CONFLICT (id) DO NOTHING`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await pool.query(query, params);
    inserted += slice.length;
    process.stdout.write(`\r[seed] ${inserted}/${valid.length}`);
  }
  process.stdout.write("\n");
  console.log("[seed] done");
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
