"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";

import type { ActionState } from "@/lib/actionState";

import { ensureAdmin } from "../auth/utils";
import { db } from "../drizzle/db";
import { songs } from "../drizzle/schema";
import { logCreate } from "../lib/activityLogger";
import { sendEditNotification } from "../lib/emailNotification";
import { getSongPath } from "../utils";

const addSongSchema = zfd.formData({
  title: zfd.text(),
  slug: zfd.text(),
  albumId: zfd.text(),
  albumPosition: zfd.numeric(),
});

export async function addSong(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await ensureAdmin();

  const { title, slug, albumId, albumPosition } = addSongSchema.parse(formData);

  const existingSongWithSlug = await db.query.songs.findFirst({
    where: eq(songs.slug, slug),
  });
  if (existingSongWithSlug) {
    return {
      errorMessage: `A song with the slug "${slug}" already exists.`,
      formData,
    };
  }

  const newSong = await db.transaction(async (tx) => {
    const [song] = await tx
      .insert(songs)
      .values({
        title,
        slug,
        albumId,
        albumPosition,
      })
      .returning();

    await logCreate("song", song.id, song, userId, tx);

    return song;
  });

  console.log(`New song added: ${title} by user ${userId}`);

  await sendEditNotification({
    entityType: "song",
    action: "create",
    entityId: newSong.id,
    details: `Title: ${title}`,
  });

  revalidatePath("/songs");
  revalidatePath(`/albums/${albumId}`);

  const songPath = getSongPath(newSong);
  return redirect(songPath);
}
