"use client";

import { useActionState } from "react";

import type {
  Nomination,
  Performance,
  Show,
  Song,
  Album,
} from "@/drizzle/schema";
import type { ActionState } from "@/lib/actionState";
import { getFormValue, initialActionState } from "@/lib/actionState";

import { BoxedButton, BoxedButtonLink } from "./BoxedButtonLink";
import { BoxedSelect } from "./BoxedSelect";

interface NominationEditFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  nomination: Nomination;
  performances: (Performance & {
    song: Song & { album: Album };
    show: Show;
  })[];
  submitLabel?: string;
}

export default function NominationEditForm({
  action,
  nomination,
  performances,
  submitLabel = "Save",
}: NominationEditFormProps) {
  const [{ errorMessage, formData }, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  return (
    <form action={formAction} className="group space-y-6" noValidate>
      <input type="hidden" name="nominationId" value={nomination.id} />

      {errorMessage && <p className="text-red">{errorMessage}</p>}

      <BoxedSelect
        label="Link to Performance (optional)"
        id="performanceId"
        name="performanceId"
        defaultValue={
          getFormValue(formData, "performanceId") ??
          nomination.performanceId ??
          ""
        }
      >
        <option value="">No performance linked</option>
        {performances.map((performance) => (
          <option key={performance.id} value={performance.id}>
            {performance.song.title} - {performance.show.location} (
            {new Date(performance.show.date).toLocaleDateString()})
          </option>
        ))}
      </BoxedSelect>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="willNotAdd"
          name="willNotAdd"
          defaultChecked={nomination.willNotAdd ?? false}
          className="h-4 w-4"
        />
        <label htmlFor="willNotAdd" className="text-sm font-medium">
          Mark as &quot;will not add&quot;
        </label>
      </div>

      <div className="flex gap-4">
        <BoxedButton type="submit" disabled={pending}>
          {pending ? `${submitLabel}...` : submitLabel}
        </BoxedButton>
        <BoxedButtonLink href="/nominations">Cancel</BoxedButtonLink>
      </div>
    </form>
  );
}
