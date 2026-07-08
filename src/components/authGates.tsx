import type { ReactNode } from "react";
import { Suspense } from "react";

import { isAdmin, isSignedIn } from "@/auth/utils";

async function AdminGate({ children }: { children: ReactNode }) {
  return (await isAdmin()) ? children : null;
}

/**
 * Renders children only when the current user is an admin.
 *
 * The auth check depends on the request, so the children render as a dynamic
 * hole in the otherwise-prerendered page and stream in at request time.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function SignedInGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (await isSignedIn()) ? children : fallback;
}

/**
 * Renders children only when the current user is signed in, and the optional
 * `signedOutFallback` otherwise.
 *
 * The auth check depends on the request, so the children render as a dynamic
 * hole in the otherwise-prerendered page and stream in at request time.
 */
export function SignedInOnly({
  children,
  signedOutFallback,
}: {
  children: ReactNode;
  signedOutFallback?: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <SignedInGate fallback={signedOutFallback}>{children}</SignedInGate>
    </Suspense>
  );
}
