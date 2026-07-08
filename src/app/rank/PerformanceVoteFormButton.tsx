"use client";

import { clsx } from "clsx";
import Form from "next/form";
import type { CSSProperties, ChangeEvent } from "react";
import { useActionState, useCallback, useState } from "react";

import { skipPair } from "@/actions/skipPair";
import { vote } from "@/actions/vote";
import type { Performance, Show } from "@/drizzle/schema";
import { getShowTitle } from "@/utils";
import { BoxedButton } from "@/components/BoxedButtonLink";

function performanceLabelStyle(imageUrl: Show["imageUrl"]): CSSProperties {
  return {
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    textShadow: "1px 1px 10px black",
  };
}

export function PerformanceFormButtons({
  performanceA,
  performanceB,
}: {
  performanceA: Performance & { show: Show };
  performanceB: Performance & { show: Show };
}) {
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [_voteState, submitVote, voteIsPending] = useActionState(vote, null);
  const [_skipState, submitSkip, skipIsPending] = useActionState(
    skipPair,
    null,
  );

  const isPending = voteIsPending || skipIsPending;

  const handleWinnerChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSelectedShow(
        e.target.value === performanceA.id
          ? performanceA.show
          : performanceB.show,
      );
    },
    [performanceA, performanceB],
  );

  return (
    <div className="space-y-4">
      <Form
        action={submitVote}
        className={clsx(isPending && "pointer-events-none opacity-50")}
      >
        <fieldset className="grid grid-cols-2 gap-2">
          {[performanceA, performanceB].map((performance) => {
            const { show } = performance;
            const performanceTitle = getShowTitle(show);

            return (
              <div key={performance.id}>
                <input
                  hidden
                  required
                  className="peer hidden"
                  type="radio"
                  name="winnerId"
                  id={performance.id}
                  value={performance.id}
                  checked={selectedShow === show}
                  onChange={handleWinnerChange}
                />
                <div className="peer-checked:border-red border-8 border-transparent">
                  <label
                    htmlFor={performance.id}
                    className="bg-muted-2 flex aspect-square w-full cursor-pointer items-center justify-center bg-cover text-center text-2xl hover:invert sm:text-4xl"
                    style={performanceLabelStyle(show.imageUrl)}
                  >
                    {performanceTitle}
                    <br />
                    is better
                  </label>
                </div>
              </div>
            );
          })}
        </fieldset>

        <input type="hidden" name="performanceIdA" value={performanceA.id} />
        <input type="hidden" name="performanceIdB" value={performanceB.id} />

        <div className="mt-10 flex items-center justify-center">
          {selectedShow ? (
            <button
              type="submit"
              className="border-foreground hover:bg-foreground hover:text-background border-2 px-6 py-4"
            >
              {voteIsPending ? (
                "submitting vote..."
              ) : (
                <>submit vote for {getShowTitle(selectedShow)}</>
              )}
            </button>
          ) : (
            <div>choose a performance above to vote for</div>
          )}
        </div>
      </Form>

      <div className="text-center">-- or --</div>

      <Form
        action={submitSkip}
        className={clsx(
          "flex justify-center",
          isPending && "pointer-events-none opacity-50",
        )}
      >
        <input type="hidden" name="performanceIdA" value={performanceA.id} />
        <input type="hidden" name="performanceIdB" value={performanceB.id} />
        <BoxedButton type="submit" className="text-sm">
          {skipIsPending ? "skipping..." : "skip this pair"}
        </BoxedButton>
      </Form>
    </div>
  );
}
