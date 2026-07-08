import { formatDistanceToNow } from "date-fns";
import { desc, and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { isAdmin } from "@/auth/utils";
import { BoxedButtonLink } from "@/components/BoxedButtonLink";
import { PageContent, PageTitle } from "@/components/ui";
import { getPerformancePath } from "@/dbUtils";
import { db } from "@/drizzle/db";
import type {
  Album,
  Nomination,
  Performance,
  Show,
  Song,
} from "@/drizzle/schema";
import {
  nominations as nominationsTable,
  performances,
} from "@/drizzle/schema";
import { parseNomination } from "@/lib/nominationParser";
import { getPerformanceTitle } from "@/utils";

import { LinkPerformanceButton } from "./LinkPerformanceButton";

export const metadata: Metadata = {
  title: "Nominations",
};

async function NominationRow({
  nomination,
  showEditLink = false,
  showAddPerformanceLink = false,
  showLinkPerformanceButton = false,
  songs,
  shows,
}: {
  nomination: Nomination;
  showEditLink?: boolean;
  showAddPerformanceLink?: boolean;
  showLinkPerformanceButton?: boolean;
  songs: Array<Song & { album: Album }>;
  shows: Show[];
}) {
  const performancePath = nomination.performanceId
    ? await getPerformancePath(nomination.performanceId)
    : null;

  // Parse nomination to find potential existing performance
  let suggestedPerformance: (Performance & { song: Song; show: Show }) | null =
    null;
  if (!nomination.performanceId && !nomination.willNotAdd) {
    const parsed = parseNomination(nomination.message, { songs, shows });

    if (parsed.songId && parsed.showId && parsed.confidence > 0.5) {
      // Only suggest if confidence is reasonable
      const existingPerformance = await db.query.performances.findFirst({
        where: and(
          eq(performances.songId, parsed.songId),
          eq(performances.showId, parsed.showId),
        ),
        with: {
          song: true,
          show: true,
        },
      });
      if (existingPerformance) {
        suggestedPerformance = existingPerformance;
      }
    }
  }

  return (
    <li className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div>
            {performancePath ? (
              <span>
                <del>{nomination.message}</del> -{" "}
                <Link href={performancePath}>Added!</Link>
              </span>
            ) : (
              <span>{nomination.message}</span>
            )}
          </div>
          {suggestedPerformance && (
            <div className="text-muted mt-1 flex items-center gap-2 text-sm">
              <span>
                Maybe:{" "}
                {getPerformanceTitle(
                  suggestedPerformance.song,
                  suggestedPerformance.show,
                )}
              </span>
              {showLinkPerformanceButton && (
                <LinkPerformanceButton
                  nominationId={nomination.id}
                  performanceId={suggestedPerformance.id}
                />
              )}
            </div>
          )}
          <div className="text-muted mt-1 text-sm">
            Submitted{" "}
            {formatDistanceToNow(nomination.createdAt, { addSuffix: true })} by{" "}
            {nomination.userId ?? "an anonymous visitor"}
          </div>
        </div>
        <div className="flex gap-2">
          {showAddPerformanceLink &&
            !nomination.performanceId &&
            !nomination.willNotAdd && (
              <BoxedButtonLink
                href={`/performances/add?nomination=${encodeURIComponent(nomination.message)}&nominationId=${nomination.id}`}
                className="shrink-0"
              >
                Add Performance
              </BoxedButtonLink>
            )}
          {showEditLink && (
            <BoxedButtonLink
              href={`/nominations/${nomination.id}/edit`}
              className="shrink-0"
            >
              Edit
            </BoxedButtonLink>
          )}
        </div>
      </div>
    </li>
  );
}

function NominationList({
  nominations,
  showEditLinks = false,
  showAddPerformanceLinks = false,
  showLinkPerformanceButtons = false,
  songs,
  shows,
}: {
  nominations: Nomination[];
  showEditLinks?: boolean;
  showAddPerformanceLinks?: boolean;
  showLinkPerformanceButtons?: boolean;
  songs: Array<Song & { album: Album }>;
  shows: Show[];
}) {
  return (
    <ul className="ml-6 list-disc space-y-2">
      {nominations.map((nomination) => {
        return (
          <NominationRow
            key={nomination.id}
            nomination={nomination}
            showEditLink={showEditLinks}
            showAddPerformanceLink={showAddPerformanceLinks}
            showLinkPerformanceButton={showLinkPerformanceButtons}
            songs={songs}
            shows={shows}
          />
        );
      })}
    </ul>
  );
}

function partitionNominations(allNominations: Nomination[]) {
  return {
    toBeAdded: allNominations.filter(
      (nomination) =>
        !nomination.willNotAdd && nomination.performanceId == null,
    ),
    added: allNominations.filter(
      (nomination) => nomination.performanceId != null,
    ),
    willNotBeAdded: allNominations.filter(
      (nomination) => nomination.willNotAdd,
    ),
  };
}

export default async function NominationsPage() {
  const [allNominations, adminStatus, songs, shows] = await Promise.all([
    db.query.nominations.findMany({
      orderBy: desc(nominationsTable.createdAt),
    }),
    isAdmin(),
    db.query.songs.findMany({
      with: {
        album: true,
      },
    }),
    db.query.shows.findMany(),
  ]);

  const nominationGroups = partitionNominations(allNominations);

  return (
    <>
      <PageTitle>Performance nominations</PageTitle>

      <PageContent className="space-y-6">
        <p>
          These are user-submitted nominations for performances to add to the
          database.
        </p>

        <div className="space-y-4">
          <h2 className="text-2xl">
            Nominated performances to be added (
            {nominationGroups.toBeAdded.length})
          </h2>
          <NominationList
            nominations={nominationGroups.toBeAdded}
            showEditLinks={adminStatus}
            showAddPerformanceLinks={adminStatus}
            showLinkPerformanceButtons={adminStatus}
            songs={songs}
            shows={shows}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl">
            Nominated performances that have been added (
            {nominationGroups.added.length})
          </h2>
          <NominationList
            nominations={nominationGroups.added}
            showEditLinks={adminStatus}
            songs={songs}
            shows={shows}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl">
            Nominated performances will not be added (
            {nominationGroups.willNotBeAdded.length})
          </h2>
          <p>
            These nominations are either ambiguous or invalid. If one of these
            is your nomination, please re-submit it with more context.
          </p>
          <NominationList
            nominations={nominationGroups.willNotBeAdded}
            showEditLinks={adminStatus}
            songs={songs}
            shows={shows}
          />
        </div>
      </PageContent>
    </>
  );
}
