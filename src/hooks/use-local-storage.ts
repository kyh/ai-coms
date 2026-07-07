"use client";

import * as React from "react";
import { z } from "zod";

const localStorageEventDetailSchema = z.object({
  key: z.string(),
  newValue: z.string().nullable(),
});

const LOCAL_STORAGE_EVENT = "local-storage";

/**
 * localStorage-backed string state, SSR-safe, synced across tabs
 * (native `storage` event) and within the same tab (custom event).
 *
 * String-only by design: the only persisted values outside the zustand
 * store are raw strings (the gateway API key), which keeps this hook
 * free of JSON/type casts.
 */
export function useLocalStorage(
  key: string,
  initialValue: string,
): [string, (value: string) => void, () => void] {
  const [storedValue, setStoredValue] = React.useState<string>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      return window.localStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = React.useCallback(
    (value: string) => {
      setStoredValue(value);
      try {
        window.localStorage.setItem(key, value);
        window.dispatchEvent(
          new CustomEvent(LOCAL_STORAGE_EVENT, {
            detail: { key, newValue: value },
          }),
        );
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  const removeValue = React.useCallback(() => {
    setStoredValue(initialValue);
    try {
      window.localStorage.removeItem(key);
      window.dispatchEvent(
        new CustomEvent(LOCAL_STORAGE_EVENT, {
          detail: { key, newValue: null },
        }),
      );
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setStoredValue(event.newValue ?? initialValue);
    };

    const handleLocalEvent = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const parsed = localStorageEventDetailSchema.safeParse(event.detail);
      if (!parsed.success || parsed.data.key !== key) return;
      setStoredValue(parsed.data.newValue ?? initialValue);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(LOCAL_STORAGE_EVENT, handleLocalEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LOCAL_STORAGE_EVENT, handleLocalEvent);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
