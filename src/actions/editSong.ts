"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";

import type { ActionState } from "@/lib/actionState";

import { ensureAdmin } from "../auth/utils";
import { db } from "../drizzle/db";
import { songs } from "../drizzle/schema";
import { logUpdate } from "../lib/activityLogger";
import { sendEditNotification } from "../lib/emailNotification";
import { getSongPath } from "../utils";

const editSongSchema = zfd.formData({
  songId: zfd.text(),
  title: zfd.text(),
  slug: zfd.text(),
  albumId: zfd.text(),
  albumPosition: zfd.numeric(),
});

export async function editSong(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await ensureAdmin();

  const { songId, title, slug, albumId, albumPosition } =
    editSongSchema.parse(formData);

  const existingSong = await db.query.songs.findFirst({
    where: eq(songs.id, songId),
  });
  if (!existingSong) {
    return {
      errorMessage: "Song not found",
      formData,
    };
  }

  // Check if slug is already used by a different song
  const existingSongWithSlug = await db.query.songs.findFirst({
    where: eq(songs.slug, slug),
  });
  if (existingSongWithSlug && existingSongWithSlug.id !== songId) {
    return {
      errorMessage: `A song with the slug "${slug}" already exists.`,
      formData,
    };
  }

  const updatedSong = await db.transaction(async (tx) => {
    const [song] = await tx
      .update(songs)
      .set({
        title,
        slug,
        albumId,
        albumPosition,
      })
      .where(eq(songs.id, songId))
      .returning();

    await logUpdate("song", songId, existingSong, song, userId, tx);

    return song;
  });

  console.log(`Song updated: ${title} by user ${userId}`);

  await sendEditNotification({
    entityType: "song",
    action: "update",
    entityId: songId,
    details: `Title: ${title}`,
  });

  const songPath = getSongPath(updatedSong);

  updateTag("songs");

  return redirect(songPath);
}
