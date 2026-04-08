"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLobbyState } from "@/hooks/use-lobby-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LobbyWaiting } from "@/components/lobby/lobby-waiting";
import { SiteHeader } from "@/components/layout/site-header";
import { BattleView } from "./battle-view";
import { PlacementBoard } from "@/components/battleship/placement-board";

export default function BattleshipPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const upper = code.toUpperCase();
  const router = useRouter();
  const { user, isAuthed, isLoading: userLoading } = useCurrentUser();
  const { state, error, refresh } = useLobbyState(isAuthed ? upper : null, 1200);

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

  const bs = state.battleship;
  if (!bs) {
    return <p className="p-10 text-center text-white/50">Initialisation...</p>;
  }

  if (bs.phase === "placement") {
    const myReady = bs.placedReady[user.userId];
    return (
      <>
        <SiteHeader />
        {!myReady ? (
          <PlacementBoard code={upper} onPlaced={() => refresh()} />
        ) : (
          <div className="text-center py-20">
            <p className="text-display text-3xl text-gold mb-3">Flotte placée</p>
            <p className="text-white/50">En attente de l'adversaire...</p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <BattleView state={state} myUserId={user.userId} />
    </>
  );
}
