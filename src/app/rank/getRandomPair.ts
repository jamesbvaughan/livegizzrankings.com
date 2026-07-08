import { eq } from "drizzle-orm";

import { db } from "@/drizzle/db";
import { skippedPairs, votes } from "@/drizzle/schema";
import { ensureSignedIn } from "@/auth/utils";

async function generateAllPotentialPairs() {
  const pairs: Record<string, [string, string][]> = {};
  const allSongs = await db.query.songs.findMany();
  const allPerformances = await db.query.performances.findMany();

  for (const song of allSongs) {
    pairs[song.id] = [];
    const performances = allPerformances.filter(
      (performance) => performance.songId === song.id,
    );
    for (let i = 0; i < performances.length; i++) {
      for (let j = i + 1; j < performances.length; j++) {
        pairs[song.id].push([performances[i].id, performances[j].id]);
      }
    }
  }

  return pairs;
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

/**
 * Every potential pair of performances.
 */
export const allPairs = await generateAllPotentialPairs();

export async function getRandomPairForCurrentUser(filterSongId?: string) {
  // Get all of the pairs of performances that the current user has already
  // voted on or skipped.
  const userPairs = await getUserPairs();
  const userSkippedPairs = await getUserSkippedPairs();

  // Fetch all performances to map performance IDs to song IDs
  const allPerformances = await db.query.performances.findMany({
    columns: {
      id: true,
      songId: true,
    },
  });

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

  // Build up a record of every pair of performances that the current user has
  // not already voted on or skipped.
  const unvotedPairs: Record<string, [string, string][]> = {};
  const songIdsToCheck = filterSongId ? [filterSongId] : Object.keys(allPairs);

  for (const songId of songIdsToCheck) {
    if (!allPairs[songId]) {
      continue;
    }

    for (const pair of allPairs[songId]) {
      const userHasVoted = userPairs.some(
        (userPair) =>
          (userPair.performance1Id === pair[0] &&
            userPair.performance2Id === pair[1]) ||
          (userPair.performance1Id === pair[1] &&
            userPair.performance2Id === pair[0]),
      );
      const userHasSkipped = userSkippedPairs.some(
        (skippedPair) =>
          (skippedPair.performanceAId === pair[0] &&
            skippedPair.performanceBId === pair[1]) ||
          (skippedPair.performanceAId === pair[1] &&
            skippedPair.performanceBId === pair[0]),
      );
      if ((!userHasVoted && !userHasSkipped) || SHOW_ALL_PAIRS) {
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
    const aKey = [a[0], a[1]].toSorted().join(",");
    const bKey = [b[0], b[1]].toSorted().join(",");
    return aKey.localeCompare(bKey);
  });

  return sortedPairs[0];
}
