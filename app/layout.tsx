import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Millions — Le jeu qui change tout",
  description:
    "Affronte tes amis sur Qui veut gagner des millions et la Bataille navale à questions. Lobbies en temps réel, jeu premium.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Millions",
    description: "Quiz battle royale + Bataille navale à questions.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04030a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased grain">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
