"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";
import z from "zod/v4";

import type { ActionState } from "@/lib/actionState";

import { ensureSignedIn } from "../auth/utils";
import { db } from "../drizzle/db";
import { shows, showVideos } from "../drizzle/schema";
import { logUpdate } from "../lib/activityLogger";
import { sendEditNotification } from "../lib/emailNotification";
import { getShowPath } from "../utils";

const editShowSchema = zfd.formData({
  showId: zfd.text(),
  slug: zfd.text(),
  location: zfd.text(),
  date: zfd.text(),
  bandcampAlbumId: zfd.text(z.string().optional()),
  youtubeVideoId: zfd.text(z.string().optional()),
  imageUrl: zfd.text(),
  videos: zfd.text(z.string().optional()),
});

export async function editShow(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await ensureSignedIn();

  const {
    showId,
    slug,
    location,
    date,
    bandcampAlbumId,
    youtubeVideoId,
    imageUrl,
    videos: videosJson,
  } = editShowSchema.parse(formData);

  const existingShow = await db.query.shows.findFirst({
    where: eq(shows.id, showId),
  });
  if (!existingShow) {
    return {
      errorMessage: "Show not found",
      formData,
    };
  }

  // Check if slug is already used by a different show
  const existingShowWithSlug = await db.query.shows.findFirst({
    where: eq(shows.slug, slug),
  });
  if (existingShowWithSlug && existingShowWithSlug.id !== showId) {
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

  const updatedShow = await db.transaction(async (tx) => {
    const [show] = await tx
      .update(shows)
      .set({
        slug,
        location,
        date,
        bandcampAlbumId: bandcampAlbumId ?? null,
        youtubeVideoId: youtubeVideoId ?? null,
        imageUrl,
      })
      .where(eq(shows.id, showId))
      .returning();

    await logUpdate("show", showId, existingShow, show, userId, tx);

    // Delete existing videos and insert new ones
    await tx.delete(showVideos).where(eq(showVideos.showId, showId));

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

  console.log(`Show updated: ${location} ${date} by user ${userId}`);

  await sendEditNotification({
    entityType: "show",
    action: "update",
    entityId: showId,
    details: `Location: ${location}, Date: ${date}`,
  });

  const showPath = getShowPath(updatedShow);

  updateTag("shows");

  return redirect(showPath);
}
