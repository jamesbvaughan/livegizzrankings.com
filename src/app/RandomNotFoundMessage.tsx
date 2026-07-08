"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const notFoundMessages: ReactNode[] = [
  "Searching... but there's nothing at this URL!",
  "Your real's not real, and neither is this URL.",
  <span key="planet-b">
    There is no Planet B.
    <br />
    There&apos;s also no webpage at this URL.
  </span>,
  "To have no soul, to have no body... Life was a hallucination... just like the page at this URL.",
  <span key="mirage">
    Is that a <s>city</s> <i>webpage</i> drifting from afar or a reflection
    mirage?
  </span>,
  <span key="magenta">
    I don&apos;t believe you
    <br />
    Your eyes deceive you
    <br />
    Better check yourself in, the mirage is creeping
    <br />
    Outwards from your dream, can&apos;t you see you&apos;ve gone insane?
    <br />
    <br />
    Magenta Mountain might exist, but a webpage at this URL does not.
  </span>,
];

/**
 * Picks a random message on the client so that it's different each time the
 * page loads.
 *
 * The message deliberately isn't chosen during server rendering: the 404 page
 * needs to stay fully static so that `notFound()` responses can be cached and
 * served with a real 404 status. (It also can't be chosen during the initial
 * client render, since that would mismatch the server-rendered HTML.)
 */
export function RandomNotFoundMessage() {
  const [message, setMessage] = useState<ReactNode>(null);

  useEffect(() => {
    setMessage(
      notFoundMessages[Math.floor(Math.random() * notFoundMessages.length)],
    );
  }, []);

  return <p className="min-h-7 text-xl">{message}</p>;
}
