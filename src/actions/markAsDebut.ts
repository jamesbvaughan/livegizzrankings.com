"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureSignedIn } from "../auth/utils";
import { getPerformancePath } from "../dbUtils";
import { db } from "../drizzle/db";
import { performances, songs } from "../drizzle/schema";

export async function markAsDebut(performanceId: string) {
  await ensureSignedIn();

  const performance = await db.query.performances.findFirst({
    where: eq(performances.id, performanceId),
  });

  if (!performance) {
    throw new Error("Performance not found");
  }

  await db
    .update(songs)
    .set({ debutPerformanceId: performanceId })
    .where(eq(songs.id, performance.songId));

  const performancePath = await getPerformancePath(performance);

  revalidatePath(`/songs/${performance.songId}`);
  revalidatePath(performancePath);

  redirect(performancePath);
}
