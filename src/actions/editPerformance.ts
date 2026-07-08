"use server";

import { eq } from "drizzle-orm";
import { and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";
import z from "zod/v4";

import type { ActionState } from "@/lib/actionState";

import { ensureSignedIn } from "../auth/utils";
import { getPerformancePath } from "../dbUtils";
import { db } from "../drizzle/db";
import { performances } from "../drizzle/schema";
import { logUpdate } from "../lib/activityLogger";
import { sendEditNotification } from "../lib/emailNotification";

const editPerformanceSchema = zfd.formData({
  performanceId: zfd.text(),
  songId: zfd.text(),
  showId: zfd.text(),
  showPosition: zfd.numeric(),
  bandcampTrackId: zfd.text(z.string().optional()),
  youtubeVideoId: zfd.text(z.string().optional()),
  youtubeVideoStartTime: zfd.numeric(z.number().optional()),
});

export async function editPerformance(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await ensureSignedIn();

  const {
    performanceId,
    songId,
    showId,
    showPosition,
    bandcampTrackId,
    youtubeVideoId,
    youtubeVideoStartTime,
  } = editPerformanceSchema.parse(formData);

  // Validate that at least one streaming source is provided
  if (!bandcampTrackId && !youtubeVideoId) {
    return {
      errorMessage:
        "Please provide either a YouTube Video ID or a Bandcamp Track ID so people can listen to this performance.",
      formData,
    };
  }

  const existingPerformance = await db.query.performances.findFirst({
    where: eq(performances.id, performanceId),
  });
  if (!existingPerformance) {
    return {
      errorMessage: "Performance not found",
      formData,
    };
  }

  // Check if another performance already exists for this song and show
  const conflictingPerformance = await db.query.performances.findFirst({
    where: and(
      eq(performances.songId, songId),
      eq(performances.showId, showId),
      ne(performances.id, performanceId),
    ),
  });
  if (conflictingPerformance) {
    return {
      errorMessage: "A performance for this song and show already exists.",
      formData,
    };
  }

  const updatedPerformance = await db.transaction(async (tx) => {
    const [performance] = await tx
      .update(performances)
      .set({
        songId,
        showId,
        showPosition,
        bandcampTrackId: bandcampTrackId ?? null,
        youtubeVideoId: youtubeVideoId ?? null,
        youtubeVideoStartTime: youtubeVideoStartTime ?? null,
      })
      .where(eq(performances.id, performanceId))
      .returning();

    await logUpdate(
      "performance",
      performanceId,
      existingPerformance,
      performance,
      userId,
      tx,
    );

    return performance;
  });

  console.log(`Performance updated by user ${userId}`);

  await sendEditNotification({
    entityType: "performance",
    action: "update",
    entityId: performanceId,
    details: `Song: ${songId}, Show: ${showId}`,
  });

  const performancePath = await getPerformancePath(updatedPerformance);

  revalidatePath("/performances");
  revalidatePath(`/songs/${songId}`);
  revalidatePath(`/shows/${showId}`);
  revalidatePath(performancePath);

  return redirect(performancePath);
}
