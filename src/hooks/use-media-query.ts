"use client";

import * as React from "react";

/**
 * SSR-safe media-query subscription. Returns `false` on the server and on the
 * first client render, so it must only gate behaviour (e.g. `inert`), never
 * layout — Tailwind breakpoints own layout, and disagreeing with them would
 * flash. Used to mark panels covered by a full-screen overlay as inert.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
