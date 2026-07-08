"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function FilterToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showAll = searchParams.get("showAll") === "true";

  const handleToggle = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    if (showAll) {
      params.delete("showAll");
    } else {
      params.set("showAll", "true");
    }
    router.push(`/activity?${params.toString()}`);
  }, [router, searchParams, showAll]);

  return (
    <button
      onClick={handleToggle}
      className="border-foreground hover:bg-foreground hover:text-background border px-4 py-2 text-sm"
    >
      {showAll ? "Show unreviewed only" : "Show all activity"}
    </button>
  );
}
