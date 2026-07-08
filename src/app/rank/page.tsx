import type { Metadata } from "next";
import Link from "next/link";

import { MediaPlayers } from "@/components/MediaPlayers";
import { BoxedButtonLink } from "@/components/BoxedButtonLink";
import { getPerformanceById, getSongBySlug } from "@/dbUtils";
import { getPerformancePathBySongAndShow, getShowTitle } from "@/utils";

import { auth } from "@clerk/nextjs/server";

import { getRandomPairForCurrentUser } from "./getRandomPair";
import { PerformanceFormButtons } from "./PerformanceVoteFormButton";

export const metadata: Metadata = {
  title: "Rank Songs",
};

interface SearchParams {
  song?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function Rank({ searchParams }: Props) {
  await auth.protect();

  const { song: songSlug } = await searchParams;
  const filterSong = songSlug ? await getSongBySlug(songSlug) : null;

  const pair = await getRandomPairForCurrentUser(filterSong?.id);
  if (!pair) {
    if (filterSong) {
      return (
        <div className="space-y-4 text-center">
          <p>
            You&apos;ve voted on every pair of {filterSong.title} performances
            that&apos;s been added to the site.
          </p>
          <p>Thank you!</p>
          <p>
            <BoxedButtonLink href="/rank">Vote on all songs</BoxedButtonLink>
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p>
          You&apos;ve voted on every pair of performances that&apos;s been added
          to the site. Thank you! People add performances periodically, so check
          back later to see if you&apos;ve got new ones to vote on.
        </p>

        <p>
          You can{" "}
          <Link href="/albums">browse all the rankings by album here</Link> or{" "}
          <Link href="/performances/add">add more performances to vote on</Link>
          .
        </p>
      </div>
    );
  }

  const performanceA = await getPerformanceById(pair[0]);
  const performanceB = await getPerformanceById(pair[1]);
  const song = performanceA.song;

  const performances = [performanceA, performanceB];

  return (
    <div className="space-y-10">
      {filterSong && (
        <div className="text-muted text-center">
          Voting session filtered to performances of {filterSong.title}.{" "}
          <Link href="/rank">Clear filter</Link>
        </div>
      )}

      <h2 className="text-center text-2xl sm:text-4xl">
        Which <span className="font-bold">{song.title}</span> is better?
      </h2>

      <PerformanceFormButtons
        key={performanceA.id + performanceB.id}
        performanceA={performanceA}
        performanceB={performanceB}
      />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
        {performances.map((performance) => {
          const showTitle = getShowTitle(performance.show);
          const performancePath = getPerformancePathBySongAndShow(
            performance.song,
            performance.show,
          );

          return (
            <div key={performance.id} className="space-y-4">
              <h3 className="min-h-14 text-xl">
                Listen to{" "}
                <Link href={performancePath} className="no-underline">
                  {song.title} at {showTitle}
                </Link>
                :
              </h3>

              <MediaPlayers performance={performance} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
