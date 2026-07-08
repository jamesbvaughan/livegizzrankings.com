"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";

import type { ActionState } from "@/lib/actionState";

import { ensureAdmin } from "../auth/utils";
import { db } from "../drizzle/db";
import { albums } from "../drizzle/schema";
import { logUpdate } from "../lib/activityLogger";
import { sendEditNotification } from "../lib/emailNotification";
import { getAlbumPath } from "../utils";

const editAlbumSchema = zfd.formData({
  albumId: zfd.text(),
  title: zfd.text(),
  slug: zfd.text(),
  releaseDate: zfd.text(),
  imageUrl: zfd.text(),
  bandcampAlbumId: zfd.text(),
});

export async function editAlbum(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await ensureAdmin();

  const { albumId, title, slug, releaseDate, imageUrl, bandcampAlbumId } =
    editAlbumSchema.parse(formData);

  const existingAlbum = await db.query.albums.findFirst({
    where: eq(albums.id, albumId),
  });
  if (!existingAlbum) {
    return {
      errorMessage: "Album not found",
      formData,
    };
  }

  // Check if slug is already used by a different album
  const existingAlbumWithSlug = await db.query.albums.findFirst({
    where: and(eq(albums.slug, slug), ne(albums.id, albumId)),
  });
  if (existingAlbumWithSlug) {
    return {
      errorMessage: `An album with the slug "${slug}" already exists.`,
      formData,
    };
  }

  const updatedAlbum = await db.transaction(async (tx) => {
    const [album] = await tx
      .update(albums)
      .set({
        title,
        slug,
        releaseDate,
        imageUrl,
        bandcampAlbumId,
      })
      .where(eq(albums.id, albumId))
      .returning();

    await logUpdate("album", albumId, existingAlbum, album, userId, tx);

    return album;
  });

  console.log(`Album updated: ${title} by user ${userId}`);

  await sendEditNotification({
    entityType: "album",
    action: "update",
    entityId: albumId,
    details: `Title: ${title}`,
  });

  const albumPath = getAlbumPath(updatedAlbum);

  revalidatePath("/albums");
  revalidatePath(albumPath);

  return redirect(albumPath);
}
