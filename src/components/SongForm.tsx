"use client";

import { useActionState } from "react";

import type { Album, Song } from "@/drizzle/schema";
import type { ActionState } from "@/lib/actionState";
import {
  getFormNumberValue,
  getFormValue,
  initialActionState,
} from "@/lib/actionState";

import { BoxedButton, BoxedButtonLink } from "./BoxedButtonLink";
import { BoxedInput } from "./BoxedInput";
import { BoxedSelect } from "./BoxedSelect";

interface SongFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  albums: Album[];
  song?: Song;
  submitLabel?: string;
  defaultAlbumId?: string;
}

export default function SongForm({
  action,
  albums,
  song,
  submitLabel = "Save",
  defaultAlbumId,
}: SongFormProps) {
  const [{ errorMessage, formData }, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  // Sort albums by release date, newest first
  const sortedAlbums = albums.toSorted(
    (a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
  );

  return (
    <form action={formAction} className="group space-y-6" noValidate>
      {song && <input type="hidden" name="songId" value={song.id} />}

      {errorMessage && <p className="text-red">{errorMessage}</p>}

      <BoxedInput
        label="Title"
        id="title"
        name="title"
        type="text"
        required
        minLength={1}
        maxLength={300}
        defaultValue={getFormValue(formData, "title") ?? song?.title}
        errorMessage="Title is required and must be between 1-300 characters"
      />

      <BoxedInput
        label="Slug"
        id="slug"
        name="slug"
        type="text"
        required
        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
        minLength={1}
        maxLength={100}
        defaultValue={getFormValue(formData, "slug") ?? song?.slug}
        placeholder="e.g., robot-stop"
        helpText="URL-friendly version of the title (lowercase, hyphens instead of spaces)"
        errorMessage="Slug must be lowercase letters, numbers, and hyphens only (e.g., 'robot-stop')"
      />

      <BoxedSelect
        label="Album"
        id="albumId"
        name="albumId"
        required
        defaultValue={
          getFormValue(formData, "albumId") ?? song?.albumId ?? defaultAlbumId
        }
        errorMessage="Please select an album"
      >
        <option value="">Select an album...</option>
        {sortedAlbums.map((album) => (
          <option key={album.id} value={album.id}>
            {album.title} ({new Date(album.releaseDate).getFullYear()})
          </option>
        ))}
      </BoxedSelect>

      <BoxedInput
        label="Album Position"
        id="albumPosition"
        name="albumPosition"
        type="number"
        required
        min={1}
        max={99}
        defaultValue={
          getFormNumberValue(formData, "albumPosition") ?? song?.albumPosition
        }
        placeholder="1"
        helpText="Track number on the album"
        errorMessage="Album position must be between 1 and 99"
      />

      <div className="flex gap-4">
        <BoxedButton type="submit" disabled={pending}>
          {pending ? `${submitLabel}...` : submitLabel}
        </BoxedButton>
        <BoxedButtonLink href="/songs">Cancel</BoxedButtonLink>
      </div>
    </form>
  );
}
