import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { SignedInOnly } from "@/components/authGates";
import { BoxedButtonLink } from "@/components/BoxedButtonLink";
import { PageContent, PageTitle } from "@/components/ui";
import { db } from "@/drizzle/db";
import type { Show } from "@/drizzle/schema";
import { getShowPath, getShowTitle } from "@/utils";

export const metadata: Metadata = {
  title: "Shows",
  description: `Browse all of King Gizzard & The Lizard Wizard's live shows on Live Gizz Rankings, a site for browsing and voting on the band's best live performances.`,
};

async function ShowList() {
  "use cache";
  cacheTag("shows");
  cacheLife("hours");

  const allShows = await db.query.shows.findMany();

  const showsByYear: Record<string, Show[]> = {};

  for (const show of allShows) {
    const year = new Date(show.date).getFullYear().toString();
    showsByYear[year] ??= [];
    showsByYear[year].push(show);
  }

  const sortedShowsByYear = Object.entries(showsByYear).toSorted(
    ([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA),
  );

  for (const [_year, shows] of sortedShowsByYear) {
    shows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  return (
    <PageContent className="space-y-8">
      {sortedShowsByYear.map(([year, shows]) => {
        return (
          <div key={year} className="space-y-4">
            <h3 className="text-2xl">{year}</h3>

            <div className="grid grid-cols-3 gap-4">
              {shows.map((show, index) => {
                const showPath = getShowPath(show);
                const showTitle = getShowTitle(show);

                return (
                  <Link key={show.id} href={showPath} className="no-underline">
                    <div className="bg-muted-3 aspect-square">
                      {show.imageUrl ? (
                        <Image
                          priority={index < 4}
                          src={show.imageUrl}
                          alt={`Album cover for ${showTitle}`}
                          className="aspect-square w-full"
                          width={500}
                          height={500}
                        />
                      ) : null}
                    </div>

                    <div className="text-lg font-semibold">{showTitle}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </PageContent>
  );
}

export default function ShowsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Shows with ranked performances</PageTitle>
        <SignedInOnly>
          <BoxedButtonLink href="/shows/add">Add Show</BoxedButtonLink>
        </SignedInOnly>
      </div>

      <ShowList />
    </>
  );
}
