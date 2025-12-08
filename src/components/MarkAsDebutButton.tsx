"use client";

import { useState } from "react";
import { BoxedButton } from "./BoxedButtonLink";

interface MarkAsDebutButtonProps {
  performanceId: string;
  markAsDebut: (performanceId: string) => Promise<void>;
}

export function MarkAsDebutButton({
  performanceId,
  markAsDebut,
}: MarkAsDebutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  return (
    <BoxedButton
      onClick={() => {
        setIsPending(true);
        void markAsDebut(performanceId);
      }}
      disabled={isPending}
    >
      {isPending ? "Marking as Debut..." : "Mark as Debut"}
    </BoxedButton>
  );
}
