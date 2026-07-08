import { desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { db } from "@/drizzle/db";
import { votes } from "@/drizzle/schema";
import {
  getPerformancePathBySongAndShow,
  getShowTitle,
  getSongPath,
} from "@/utils";

export async function RecentVotes() {
  "use cache";
  // Invalidated by the `vote` action whenever a new vote is recorded. The
  // cache lifetime is just a safety net for data (like joined show and song
  // rows) that can change without a new vote being cast.
  cacheTag("votes", "songs", "shows");
  cacheLife("hours");

  const allVotes = await db.query.votes.findMany({
    orderBy: desc(votes.createdAt),
    limit: 5,
    with: {
      performance1: {
        with: {
          show: true,
          song: true,
        },
      },
      performance2: {
        with: {
          show: true,
          song: true,
        },
      },
      winner: true,
    },
  });

  return (
    <div className="space-y-2">
      {allVotes.map((vote) => {
        const winner =
          vote.performance1.id === vote.winner.id
            ? vote.performance1
            : vote.performance2;
        const loser =
          vote.performance1.id === vote.winner.id
            ? vote.performance2
            : vote.performance1;

        const winnerTitle = getShowTitle(winner.show);
        const loserTitle = getShowTitle(loser.show);

        const songPath = getSongPath(winner.song);
        const winnerPath = getPerformancePathBySongAndShow(
          winner.song,
          winner.show,
        );
        const loserPath = getPerformancePathBySongAndShow(
          loser.song,
          loser.show,
        );

        const formattedDate = new Intl.DateTimeFormat(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        }).format(vote.createdAt);

        return (
          <div key={vote.id} className="flex items-start space-x-2">
            <Link href={winnerPath} className="shrink-0">
              <Image
                src={winner.show.imageUrl ?? ""}
                alt={winnerTitle}
                height={60}
                width={60}
              />
            </Link>

            <div>
              <div className="text-lg leading-6">
                <Link href={songPath} className="font-bold no-underline">
                  {winner.song.title}
                </Link>{" "}
                at{" "}
                <Link href={winnerPath} className="font-bold no-underline">
                  {winnerTitle}
                </Link>{" "}
                beat{" "}
                <Link href={loserPath} className="font-bold no-underline">
                  {loserTitle}
                </Link>
              </div>

              <time className="text-muted">{formattedDate}</time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
