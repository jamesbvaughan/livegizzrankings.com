import type { Show, Song, Album } from "@/drizzle/schema";

interface ParsedNomination {
  songId?: string;
  showId?: string;
  confidence: number;
}

interface ParseContext {
  songs: (Song & { album: Album })[];
  shows: Show[];
}

/**
 * Attempts to parse a nomination message to extract song and show information
 * Returns the best matches with a confidence score
 */
export function parseNomination(
  message: string,
  context: ParseContext,
): ParsedNomination {
  // Extract potential song name (everything before " at ", " in ", " live ", etc.)
  const songPatterns = [
    /^(.+?)\s+(?:at|in|live|from|during)\s+/iu,
    /^(.+?)\s+-\s+/iu,
    /^(.+?)\s+\(/iu,
    // Handle comma-separated format like "Song, Location"
    /^(.+?),\s+/iu,
  ];

  let potentialSongName = "";
  for (const pattern of songPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      potentialSongName = match[1].trim();
      break;
    }
  }

  // If no pattern matched, try first part before common separators
  if (!potentialSongName) {
    const firstPart = message.split(
      /\s+(?:at|in|live|from|during|-|\()|,\s+/iu,
    )[0];
    if (firstPart && firstPart.length > 2) {
      potentialSongName = firstPart.trim();
    }
  }

  // Extract potential location and year
  const locationPatterns = [
    /(?:at|in|live\s+(?:at|in))\s+(.+?)(?:\s+['']?(\d{2,4}))?\s*$/iu,
    /(?:from|during)\s+(.+?)(?:\s+['']?(\d{2,4}))?\s*$/iu,
    // Handle comma-separated format like "Song, Location"
    /,\s+(.+?)(?:\s+['']?(\d{2,4}))?\s*$/iu,
  ];

  let potentialLocation = "";
  let potentialYear: number | undefined;
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      potentialLocation = match[1].trim();
      if (match[2]) {
        // Parse year - handle 2-digit or 4-digit years
        const yearStr = match[2];
        if (yearStr.length === 2) {
          // Assume 20xx for 2-digit years
          potentialYear = 2000 + Math.trunc(Number(yearStr));
        } else {
          potentialYear = Math.trunc(Number(yearStr));
        }
      }
      break;
    }
  }

  let bestSong: Song | undefined;
  let bestShow: Show | undefined;
  let confidence = 0;

  // Find best matching song
  if (potentialSongName) {
    const songMatches = context.songs
      .map((song) => ({
        song,
        score: calculateSimilarity(
          potentialSongName.toLowerCase(),
          song.title.toLowerCase(),
        ),
      }))
      // Minimum threshold
      .filter((match) => match.score > 0.3)
      .toSorted((a, b) => b.score - a.score);

    if (songMatches.length > 0) {
      bestSong = songMatches[0].song;
      // Song match contributes 60% to confidence
      confidence += songMatches[0].score * 0.6;
    }
  }

  // Find best matching show
  if (potentialLocation) {
    const showMatches = context.shows
      .map((show) => {
        const locationScore = calculateLocationSimilarity(
          potentialLocation.toLowerCase(),
          show.location.toLowerCase(),
        );

        // If we have a year, check if it matches
        let yearScore = 0;
        if (potentialYear) {
          const showYear = new Date(show.date).getFullYear();
          if (showYear === potentialYear) {
            // Perfect year match
            yearScore = 1.0;
          } else if (Math.abs(showYear - potentialYear) === 1) {
            // Off by one year (might be a typo)
            yearScore = 0.3;
          }
          // If year doesn't match at all, penalize the location score
          if (yearScore === 0) {
            return {
              show,
              // Heavily penalize wrong year
              score: locationScore * 0.3,
            };
          }
        }

        // Combine location and year scores
        // If we have a year match, weight it heavily (70% year, 30% location)
        // Otherwise just use location score
        const finalScore = potentialYear
          ? locationScore * 0.3 + yearScore * 0.7
          : locationScore;

        return {
          show,
          score: finalScore,
        };
      })
      // Minimum threshold
      .filter((match) => match.score > 0.3)
      .toSorted((a, b) => b.score - a.score);

    if (showMatches.length > 0) {
      bestShow = showMatches[0].show;
      // Show match contributes 40% to confidence
      confidence += showMatches[0].score * 0.4;
    }
  }

  return {
    songId: bestSong?.id,
    showId: bestShow?.id,
    confidence,
  };
}

/**
 * Normalize song names for better matching by handling common variations
 */
function normalizeSongName(songName: string): string {
  return (
    songName
      .toLowerCase()
      // Replace hyphens with spaces (e.g., "People-Vultures" -> "People Vultures")
      .replaceAll("-", " ")
      // Normalize multiple spaces to single space
      .replaceAll(/\s+/gu, " ")
      .trim()
  );
}

/**
 * Calculate similarity between two strings using a combination of techniques
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Normalize both strings for comparison
  const norm1 = normalizeSongName(str1);
  const norm2 = normalizeSongName(str2);

  // Exact match after normalization
  if (norm1 === norm2) {
    return 1.0;
  }

  // Check if one normalized string contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length >= norm2.length ? norm1 : norm2;
    return (shorter.length / longer.length) * 0.9;
  }

  // Word-based similarity using normalized strings
  const words1 = norm1.split(/\s+/u);
  const words2 = norm2.split(/\s+/u);

  let matchingWords = 0;
  for (const word1 of words1) {
    if (
      word1.length > 2 &&
      words2.some(
        (word2) =>
          word2.includes(word1) ||
          word1.includes(word2) ||
          levenshteinSimilarity(word1, word2) > 0.7,
      )
    ) {
      matchingWords++;
    }
  }

  if (words1.length > 0) {
    return matchingWords / Math.max(words1.length, words2.length);
  }

  return 0;
}

/**
 * Clean up common location suffixes/prefixes
 */
function cleanLocation(loc: string): string {
  return loc
    .replaceAll(
      /\b(the\s+)?(\w+\s+)?(auditorium|arena|theatre|theater|hall|center|centre|club|venue)\b/giu,
      "",
    )
    .replaceAll(/\b(red\s+rocks|red\s+rocks\s+amphitheatre)\b/giu, "red rocks")
    .replaceAll(/\b(new\s+york|nyc|ny)\b/giu, "new york")
    .replaceAll(/\b(los\s+angeles|la|l\.a\.)\b/giu, "los angeles")
    .replaceAll(/\b(san\s+francisco|sf)\b/giu, "san francisco")
    .trim();
}

/**
 * Calculate similarity for locations with special handling for city names
 */
function calculateLocationSimilarity(str1: string, str2: string): number {
  const clean1 = cleanLocation(str1);
  const clean2 = cleanLocation(str2);

  return calculateSimilarity(clean1, clean2);
}

/**
 * Calculate Levenshtein distance similarity between two strings
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = Array.from({ length: str2.length + 1 }, () =>
    Array.from({ length: str1.length + 1 }, () => 0),
  );

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        // deletion
        matrix[j][i - 1] + 1,
        // insertion
        matrix[j - 1][i] + 1,
        // substitution
        matrix[j - 1][i - 1] + substitutionCost,
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return 1 - matrix[str2.length][str1.length] / maxLength;
}
