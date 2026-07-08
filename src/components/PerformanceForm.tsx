"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { useActionState, useCallback, useState } from "react";

import type { Album, Performance, Show, Song } from "@/drizzle/schema";
import type { ActionState } from "@/lib/actionState";
import {
  getFormValue,
  getFormNumberValue,
  initialActionState,
} from "@/lib/actionState";
import {
  extractBandcampTrackId,
  extractYouTubeVideoId,
  extractYouTubeStartTime,
} from "@/lib/extractEmbedCodes";

import { BoxedButton, BoxedButtonLink } from "./BoxedButtonLink";
import { BoxedInput } from "./BoxedInput";
import { BoxedSelect } from "./BoxedSelect";

interface PerformanceFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  songs: (Song & { album: Album })[];
  shows: Show[];
  performance?: Performance;
  submitLabel?: string;
  defaultSongId?: string;
  defaultShowId?: string;
  defaultYoutubeVideoId?: string;
  nominationId?: string;
}

export default function PerformanceForm({
  action,
  songs,
  shows,
  performance,
  submitLabel = "Save",
  defaultSongId,
  defaultShowId,
  defaultYoutubeVideoId,
  nominationId,
}: PerformanceFormProps) {
  const [{ errorMessage, formData }, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  const [bandcampTrackId, setBandcampTrackId] = useState(
    getFormValue(formData, "bandcampTrackId") ??
      performance?.bandcampTrackId ??
      "",
  );

  const [youtubeVideoId, setYoutubeVideoId] = useState(
    getFormValue(formData, "youtubeVideoId") ??
      performance?.youtubeVideoId ??
      defaultYoutubeVideoId ??
      "",
  );

  const [youtubeStartTime, setYoutubeStartTime] = useState<number | undefined>(
    getFormNumberValue(formData, "youtubeVideoStartTime") ??
      performance?.youtubeVideoStartTime ??
      undefined,
  );

  const handleBandcampTrackIdChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setBandcampTrackId(extractBandcampTrackId(e.target.value));
    },
    [],
  );

  const handleYoutubeVideoIdChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setYoutubeVideoId(extractYouTubeVideoId(input));

      // If a URL with time is pasted, extract and set the start time
      const extractedTime = extractYouTubeStartTime(input);
      if (extractedTime !== null) {
        setYoutubeStartTime(extractedTime);
      }
    },
    [],
  );

  const handleYoutubeStartTimeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setYoutubeStartTime(value ? Math.trunc(Number(value)) : undefined);
    },
    [],
  );

  // Group songs by album, sorted by release date (newest first)
  const songsByAlbum = songs.reduce(
    (acc, song) => {
      const albumKey = song.album.id;
      if (!acc[albumKey]) {
        acc[albumKey] = {
          album: song.album,
          songs: [],
        };
      }
      acc[albumKey].songs.push(song);
      return acc;
    },
    {} as Record<
      string,
      { album: (typeof songs)[0]["album"]; songs: typeof songs }
    >,
  );

  // Sort albums by release date (newest first) and songs within each album by position
  const sortedAlbumGroups = Object.values(songsByAlbum)
    .toSorted(
      (a, b) =>
        new Date(b.album.releaseDate).getTime() -
        new Date(a.album.releaseDate).getTime(),
    )
    .map((group) => ({
      album: group.album,
      songs: group.songs.toSorted((a, b) => a.albumPosition - b.albumPosition),
    }));

  // Sort shows by date (newest first)
  const sortedShows = shows.toSorted(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <form action={formAction} className="group space-y-6" noValidate>
      {performance && (
        <input type="hidden" name="performanceId" value={performance.id} />
      )}
      {nominationId && (
        <input type="hidden" name="nominationId" value={nominationId} />
      )}

      {errorMessage && <p className="text-red">{errorMessage}</p>}

      <BoxedSelect
        label="Song"
        id="songId"
        name="songId"
        required
        defaultValue={
          getFormValue(formData, "songId") ??
          performance?.songId ??
          defaultSongId
        }
        errorMessage="Please select a song"
      >
        <option value="">Select a song...</option>
        {sortedAlbumGroups.map((albumGroup) => (
          <optgroup
            key={albumGroup.album.id}
            label={`${albumGroup.album.title} (${new Date(albumGroup.album.releaseDate).getFullYear()})`}
          >
            {albumGroup.songs.map((song) => (
              <option key={song.id} value={song.id}>
                {song.albumPosition}. {song.title}
              </option>
            ))}
          </optgroup>
        ))}
      </BoxedSelect>

      <BoxedSelect
        label="Show"
        id="showId"
        name="showId"
        required
        defaultValue={
          getFormValue(formData, "showId") ??
          performance?.showId ??
          defaultShowId
        }
        errorMessage="Please select a show"
        helpText={
          <>
            Don&apos;t see the show you&apos;re looking for?{" "}
            <Link href="/shows/add">Add it</Link>!
          </>
        }
      >
        <option value="">Select a show...</option>
        {sortedShows.map((show) => (
          <option key={show.id} value={show.id}>
            {show.location} - {new Date(show.date).toLocaleDateString()}
          </option>
        ))}
      </BoxedSelect>

      <BoxedInput
        label="Show Position"
        id="showPosition"
        name="showPosition"
        type="number"
        required
        min={1}
        max={99}
        defaultValue={
          getFormNumberValue(formData, "showPosition") ??
          performance?.showPosition
        }
        placeholder="1"
        helpText="Position of this song in the show setlist. If this was part of a multi-show residency released as a single combined bootleg album, use the track number from the bootleg album."
        errorMessage="Show position must be between 1 and 99"
      />

      <BoxedInput
        label="Bandcamp Track ID (optional)"
        id="bandcampTrackId"
        name="bandcampTrackId"
        type="text"
        pattern="^\d+$"
        value={bandcampTrackId}
        onChange={handleBandcampTrackIdChange}
        placeholder="e.g., 1234567890 or paste embed code"
        helpText={
          <>
            Paste the Bandcamp track ID or the full embed code (either format)
            and the track ID will be extracted automatically. Get this from the{" "}
            <Link
              href="https://bootleggizzard.bandcamp.com/"
              target="_blank"
              rel="noreferrer"
            >
              Bandcamp
            </Link>{" "}
            page for the specific track.
          </>
        }
        errorMessage="Bandcamp Track ID must contain only digits"
      />

      <BoxedInput
        label="YouTube Video ID (optional)"
        id="youtubeVideoId"
        name="youtubeVideoId"
        type="text"
        value={youtubeVideoId}
        onChange={handleYoutubeVideoIdChange}
        placeholder="e.g., dQw4w9WgXcQ or paste full YouTube URL"
        helpText="Paste a YouTube URL or video ID. If the URL includes a timestamp, it will auto-fill the start time field below."
        errorMessage="Must be a valid YouTube video ID"
      />

      <BoxedInput
        label="YouTube Start Time (optional)"
        id="youtubeVideoStartTime"
        name="youtubeVideoStartTime"
        type="number"
        min={0}
        value={youtubeStartTime ?? ""}
        onChange={handleYoutubeStartTimeChange}
        placeholder="0"
        helpText="Start time in seconds for this song in the YouTube video. You can get this from the YouTube URL by pausing the video at the song start, right-clicking on the video, and selecting 'Copy video URL at current time'."
        errorMessage="Start time must be 0 or greater"
      />

      <div className="flex gap-4">
        <BoxedButton type="submit" disabled={pending}>
          {pending ? `${submitLabel}...` : submitLabel}
        </BoxedButton>
        <BoxedButtonLink href="/">Cancel</BoxedButtonLink>
      </div>
    </form>
  );
}
