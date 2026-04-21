import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          0: "var(--ink-0)",
          1: "var(--ink-1)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          4: "var(--ink-4)",
        },
        fg: {
          0: "var(--fg-0)",
          1: "var(--fg-1)",
          2: "var(--fg-2)",
          3: "var(--fg-3)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          edge: "var(--accent-edge)",
          glow: "var(--accent-glow)",
        },
        good: "var(--good)",
        bad: "var(--bad)",
        cool: "var(--cool)",
      },
      fontFamily: {
        display: ["var(--ff-display)"],
        sans: ["var(--ff-ui)"],
        mono: ["var(--ff-mono)"],
      },
      animation: {
        "pulse-accent": "pulse-accent 1.6s ease-in-out infinite",
        rise: "rise 0.4s ease-out both",
        shimmer: "shimmer 2.4s linear infinite",
      },
      keyframes: {
        "pulse-accent": {
          "0%, 100%": { boxShadow: "0 0 0 0 var(--accent-glow)" },
          "50%": { boxShadow: "0 0 0 12px transparent" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
