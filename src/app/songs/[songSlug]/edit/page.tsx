import type { Metadata } from "next";

import { editSong } from "@/actions/editSong";
import { ensureAdmin } from "@/auth/utils";
import SongForm from "@/components/SongForm";
import { PageContent, PageTitle } from "@/components/ui";
import { getSongBySlug } from "@/dbUtils";
import { db } from "@/drizzle/db";

interface EditSongPageProps {
  params: Promise<{ songSlug: string }>;
}

export async function generateMetadata({
  params,
}: EditSongPageProps): Promise<Metadata> {
  const { songSlug } = await params;
  const song = await getSongBySlug(songSlug);

  return {
    title: `Edit Song: ${song.title}`,
    description: `Edit details for the King Gizzard & The Lizard Wizard song "${song.title}" on Live Gizz Rankings.`,
  };
}

export default async function EditSongPage({ params }: EditSongPageProps) {
  await ensureAdmin();

  const { songSlug } = await params;
  const [song, albums] = await Promise.all([
    getSongBySlug(songSlug),
    db.query.albums.findMany(),
  ]);

  return (
    <>
      <PageTitle>Edit Song: {song.title}</PageTitle>

      <PageContent>
        <SongForm
          action={editSong}
          albums={albums}
          song={song}
          submitLabel="Update Song"
        />
      </PageContent>
    </>
  );
}
