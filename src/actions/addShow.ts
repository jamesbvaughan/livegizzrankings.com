"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";
import z from "zod/v4";

import { ensureSignedIn } from "../auth/utils";
import { db } from "../drizzle/db";
import { shows, showVideos } from "../drizzle/schema";
import { logCreate } from "../lib/activityLogger";
import { sendEditNotification } from "../lib/emailNotification";
import { getShowPath } from "../utils";
import { eq } from "drizzle-orm";
import type { ActionState } from "@/lib/actionState";

const addShowSchema = zfd.formData({
  slug: zfd.text(),
  location: zfd.text(),
  date: zfd.text(),
  bandcampAlbumId: zfd.text(z.string().optional()),
  youtubeVideoId: zfd.text(z.string().optional()),
  imageUrl: zfd.text(),
  videos: zfd.text(z.string().optional()),
});

export async function addShow(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await ensureSignedIn();

  const {
    slug,
    location,
    date,
    bandcampAlbumId,
    youtubeVideoId,
    imageUrl,
    videos: videosJson,
  } = addShowSchema.parse(formData);

  const existingShowWithSlug = await db.query.shows.findFirst({
    where: eq(shows.slug, slug),
  });
  if (existingShowWithSlug) {
    return {
      errorMessage: `A show with the slug "${slug}" already exists.`,
      formData,
    };
  }

  // Parse videos JSON
  let videos: Array<{ youtubeVideoId: string; title: string }> = [];
  if (videosJson) {
    try {
      videos = JSON.parse(videosJson) as Array<{
        youtubeVideoId: string;
        title: string;
      }>;
    } catch (error) {
      console.error("Failed to parse videos JSON:", error);
    }
  }

  const newShow = await db.transaction(async (tx) => {
    const [show] = await tx
      .insert(shows)
      .values({
        slug,
        location,
        date,
        bandcampAlbumId: bandcampAlbumId ?? null,
        youtubeVideoId: youtubeVideoId ?? null,
        imageUrl,
      })
      .returning();

    await logCreate("show", show.id, show, userId, tx);

    // Insert videos
    if (videos.length > 0) {
      await tx.insert(showVideos).values(
        videos.map((video) => ({
          showId: show.id,
          youtubeVideoId: video.youtubeVideoId,
          title: video.title,
        })),
      );
    }

    return show;
  });

  console.log(`New show added: ${location} ${date} by user ${userId}`);

  await sendEditNotification({
    entityType: "show",
    action: "create",
    entityId: newShow.id,
    details: `${location} - ${date}`,
  });

  revalidatePath("/shows");

  const showPath = getShowPath(newShow);
  return redirect(showPath);
}
