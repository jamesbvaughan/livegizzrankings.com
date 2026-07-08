import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { AdminOnly } from "@/components/authGates";
import { BoxedButtonLink } from "@/components/BoxedButtonLink";
import { SongRow } from "@/components/SongRow";
import {
  PageContent,
  PageSubtitle,
  PageTitle,
  PageType,
} from "@/components/ui";
import { getAlbumBySlug } from "@/dbUtils";
import { db } from "@/drizzle/db";
import { songs } from "@/drizzle/schema";

export async function generateStaticParams(): Promise<Params[]> {
  const allAlbums = await db.query.albums.findMany({ columns: { slug: true } });
  return allAlbums.map((album) => ({ albumSlug: album.slug }));
}

interface Params {
  albumSlug: string;
}
interface Props {
  params: Promise<Params>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { albumSlug } = await params;
  const album = await getAlbumBySlug(albumSlug);

  return {
    title: album.title,
    description: `Find the top-ranked performances of songs from King Gizzard & The Lizard Wizard's album ${album.title} on Live Gizz Rankings, a site for browsing and voting on the band's best live performances.`,
  };
}

async function getAlbumSongs(albumId: string) {
  "use cache";
  cacheTag("songs");
  cacheLife("hours");

  const result = await db.query.songs.findMany({
    where: eq(songs.albumId, albumId),
    orderBy: asc(songs.albumPosition),
  });

  return result;
}

export default async function Album({ params }: Props) {
  const { albumSlug } = await params;
  const album = await getAlbumBySlug(albumSlug);

  const albumSongs = await getAlbumSongs(album.id);

  const releaseDate = new Date(album.releaseDate);
  const formattedReleaseDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(releaseDate);

  return (
    <>
      <PageType>Album</PageType>

      <div className="flex items-center justify-between">
        <PageTitle>{album.title}</PageTitle>
        <AdminOnly>
          <div className="flex gap-2">
            <BoxedButtonLink href={`/songs/add?album=${album.id}`}>
              Add Song
            </BoxedButtonLink>
            <BoxedButtonLink href={`/albums/${album.slug}/edit`}>
              Edit Album
            </BoxedButtonLink>
          </div>
        </AdminOnly>
      </div>

      <PageSubtitle>
        Released on <time>{formattedReleaseDate}</time>
      </PageSubtitle>

      <PageContent className="space-y-8">
        <Image
          src={album.imageUrl}
          alt={`Album cover for ${album.title}`}
          className="aspect-square w-full"
          width={500}
          height={500}
        />

        <div className="space-y-2">
          {albumSongs.map((song) => {
            return <SongRow key={song.id} song={song} />;
          })}
        </div>

        <Link href="/albums" className="inline-block no-underline">
          Back to albums
        </Link>
      </PageContent>
    </>
  );
}
