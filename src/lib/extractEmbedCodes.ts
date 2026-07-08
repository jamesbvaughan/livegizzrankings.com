export function extractBandcampAlbumId(input: string): string {
  // If it's already just an album ID (only digits), return as-is
  if (/^\d+$/u.test(input.trim())) {
    return input.trim();
  }

  // Handle shortcode format: [bandcamp ... album=3446736804 ...]
  // or iframe format with album= parameter
  const albumMatch = input.match(/album=(\d+)/u);
  if (albumMatch) {
    return albumMatch[1];
  }

  // If no pattern matched, return as-is
  return input.trim();
}

export function extractBandcampTrackId(input: string): string {
  // If it's already just a track ID (only digits), return as-is
  if (/^\d+$/u.test(input.trim())) {
    return input.trim();
  }

  // Handle shortcode format: [bandcamp ... track=1136114588 ...]
  const shortcodeMatch = input.match(/track=(\d+)/u);
  if (shortcodeMatch) {
    return shortcodeMatch[1];
  }

  // If no pattern matched, return as-is
  return input.trim();
}

export function extractYouTubeVideoId(input: string): string {
  // If it's already just a video ID (no slashes or special chars), return as-is
  if (!/[/:?&]/u.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    // Handle youtu.be short URLs
    const shortUrlPattern = new URLPattern({
      hostname: "youtu.be",
      pathname: "/:videoId",
    });
    const shortMatch = shortUrlPattern.exec(input);
    if (shortMatch?.pathname?.groups?.videoId) {
      return shortMatch.pathname.groups.videoId;
    }

    // Handle youtube.com/embed/VIDEO_ID
    const embedPattern = new URLPattern({
      hostname: "{*.youtube.com,youtube.com}",
      pathname: "/embed/:videoId",
    });
    const embedMatch = embedPattern.exec(input);
    if (embedMatch?.pathname?.groups?.videoId) {
      return embedMatch.pathname.groups.videoId;
    }

    // Handle youtube.com/watch?v=VIDEO_ID - extract from search params
    const allowedHosts = ["youtube.com", "www.youtube.com", "m.youtube.com"];
    if (allowedHosts.includes(url.hostname)) {
      const videoId = url.searchParams.get("v");
      if (videoId) {
        return videoId;
      }
    }
  } catch {
    // If URL parsing fails, return as-is
    return input;
  }

  return input;
}

export function extractYouTubeStartTime(input: string): number | null {
  try {
    const url = new URL(input);

    // Check for t parameter in query string (can be ?t=123 or &t=123)
    const tParam = url.searchParams.get("t");
    if (tParam) {
      // Remove 's' suffix if present (e.g., "123s" -> "123")
      const seconds = Math.trunc(Number(tParam.replace(/s$/u, "")));
      if (!isNaN(seconds)) {
        return seconds;
      }
    }

    // Check for t in hash (e.g., #t=123)
    const hashMatch = url.hash.match(/[#&]t=(\d+)/u);
    if (hashMatch) {
      const seconds = Math.trunc(Number(hashMatch[1]));
      if (!isNaN(seconds)) {
        return seconds;
      }
    }
  } catch {
    // Not a valid URL, no time to extract
    return null;
  }

  return null;
}
