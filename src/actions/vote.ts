"use server";

import { and, asc, eq, inArray, or } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { zfd } from "zod-form-data";

import { ensureSignedIn } from "@/auth/utils";

import { db } from "../drizzle/db";
import { performances, votes } from "../drizzle/schema";
import { getPerformanceTitle } from "../utils";

const voteSchema = zfd.formData({
  performanceIdA: zfd.text(),
  performanceIdB: zfd.text(),
  winnerId: zfd.text(),
});

const K_FACTOR = 32;

function expectedScore(rating: number, opponentRating: number) {
  return 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
}

export async function vote(
  _initialState: unknown,
  formData: FormData,
): Promise<void> {
  const userId = await ensureSignedIn();

  revalidatePath("/rank");

  const { performanceIdA, performanceIdB, winnerId } =
    voteSchema.parse(formData);

  if (performanceIdA === performanceIdB) {
    throw new Error("Can't vote on a performance against itself");
  }
  if (winnerId !== performanceIdA && winnerId !== performanceIdB) {
    throw new Error("The winner must be one of the two performances");
  }

  const didVote = await db.transaction(async (tx) => {
    // Lock both performance rows for the rest of the transaction, so that a
    // concurrent vote involving either performance waits for this one to
    // commit instead of computing its new rating from a stale one. Locking in
    // a consistent order avoids deadlocks between concurrent votes.
    const lockedPerformances = await tx
      .select({
        id: performances.id,
        songId: performances.songId,
        eloRating: performances.eloRating,
      })
      .from(performances)
      .where(inArray(performances.id, [performanceIdA, performanceIdB]))
      .orderBy(asc(performances.id))
      .for("update");

    const performanceA = lockedPerformances.find(
      (performance) => performance.id === performanceIdA,
    );
    const performanceB = lockedPerformances.find(
      (performance) => performance.id === performanceIdB,
    );
    if (!performanceA || !performanceB) {
      throw new Error("Performance not found");
    }

    if (performanceA.songId !== performanceB.songId) {
      throw new Error("Performances must be for the same song");
    }

    // Checked while holding the locks, so a concurrent duplicate submission
    // sees this vote once it's committed.
    const existingVote = await tx.query.votes.findFirst({
      where: and(
        eq(votes.voterId, userId),
        or(
          and(
            eq(votes.performance1Id, performanceIdA),
            eq(votes.performance2Id, performanceIdB),
          ),
          and(
            eq(votes.performance1Id, performanceIdB),
            eq(votes.performance2Id, performanceIdA),
          ),
        ),
      ),
      columns: { id: true },
    });
    if (existingVote) {
      console.log(
        `Skipping vote from user ${userId} because they've already voted on these performances`,
      );
      return false;
    }

    const scoreA = performanceA.id === winnerId ? 1 : 0;
    const scoreB = performanceB.id === winnerId ? 1 : 0;

    const expectedA = expectedScore(
      performanceA.eloRating,
      performanceB.eloRating,
    );
    const expectedB = expectedScore(
      performanceB.eloRating,
      performanceA.eloRating,
    );

    await tx
      .update(performances)
      .set({
        eloRating: performanceA.eloRating + K_FACTOR * (scoreA - expectedA),
      })
      .where(eq(performances.id, performanceA.id));
    await tx
      .update(performances)
      .set({
        eloRating: performanceB.eloRating + K_FACTOR * (scoreB - expectedB),
      })
      .where(eq(performances.id, performanceB.id));
    await tx.insert(votes).values({
      performance1Id: performanceA.id,
      performance2Id: performanceB.id,
      winnerId,
      voterId: userId,
    });

    return true;
  });

  if (!didVote) {
    return;
  }

  // Invalidate all cached vote and ranking data. `updateTag` (rather than
  // `revalidateTag`) expires the caches immediately, so the voter sees their
  // own vote reflected right away. "performances" covers everything that
  // shows Elo ratings, which this vote just changed.
  updateTag("votes");
  updateTag("performances");

  const winner = await db.query.performances.findFirst({
    where: eq(performances.id, winnerId),
    with: { song: true, show: true },
  });
  if (winner) {
    const performanceTitle = getPerformanceTitle(winner.song, winner.show);
    console.log(`New vote: User ${userId} voted for ${performanceTitle}!`);
  }
}
