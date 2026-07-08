"use client";

import Form from "next/form";
import { useActionState } from "react";

import { linkNominationToPerformance } from "@/actions/linkNominationToPerformance";
import { BoxedButton } from "@/components/BoxedButtonLink";

export function LinkPerformanceButton({
  nominationId,
  performanceId,
}: {
  nominationId: string;
  performanceId: string;
}) {
  const [_state, submitAction, isPending] = useActionState(
    linkNominationToPerformance,
    null,
  );

  return (
    <Form action={submitAction}>
      <input type="hidden" name="nominationId" value={nominationId} />
      <input type="hidden" name="performanceId" value={performanceId} />
      <BoxedButton type="submit" disabled={isPending} className="text-sm">
        {isPending ? "Linking..." : "Link Performance"}
      </BoxedButton>
    </Form>
  );
}
