import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--ff-display-font",
  display: "swap",
});

const ui = Inter_Tight({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--ff-ui-font",
  display: "swap",
});

const mono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--ff-mono-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Millions — Prototype",
  description:
    "Deux jeux de plateau classiques, un seul code de partie. Qui veut gagner des Millions battle royale et Bataille navale à questions.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Millions",
    description: "Quiz battle royale + Bataille navale à questions.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${ui.variable} ${mono.variable}`}
      style={
        {
          "--ff-display": `var(--ff-display-font), ui-serif, Georgia, serif`,
          "--ff-ui": `var(--ff-ui-font), system-ui, -apple-system, sans-serif`,
          "--ff-mono": `var(--ff-mono-font), ui-monospace, monospace`,
        } as React.CSSProperties
      }
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
