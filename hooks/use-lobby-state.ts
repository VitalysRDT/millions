"use client";

import useSWR from "swr";
import type { LobbyState } from "@/lib/games/shared/types";

interface StateResponse {
  state: LobbyState;
  version: number;
}

/**
 * Polls /state every `intervalMs`. Returns the current state.
 * Polling is paused if `enabled` is false.
 */
export function useLobbyState(code: string | null, intervalMs = 1200) {
  const url = code ? `/api/lobbies/${code}/state` : null;
  const { data, error, isLoading, mutate } = useSWR<StateResponse>(url, {
    refreshInterval: intervalMs,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    dedupingInterval: 500,
    keepPreviousData: true,
  });
  return {
    state: data?.state,
    version: data?.version,
    isLoading,
    error,
    refresh: mutate,
  };
}
