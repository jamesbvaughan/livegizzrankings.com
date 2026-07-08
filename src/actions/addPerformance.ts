"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";
import z from "zod/v4";

import type { ActionState } from "@/lib/actionState";

import { ensureSignedIn } from "../auth/utils";
import { getPerformancePath } from "../dbUtils";
import { db } from "../drizzle/db";
import { nominations, performances } from "../drizzle/schema";
import { logCreate } from "../lib/activityLogger";
import { sendEditNotification } from "../lib/emailNotification";

const addPerformanceSchema = zfd.formData({
  songId: zfd.text(),
  showId: zfd.text(),
  showPosition: zfd.numeric(),
  bandcampTrackId: zfd.text(z.string().optional()),
  youtubeVideoId: zfd.text(z.string().optional()),
  youtubeVideoStartTime: zfd.numeric(z.number().optional()),
  nominationId: zfd.text(z.string().optional()),
});

export async function addPerformance(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await ensureSignedIn();

  const {
    songId,
    showId,
    showPosition,
    bandcampTrackId,
    youtubeVideoId,
    youtubeVideoStartTime,
    nominationId,
  } = addPerformanceSchema.parse(formData);

  // Validate that at least one streaming source is provided
  if (!bandcampTrackId && !youtubeVideoId) {
    return {
      errorMessage:
        "Please provide either a YouTube Video ID or a Bandcamp Track ID so people can listen to this performance.",
      formData,
    };
  }

  // Check if performance already exists for this song and show
  const existingPerformance = await db.query.performances.findFirst({
    where: and(
      eq(performances.songId, songId),
      eq(performances.showId, showId),
    ),
  });
  if (existingPerformance) {
    return {
      errorMessage: "A performance for this song and show already exists.",
      formData,
    };
  }

  const newPerformance = await db.transaction(async (tx) => {
    const [performance] = await tx
      .insert(performances)
      .values({
        songId,
        showId,
        showPosition,
        bandcampTrackId: bandcampTrackId ?? null,
        youtubeVideoId: youtubeVideoId ?? null,
        youtubeVideoStartTime: youtubeVideoStartTime ?? null,
      })
      .returning();

    await logCreate("performance", performance.id, performance, userId, tx);

    // Link the nomination to this performance if nomination ID was provided
    if (nominationId) {
      await tx
        .update(nominations)
        .set({
          performanceId: performance.id,
        })
        .where(eq(nominations.id, nominationId));
    }

    return performance;
  });

  console.log(`New performance added by user ${userId}`);

  await sendEditNotification({
    entityType: "performance",
    action: "create",
    entityId: newPerformance.id,
    details: `Song: ${songId}, Show: ${showId}`,
  });

  updateTag("performances");

  // Revalidate nominations page if a nomination was linked
  if (nominationId) {
    revalidatePath("/nominations");
  }

  const performancePath = await getPerformancePath(newPerformance);
  return redirect(performancePath);
}
