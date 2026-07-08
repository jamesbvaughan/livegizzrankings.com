import Link from "next/link";

import { RandomNotFoundMessage } from "./RandomNotFoundMessage";

export default function NotFound() {
  return (
    <div className="space-y-6">
      <h2 className="text-4xl">404</h2>

      <RandomNotFoundMessage />

      <p>
        <Link href="/">Go back home</Link>
      </p>
    </div>
  );
}
