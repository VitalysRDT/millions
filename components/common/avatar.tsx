import { cn } from "@/lib/utils/cn";

const PALETTE = [
  ["#f5c542", "#ff8a3d"],
  ["#3a1f7a", "#7a3df5"],
  ["#21d27c", "#1ba6a4"],
  ["#ff5470", "#ffb13b"],
  ["#5c8cff", "#a45cff"],
  ["#ffd76b", "#c19422"],
];

function pick(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length] as [string, string];
}

export function Avatar({
  seed,
  pseudo,
  size = 40,
  className,
}: {
  seed: string;
  pseudo: string;
  size?: number;
  className?: string;
}) {
  const [c1, c2] = pick(seed);
  const initial = (pseudo[0] ?? "?").toUpperCase();
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-bg-deep border border-white/10 shadow",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  );
}
