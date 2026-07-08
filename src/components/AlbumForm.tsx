"use client";

import type { ChangeEvent } from "react";
import { useActionState, useCallback, useState } from "react";

import type { Album } from "@/drizzle/schema";

import { BoxedInput } from "./BoxedInput";
import { BoxedButton, BoxedButtonLink } from "./BoxedButtonLink";
import type { ActionState } from "@/lib/actionState";
import { getFormValue, initialActionState } from "@/lib/actionState";
import { extractBandcampAlbumId } from "@/lib/extractEmbedCodes";

interface AlbumFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  album?: Album;
  submitLabel?: string;
}

export default function AlbumForm({
  action,
  album,
  submitLabel = "Save",
}: AlbumFormProps) {
  const [{ errorMessage, formData }, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  const [bandcampAlbumId, setBandcampAlbumId] = useState(
    getFormValue(formData, "bandcampAlbumId") ?? album?.bandcampAlbumId ?? "",
  );

  const handleBandcampAlbumIdChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setBandcampAlbumId(extractBandcampAlbumId(e.target.value));
    },
    [],
  );

  return (
    <form action={formAction} className="group space-y-6" noValidate>
      {album && <input type="hidden" name="albumId" value={album.id} />}

      {errorMessage && <p className="text-red">{errorMessage}</p>}

      <BoxedInput
        label="Title"
        id="title"
        name="title"
        type="text"
        required
        minLength={1}
        maxLength={300}
        defaultValue={getFormValue(formData, "title") ?? album?.title}
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
        defaultValue={getFormValue(formData, "slug") ?? album?.slug}
        placeholder="e.g., nonagon-infinity"
        helpText="URL-friendly version of the title (lowercase, hyphens instead of spaces)"
        errorMessage="Slug must be lowercase letters, numbers, and hyphens only (e.g., 'nonagon-infinity')"
      />

      <BoxedInput
        label="Release Date"
        id="releaseDate"
        name="releaseDate"
        type="date"
        required
        min="1960-01-01"
        max={new Date().toISOString().split("T")[0]}
        defaultValue={
          getFormValue(formData, "releaseDate") ?? album?.releaseDate
        }
        errorMessage="Please enter a valid date between 1960 and today"
      />

      <BoxedInput
        label="Image URL"
        id="imageUrl"
        name="imageUrl"
        type="url"
        required
        pattern="https?://.*"
        defaultValue={getFormValue(formData, "imageUrl") ?? album?.imageUrl}
        placeholder="https://example.com/album-cover.jpg"
        errorMessage="Please enter a valid URL starting with http:// or https://"
      />

      <BoxedInput
        label="Bandcamp Album ID"
        id="bandcampAlbumId"
        name="bandcampAlbumId"
        type="text"
        required
        pattern="^\d+$"
        value={bandcampAlbumId}
        onChange={handleBandcampAlbumIdChange}
        placeholder="e.g., 1234567890 or paste embed code"
        helpText="Paste the Bandcamp album ID or the full embed code (either format) and the album ID will be extracted automatically."
        errorMessage="Bandcamp Album ID must contain only digits"
      />

      <div className="flex gap-4">
        <BoxedButton type="submit" disabled={pending}>
          {pending ? `${submitLabel}...` : submitLabel}
        </BoxedButton>
        <BoxedButtonLink href="/albums">Cancel</BoxedButtonLink>
      </div>
    </form>
  );
}
