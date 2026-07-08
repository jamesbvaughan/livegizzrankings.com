"use client";

import { useActionState, useState } from "react";

import type { Show, ShowVideo } from "@/drizzle/schema";

import { BoxedInput } from "./BoxedInput";
import { BoxedButton, BoxedButtonLink } from "./BoxedButtonLink";
import { ShowVideoList } from "./ShowVideoList";
import type { ActionState } from "@/lib/actionState";
import { getFormValue, initialActionState } from "@/lib/actionState";
import { extractBandcampAlbumId } from "@/lib/extractEmbedCodes";

interface ShowFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  show?: Show;
  videos?: ShowVideo[];
  submitLabel?: string;
}

const noVideos: ShowVideo[] = [];

export default function ShowForm({
  action,
  show,
  videos = noVideos,
  submitLabel = "Save",
}: ShowFormProps) {
  const [{ errorMessage, formData }, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  const [bandcampAlbumId, setBandcampAlbumId] = useState(
    getFormValue(formData, "bandcampAlbumId") ?? show?.bandcampAlbumId ?? "",
  );

  return (
    <form action={formAction} className="group space-y-6" noValidate>
      {show && <input type="hidden" name="showId" value={show.id} />}

      {errorMessage && <p className="text-red">{errorMessage}</p>}

      <BoxedInput
        label="Slug"
        id="slug"
        name="slug"
        type="text"
        required
        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
        minLength={1}
        maxLength={100}
        defaultValue={getFormValue(formData, "slug") ?? show?.slug}
        placeholder="atlanta-2024"
        helpText="URL-friendly identifier (lowercase, hyphens, typically <location>-<year> format)"
        errorMessage="Slug must be lowercase letters, numbers, and hyphens only"
      />

      <BoxedInput
        label="Location"
        id="location"
        name="location"
        type="text"
        required
        minLength={1}
        maxLength={300}
        defaultValue={getFormValue(formData, "location") ?? show?.location}
        placeholder="Atlanta"
        helpText="Show location, typically just a country or city or festival name, whatever people commonly use to refer to the show."
        errorMessage="Location is required and must be between 1-300 characters"
      />

      <BoxedInput
        label="Date"
        id="date"
        name="date"
        type="date"
        required
        defaultValue={getFormValue(formData, "date") ?? show?.date}
        helpText="If there were multiple nights, use the date of the first one."
        errorMessage="Please select a valid date"
      />

      <BoxedInput
        label="Image URL"
        id="imageUrl"
        name="imageUrl"
        type="url"
        required
        defaultValue={getFormValue(formData, "imageUrl") ?? show?.imageUrl}
        placeholder="https://example.com/image.jpg"
        helpText="URL for an image of the show's cover art"
        errorMessage="Please provide a valid image URL"
      />

      <BoxedInput
        label="Bandcamp Album ID (optional)"
        id="bandcampAlbumId"
        name="bandcampAlbumId"
        type="text"
        pattern="^\d+$"
        value={bandcampAlbumId}
        onChange={(e) => {
          const extractedId = extractBandcampAlbumId(e.target.value);
          setBandcampAlbumId(extractedId);
        }}
        placeholder="e.g., 1234567890 or paste embed code"
        helpText="Paste the Bandcamp album ID or the full embed code (either format) and the album ID will be extracted automatically."
        errorMessage="Bandcamp Album ID must contain only digits"
      />

      <ShowVideoList
        defaultVideos={videos.map((v) => ({
          youtubeVideoId: v.youtubeVideoId,
          title: v.title,
        }))}
      />

      <div className="flex gap-4">
        <BoxedButton type="submit" disabled={pending}>
          {pending ? `${submitLabel}...` : submitLabel}
        </BoxedButton>
        <BoxedButtonLink href="/shows">Cancel</BoxedButtonLink>
      </div>
    </form>
  );
}
