"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";

export interface MeResponse {
  userId: string;
  pseudo: string;
  avatarSeed: string;
  stats: { totalGames: number; totalWins: number; bestScore: number };
}

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<MeResponse>(
    "/api/auth/me",
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    user: data,
    isLoading,
    isAuthed: !!data && !error,
    error,
    refresh: mutate,
  };
}
