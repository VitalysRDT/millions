"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLobbyState } from "@/hooks/use-lobby-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LobbyWaiting } from "@/components/lobby/lobby-waiting";
import { GameView } from "./game-view";
import { FinalScreen } from "@/components/millionaire/final-screen";
import { SiteHeader } from "@/components/layout/site-header";

export default function MillionairePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const upper = code.toUpperCase();
  const router = useRouter();
  const { user, isAuthed, isLoading: userLoading } = useCurrentUser();
  const { state, error } = useLobbyState(isAuthed ? upper : null, 1200);

  useEffect(() => {
    if (!userLoading && !isAuthed) {
      router.replace("/login");
    }
  }, [userLoading, isAuthed, router]);

  if (userLoading || !isAuthed || !user) {
    return (
      <>
        <SiteHeader />
        <p className="p-10 text-center text-white/40 text-sm">Chargement...</p>
      </>
    );
  }
  if (error) {
    return (
      <p className="p-10 text-center text-danger">
        Erreur : {error instanceof Error ? error.message : "inconnue"}
      </p>
    );
  }
  if (!state) {
    return <p className="p-10 text-center text-white/50">Chargement du lobby...</p>;
  }

  if (state.status === "waiting") {
    return (
      <>
        <SiteHeader />
        <LobbyWaiting state={state} currentUserId={user.userId} />
      </>
    );
  }

  if (state.status === "finished" || state.status === "abandoned") {
    return (
      <>
        <SiteHeader />
        <FinalScreen state={state} />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <GameView state={state} myUserId={user.userId} />
    </>
  );
}
