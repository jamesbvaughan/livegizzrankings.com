import { isNull } from "drizzle-orm";

import { Link } from "@/components/Link";
import { db } from "@/drizzle/db";
import { performances } from "@/drizzle/schema";
import { getShowTitle } from "@/utils";

export async function MissingBandcampTrackIds() {
  // Find performances where the show has a bandcamp album ID but the performance lacks a track ID
  const performancesMissingTrackId = await db.query.performances.findMany({
    where: isNull(performances.bandcampTrackId),
    with: {
      song: { with: { album: true } },
      show: true,
    },
  });

  // Filter to only include performances where the show has a bandcamp album ID
  const filtered = performancesMissingTrackId.filter(
    (p) => p.show.bandcampAlbumId != null,
  );

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">
        Missing Bandcamp Track IDs ({filtered.length})
      </h2>
      <p className="text-muted text-sm">
        Performances from shows with Bandcamp albums that are missing track IDs
      </p>

      {filtered.length === 0 ? (
        <p className="text-muted">No issues found!</p>
      ) : (
        <ul className="space-y-1">
          {filtered.map((performance) => (
            <li key={performance.id} className="flex items-baseline gap-2">
              <Link
                href={`/performances/${performance.song.slug}-${performance.show.slug}/edit`}
                className="hover:text-foreground text-muted underline"
              >
                {performance.song.title} at {getShowTitle(performance.show)}
              </Link>
              <span className="text-muted font-mono text-sm">
                (Show Bandcamp ID: {performance.show.bandcampAlbumId})
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
