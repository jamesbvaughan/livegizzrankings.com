"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zfd } from "zod-form-data";
import z from "zod/v4";

import type { ActionState } from "@/lib/actionState";

import { ensureAdmin } from "../auth/utils";
import { db } from "../drizzle/db";
import { nominations } from "../drizzle/schema";
import { sendEditNotification } from "../lib/emailNotification";

const editNominationSchema = zfd.formData({
  nominationId: zfd.text(),
  performanceId: zfd.text(z.string().optional()),
  willNotAdd: zfd.checkbox(),
});

export async function editNomination(
  _initialState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await ensureAdmin();

  const { nominationId, performanceId, willNotAdd } =
    editNominationSchema.parse(formData);

  await db
    .update(nominations)
    .set({
      performanceId: performanceId ?? null,
      willNotAdd,
    })
    .where(eq(nominations.id, nominationId));

  console.log(`Nomination updated: ${nominationId}`);

  await sendEditNotification({
    entityType: "nomination",
    action: "update",
    entityId: nominationId,
    details: performanceId
      ? `Linked to performance: ${performanceId}`
      : willNotAdd
        ? "Marked as will not add"
        : "Updated",
  });

  revalidatePath("/nominations");
  redirect("/nominations");
}
