// ============================================================================
// LOCAL STORAGE ADAPTER — SSR-safe
// All prototype state lives here. V1 swaps to Supabase.
// ============================================================================

"use client";

import { useEffect, useState } from "react";

const APP_STORAGE_PREFIX = "b7dc.";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore parse errors
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}

export function clearAllStorage() {
  if (typeof window === "undefined") return;
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith(APP_STORAGE_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  }
}
