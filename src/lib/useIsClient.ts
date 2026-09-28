import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * Returns `false` during server rendering and hydration, and `true` once
 * rendering on the client. Useful for client-only content that would otherwise
 * cause a hydration mismatch.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
