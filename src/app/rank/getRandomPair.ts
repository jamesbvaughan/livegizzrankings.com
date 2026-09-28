import { eq } from "drizzle-orm";

import { ensureSignedIn } from "@/auth/utils";
import { db } from "@/drizzle/db";
import { skippedPairs, votes } from "@/drizzle/schema";

type Pair = [string, string];

/**
 * Every potential pair of performances, grouped by song ID.
 */
function generateAllPotentialPairs(
  allPerformances: { id: string; songId: string }[],
) {
  const performancesBySong = Map.groupBy(
    allPerformances,
    (performance) => performance.songId,
  );

  const pairs: Record<string, Pair[]> = {};
  for (const [songId, performances] of performancesBySong) {
    pairs[songId] = [];
    for (let i = 0; i < performances.length; i++) {
      for (let j = i + 1; j < performances.length; j++) {
        pairs[songId].push([performances[i].id, performances[j].id]);
      }
    }
  }

  return pairs;
}

/**
 * A key identifying a pair of performances regardless of their order.
 */
function pairKey(performanceIdA: string, performanceIdB: string) {
  return performanceIdA < performanceIdB
    ? `${performanceIdA},${performanceIdB}`
    : `${performanceIdB},${performanceIdA}`;
}

function getAllPerformanceSongIds() {
  return db.query.performances.findMany({
    columns: {
      id: true,
      songId: true,
    },
  });
}

/**
 * The total number of pairs of performances available to vote on.
 */
export async function getPairCount() {
  const allPerformances = await getAllPerformanceSongIds();
  const performancesBySong = Map.groupBy(
    allPerformances,
    (performance) => performance.songId,
  );

  let count = 0;
  for (const performances of performancesBySong.values()) {
    count += (performances.length * (performances.length - 1)) / 2;
  }

  return count;
}

async function getUserPairs() {
  const userId = await ensureSignedIn();

  const userPairs = await db.query.votes.findMany({
    where: eq(votes.voterId, userId),
    columns: {
      performance1Id: true,
      performance2Id: true,
    },
  });

  return userPairs;
}

async function getUserSkippedPairs() {
  const userId = await ensureSignedIn();

  const userSkippedPairs = await db.query.skippedPairs.findMany({
    where: eq(skippedPairs.userId, userId),
    columns: {
      performanceAId: true,
      performanceBId: true,
    },
  });

  return userSkippedPairs;
}

/**
 * Whether or not to filter to pairs that the user has not already voted on.
 *
 * This is a debug flag that's useful in development if your dev user has voted
 * on all the pairs already.
 */
const SHOW_ALL_PAIRS = false;

export async function getRandomPairForCurrentUser(filterSongId?: string) {
  // Get all of the pairs of performances that the current user has already
  // voted on or skipped.
  const userPairs = await getUserPairs();
  const userSkippedPairs = await getUserSkippedPairs();

  const allPerformances = await getAllPerformanceSongIds();
  const allPairs = generateAllPotentialPairs(allPerformances);

  const performanceToSongMap = new Map<string, string>();
  for (const perf of allPerformances) {
    performanceToSongMap.set(perf.id, perf.songId);
  }

  // Count votes per song and per performance
  const songVoteCounts = new Map<string, number>();
  const performanceVoteCounts = new Map<string, number>();

  for (const pair of userPairs) {
    // Both performances in a pair are from the same song
    const songId = performanceToSongMap.get(pair.performance1Id);
    if (songId) {
      songVoteCounts.set(songId, (songVoteCounts.get(songId) ?? 0) + 1);
    }

    // Increment performance vote counts
    performanceVoteCounts.set(
      pair.performance1Id,
      (performanceVoteCounts.get(pair.performance1Id) ?? 0) + 1,
    );
    performanceVoteCounts.set(
      pair.performance2Id,
      (performanceVoteCounts.get(pair.performance2Id) ?? 0) + 1,
    );
  }

  // Every pair the user has already voted on or skipped, for constant-time
  // lookups below.
  const seenPairKeys = new Set([
    ...userPairs.map((pair) =>
      pairKey(pair.performance1Id, pair.performance2Id),
    ),
    ...userSkippedPairs.map((pair) =>
      pairKey(pair.performanceAId, pair.performanceBId),
    ),
  ]);

  // Build up a record of every pair of performances that the current user has
  // not already voted on or skipped.
  const unvotedPairs: Record<string, Pair[]> = {};
  const songIdsToCheck = filterSongId ? [filterSongId] : Object.keys(allPairs);

  for (const songId of songIdsToCheck) {
    if (!allPairs[songId]) {
      continue;
    }

    for (const pair of allPairs[songId]) {
      if (!seenPairKeys.has(pairKey(pair[0], pair[1])) || SHOW_ALL_PAIRS) {
        unvotedPairs[songId] ??= [];
        unvotedPairs[songId].push(pair);
      }
    }
  }

  const songIds = Object.keys(unvotedPairs);

  if (songIds.length === 0) {
    return null;
  }

  // Find the song with the minimum vote count
  let minVoteCount = Infinity;
  let songWithMinVotes: string | null = null;

  for (const songId of songIds) {
    const voteCount = songVoteCounts.get(songId) ?? 0;
    if (voteCount < minVoteCount) {
      minVoteCount = voteCount;
      songWithMinVotes = songId;
    } else if (
      voteCount === minVoteCount &&
      songWithMinVotes &&
      songId < songWithMinVotes
    ) {
      // Deterministic tiebreaker: lexicographically smaller ID wins
      songWithMinVotes = songId;
    }
  }

  if (!songWithMinVotes) {
    return null;
  }

  const pairsForSong = unvotedPairs[songWithMinVotes];

  // Sort pairs deterministically:
  // Primary: by minimum vote count of the two performances (ascending)
  // Secondary: by lexicographic order of concatenated IDs
  const sortedPairs = pairsForSong.toSorted((a, b) => {
    const aMinVotes = Math.min(
      performanceVoteCounts.get(a[0]) ?? 0,
      performanceVoteCounts.get(a[1]) ?? 0,
    );
    const bMinVotes = Math.min(
      performanceVoteCounts.get(b[0]) ?? 0,
      performanceVoteCounts.get(b[1]) ?? 0,
    );

    if (aMinVotes !== bMinVotes) {
      return aMinVotes - bMinVotes;
    }

    // Tiebreaker: lexicographic sort of concatenated sorted IDs
    return pairKey(a[0], a[1]).localeCompare(pairKey(b[0], b[1]));
  });

  return sortedPairs[0];
}
