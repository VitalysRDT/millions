"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/utils/fetcher";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: true,
        errorRetryInterval: 2000,
        errorRetryCount: 5,
      }}
    >
      {children}
    </SWRConfig>
  );
}
