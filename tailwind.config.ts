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
        bg: {
          DEFAULT: "#070612",
          deep: "#04030a",
          surface: "#0e0c1f",
          card: "#13102a",
          border: "#241f3f",
        },
        gold: {
          50: "#fff8e1",
          100: "#ffecb3",
          200: "#ffe082",
          300: "#ffd54f",
          400: "#ffca28",
          500: "#ffc107",
          600: "#ffb300",
          700: "#ffa000",
          800: "#ff8f00",
          900: "#ff6f00",
          DEFAULT: "#f5c542",
          glow: "#ffd76b",
        },
        royal: {
          DEFAULT: "#3a1f7a",
          dark: "#1a0d3d",
        },
        success: "#21d27c",
        danger: "#ff5470",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(245,197,66,0.4), 0 8px 30px -8px rgba(245,197,66,0.45)",
        "gold-soft": "0 0 30px -5px rgba(245,197,66,0.35)",
        "deep": "0 30px 80px -20px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #ffe28a 0%, #f5c542 30%, #c8941b 70%, #ffe28a 100%)",
        "royal-gradient":
          "radial-gradient(ellipse at top, #2a1860 0%, #0a0418 70%)",
        "noise":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
      },
      animation: {
        "pulse-gold": "pulseGold 2.6s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2.4s linear infinite",
      },
      keyframes: {
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,197,66,0.55)" },
          "50%": { boxShadow: "0 0 0 14px rgba(245,197,66,0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
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
