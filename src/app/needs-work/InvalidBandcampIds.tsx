import { sql } from "drizzle-orm";

import { Link } from "@/components/Link";
import { db } from "@/drizzle/db";
import { albums, shows, performances } from "@/drizzle/schema";
import { getShowTitle } from "@/utils";

export async function InvalidBandcampIds() {
  // Find albums with invalid Bandcamp IDs
  const albumsWithInvalidBandcamp = await db
    .select()
    .from(albums)
    .where(
      sql`${albums.bandcampAlbumId} IS NOT NULL AND ${albums.bandcampAlbumId} !~ '^\\d+$'`,
    );

  // Find shows with invalid Bandcamp IDs
  const showsWithInvalidBandcamp = await db
    .select()
    .from(shows)
    .where(
      sql`${shows.bandcampAlbumId} IS NOT NULL AND ${shows.bandcampAlbumId} !~ '^\\d+$'`,
    );

  // Find performances with invalid Bandcamp IDs
  const performancesWithInvalidBandcamp = await db.query.performances.findMany({
    where: sql`${performances.bandcampTrackId} IS NOT NULL AND ${performances.bandcampTrackId} !~ '^\\d+$'`,
    with: {
      song: { with: { album: true } },
      show: true,
    },
  });

  const totalInvalidBandcamp =
    albumsWithInvalidBandcamp.length +
    showsWithInvalidBandcamp.length +
    performancesWithInvalidBandcamp.length;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">
        Invalid Bandcamp IDs ({totalInvalidBandcamp})
      </h2>
      <p className="text-muted text-sm">
        Bandcamp IDs must contain only numeric digits
      </p>

      {totalInvalidBandcamp === 0 ? (
        <p className="text-muted">No issues found!</p>
      ) : (
        <div className="space-y-6">
          {/* Albums */}
          {albumsWithInvalidBandcamp.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Albums ({albumsWithInvalidBandcamp.length})
              </h3>
              <ul className="space-y-1">
                {albumsWithInvalidBandcamp.map((album) => (
                  <li key={album.id} className="flex items-baseline gap-2">
                    <Link
                      href={`/albums/${album.slug}/edit`}
                      className="hover:text-foreground text-muted underline"
                    >
                      {album.title}
                    </Link>
                    <span className="text-muted font-mono text-sm">
                      (ID: {album.bandcampAlbumId})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Shows */}
          {showsWithInvalidBandcamp.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Shows ({showsWithInvalidBandcamp.length})
              </h3>
              <ul className="space-y-1">
                {showsWithInvalidBandcamp.map((show) => (
                  <li key={show.id} className="flex items-baseline gap-2">
                    <Link
                      href={`/shows/${show.slug}/edit`}
                      className="hover:text-foreground text-muted underline"
                    >
                      {getShowTitle(show)}
                    </Link>
                    <span className="text-muted font-mono text-sm">
                      (ID: {show.bandcampAlbumId})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Performances */}
          {performancesWithInvalidBandcamp.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Performances ({performancesWithInvalidBandcamp.length})
              </h3>
              <ul className="space-y-1">
                {performancesWithInvalidBandcamp.map((performance) => (
                  <li
                    key={performance.id}
                    className="flex items-baseline gap-2"
                  >
                    <Link
                      href={`/performances/${performance.song.slug}-${performance.show.slug}/edit`}
                      className="hover:text-foreground text-muted underline"
                    >
                      {performance.song.title} at{" "}
                      {getShowTitle(performance.show)}
                    </Link>
                    <span className="text-muted font-mono text-sm">
                      (ID: {performance.bandcampTrackId})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
