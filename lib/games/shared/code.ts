import { redis } from "@/lib/redis/client";
import { k } from "@/lib/redis/keys";
import { generateLobbyCode } from "@/lib/utils/id";

export async function reserveUniqueLobbyCode(maxTries = 8): Promise<string> {
  const r = redis();
  for (let i = 0; i < maxTries; i++) {
    const code = generateLobbyCode();
    const ok = await r.set(k.codeReserved(code), "1", { nx: true, ex: 3600 });
    if (ok === "OK") return code;
  }
  throw new Error("code_collision");
}
