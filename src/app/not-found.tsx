import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

const notFoundMessages: React.ReactNode[] = [
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

// Render the message at request time so that it's different each time the
// page loads. (`connection()` defers rendering past the prerendered shell.)
async function RandomNotFoundMessage() {
  await connection();

  const message =
    notFoundMessages[Math.floor(Math.random() * notFoundMessages.length)];

  return <p className="text-xl">{message}</p>;
}

const messageFallback = <p className="text-xl" />;

export default function NotFound() {
  return (
    <div className="space-y-6">
      <h2 className="text-4xl">404</h2>

      <Suspense fallback={messageFallback}>
        <RandomNotFoundMessage />
      </Suspense>

      <p>
        <Link href="/">Go back home</Link>
      </p>
    </div>
  );
}
