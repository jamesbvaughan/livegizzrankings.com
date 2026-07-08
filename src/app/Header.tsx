import Image from "next/image";
import Link from "next/link";

import { BoxedButtonLink } from "@/components/BoxedButtonLink";

import lgrHandwritten from "./lgr-handwritten.png";

function HeaderMenu() {
  return (
    <div className="text-muted flex items-center space-x-4">
      <Link href="/songs" className="no-underline">
        Songs
      </Link>
      <Link href="/albums" className="no-underline">
        Albums
      </Link>
      <Link href="/shows" className="no-underline">
        Shows
      </Link>

      <BoxedButtonLink prefetch={false} href="/rank">
        Vote
      </BoxedButtonLink>
    </div>
  );
}

export function Header() {
  return (
    <header className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between">
      <Link href="/" className="shrink-0 no-underline">
        <Image
          priority
          src={lgrHandwritten}
          alt="Live Gizz Rankings"
          className="h-36 w-auto"
        />
      </Link>

      <HeaderMenu />
    </header>
  );
}
