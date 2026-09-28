"use client";

import { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";

/**
 * A progress bar across the top of the page, shown while navigation from the
 * enclosing link is in progress. It must be rendered inside a `<Link>`.
 *
 * `useLinkStatus` flips to pending as soon as the link is clicked, on the
 * client, so this gives immediate feedback even when the network is too slow
 * for the destination's loading state to have arrived yet.
 *
 * The bar is portaled to the body so it doesn't affect the link's layout. Its
 * animation starts after a short delay, so it doesn't flash for navigations
 * that finish instantly (like to already-prefetched pages).
 */
export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return createPortal(
    <div
      // Purely visual: Next's route announcer tells screen readers when the
      // new page has loaded.
      aria-hidden
      className="bg-red animate-link-pending pointer-events-none fixed top-0 left-0 z-50 h-1"
    />,
    document.body,
  );
}
