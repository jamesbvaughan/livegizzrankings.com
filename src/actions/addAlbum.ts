"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";

import type { ActionState } from "@/lib/actionState";

import { ensureAdmin } from "../auth/utils";
import { db } from "../drizzle/db";
import { albums } from "../drizzle/schema";
import { logCreate } from "../lib/activityLogger";
import { sendEditNotification } from "../lib/emailNotification";
import { getAlbumPath } from "../utils";

const addAlbumSchema = zfd.formData({
  title: zfd.text(),
  slug: zfd.text(),
  releaseDate: zfd.text(),
  imageUrl: zfd.text(),
  bandcampAlbumId: zfd.text(),
});

export async function addAlbum(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await ensureAdmin();

  const { title, slug, releaseDate, imageUrl, bandcampAlbumId } =
    addAlbumSchema.parse(formData);

  const existingAlbumWithSlug = await db.query.albums.findFirst({
    where: eq(albums.slug, slug),
  });
  if (existingAlbumWithSlug) {
    return {
      errorMessage: `An album with the slug "${slug}" already exists.`,
      formData,
    };
  }

  const newAlbum = await db.transaction(async (tx) => {
    const [album] = await tx
      .insert(albums)
      .values({
        title,
        slug,
        releaseDate,
        imageUrl,
        bandcampAlbumId,
      })
      .returning();

    await logCreate("album", album.id, album, userId, tx);

    return album;
  });

  console.log(`New album added: ${title} by user ${userId}`);

  await sendEditNotification({
    entityType: "album",
    action: "create",
    entityId: newAlbum.id,
    details: `Title: ${title}`,
  });

  updateTag("albums");

  const albumPath = getAlbumPath(newAlbum);
  return redirect(albumPath);
}
