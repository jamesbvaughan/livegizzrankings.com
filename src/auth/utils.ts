import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";

/**
 * The header `clerkMiddleware()` sets on every request it handles. It's how
 * Clerk's own `auth()` detects that the middleware ran.
 */
const CLERK_AUTH_STATUS_HEADER = "x-clerk-auth-status";

type AuthSession = Pick<
  Awaited<ReturnType<typeof auth>>,
  "userId" | "sessionClaims"
>;

export async function authWithSentry(): Promise<AuthSession> {
  // The proxy skips requests for static-file-like paths (see `src/proxy.ts`).
  // Requests for nonexistent ones, like bots probing for `/wp-admin/x.gif`,
  // still render the not-found page, and calling `auth()` there throws. Treat
  // those requests as signed out instead.
  const requestHeaders = await headers();
  if (!requestHeaders.has(CLERK_AUTH_STATUS_HEADER)) {
    return { userId: null, sessionClaims: null };
  }

  const session = await auth();

  Sentry.setUser({
    id: session.userId ?? undefined,
    email: session.sessionClaims?.email ?? undefined,
    username: session.sessionClaims?.username ?? undefined,
    ip_address: "{{auto}}",
  });

  return session;
}

export async function isAdmin(): Promise<boolean> {
  const { sessionClaims } = await authWithSentry();
  return !!sessionClaims?.meta?.isAdmin;
}

export async function isSignedIn(): Promise<boolean> {
  const { userId } = await authWithSentry();
  return !!userId;
}

export async function ensureSignedIn(): Promise<string> {
  const { userId } = await authWithSentry();
  if (!userId) {
    unauthorized();
  }

  return userId;
}

export async function ensureAdmin(): Promise<string> {
  const { sessionClaims, userId } = await authWithSentry();
  if (!userId) {
    unauthorized();
  }

  if (!sessionClaims?.meta?.isAdmin) {
    forbidden();
  }

  return userId;
}
