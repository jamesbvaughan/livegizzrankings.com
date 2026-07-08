import { YouTubeEmbed } from "@next/third-parties/google";
import Link from "next/link";

import type { Performance, Show } from "@/drizzle/schema";

function SpotifyPlayer({ spotifyTrackId }: { spotifyTrackId: string }) {
  return (
    // eslint-disable-next-line iframe-missing-sandbox
    <iframe
      title="Spotify player"
      className="rounded-xl"
      width="100%"
      height="80"
      src={`https://open.spotify.com/embed/track/${spotifyTrackId}`}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}

function BandcampPlayer({
  bandcampTrackId,
  bandcampAlbumId,
}: {
  bandcampTrackId: string;
  bandcampAlbumId: string;
}) {
  const bgColor = "000000";
  const linkColor = "ff0000";
  return (
    // eslint-disable-next-line iframe-missing-sandbox
    <iframe
      title="Bandcamp player"
      width="100%"
      height="120"
      src={`https://bandcamp.com/EmbeddedPlayer/album=${bandcampAlbumId}/size=large/bgcol=${bgColor}/linkcol=${linkColor}/tracklist=false/artwork=none/track=${bandcampTrackId}/transparent=true/`}
      loading="lazy"
    />
  );
}

export function YouTubePlayer({
  videoId,
  startTime,
}: {
  videoId: string;
  startTime: number | null;
}) {
  return (
    <YouTubeEmbed
      videoid={videoId}
      params={startTime == null ? undefined : `start=${startTime}`}
    />
  );
}

const enableSpotify = false;

export function MediaPlayers({
  performance,
}: {
  performance: Performance & { show: Show };
}) {
  return (
    <div className="space-y-4">
      {performance.youtubeVideoId && (
        <YouTubePlayer
          videoId={performance.youtubeVideoId}
          startTime={performance.youtubeVideoStartTime}
        />
      )}

      {performance.bandcampTrackId && performance.show.bandcampAlbumId && (
        <BandcampPlayer
          bandcampTrackId={performance.bandcampTrackId}
          bandcampAlbumId={performance.show.bandcampAlbumId}
        />
      )}

      {performance.spotifyTrackId && enableSpotify && (
        <SpotifyPlayer spotifyTrackId={performance.spotifyTrackId} />
      )}

      <Link
        className="inline-block"
        href={`https://tapes.kglw.net/${performance.show.date}/`}
        target="_blank"
        rel="noopener"
      >
        Listen on Gizz Tapes
      </Link>
    </div>
  );
}
