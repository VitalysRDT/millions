import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "text-5xl"
      : size === "sm"
        ? "text-xl"
        : "text-2xl";
  return (
    <Link href="/" className={`text-display ${cls} font-bold tracking-tight text-gold-gradient`}>
      Millions
    </Link>
  );
}
