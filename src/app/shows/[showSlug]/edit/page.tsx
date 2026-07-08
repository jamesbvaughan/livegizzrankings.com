import { eq } from "drizzle-orm";
import type { Metadata } from "next";

import { editShow } from "@/actions/editShow";
import { ensureSignedIn } from "@/auth/utils";
import ShowForm from "@/components/ShowForm";
import { PageContent, PageTitle } from "@/components/ui";
import { getShowBySlug } from "@/dbUtils";
import { db } from "@/drizzle/db";
import { showVideos } from "@/drizzle/schema";
import { getShowTitle } from "@/utils";

interface EditShowPageProps {
  params: Promise<{ showSlug: string }>;
}

export async function generateMetadata({
  params,
}: EditShowPageProps): Promise<Metadata> {
  const { showSlug } = await params;
  const show = await getShowBySlug(showSlug);

  const showTitle = getShowTitle(show);

  return {
    title: `Edit Show: ${showTitle}`,
    description: `Edit details for the King Gizzard & The Lizard Wizard show "${showTitle}" on Live Gizz Rankings.`,
  };
}

export default async function EditShowPage({ params }: EditShowPageProps) {
  await ensureSignedIn();

  const { showSlug } = await params;
  const show = await getShowBySlug(showSlug);

  const videos = await db.query.showVideos.findMany({
    where: eq(showVideos.showId, show.id),
  });

  const showTitle = getShowTitle(show);

  return (
    <>
      <PageTitle>Edit Show: {showTitle}</PageTitle>

      <PageContent>
        <ShowForm
          action={editShow}
          show={show}
          videos={videos}
          submitLabel="Update Show"
        />
      </PageContent>
    </>
  );
}
