"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { zfd } from "zod-form-data";

import type { ActionState } from "@/lib/actionState";

import { ensureAdmin } from "../auth/utils";
import { db } from "../drizzle/db";
import { nominations } from "../drizzle/schema";
import { sendEditNotification } from "../lib/emailNotification";

const linkNominationSchema = zfd.formData({
  nominationId: zfd.text(),
  performanceId: zfd.text(),
});

export async function linkNominationToPerformance(
  _initialState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  await ensureAdmin();

  const { nominationId, performanceId } = linkNominationSchema.parse(formData);

  await db
    .update(nominations)
    .set({
      performanceId,
    })
    .where(eq(nominations.id, nominationId));

  console.log(
    `Nomination ${nominationId} linked to performance ${performanceId}`,
  );

  await sendEditNotification({
    entityType: "nomination",
    action: "update",
    entityId: nominationId,
    details: `Linked to performance: ${performanceId}`,
  });

  revalidatePath("/nominations");

  return {};
}
