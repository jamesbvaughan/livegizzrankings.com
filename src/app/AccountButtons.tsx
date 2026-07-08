"use client";

import { SignInButton, SignOutButton, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

export function AccountButtons({
  unreviewedLogCountSlot,
}: {
  unreviewedLogCountSlot: ReactNode;
}) {
  const clerk = useClerk();
  const { isSignedIn, isLoaded, user } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const openUserProfile = useCallback(() => {
    clerk.openUserProfile();
  }, [clerk]);

  if (!isClient || !isLoaded) {
    return <div className="text-muted-2 cursor-wait">sign in</div>;
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="hover:text-red">sign in</button>
      </SignInButton>
    );
  }

  const isAdmin = user.publicMetadata.isAdmin;
  const username = user.username ?? user.primaryEmailAddress?.emailAddress;

  return (
    <div className="flex flex-col items-end space-y-2">
      <div className="">{username ?? "signed in"}</div>

      <hr className="border-muted-2 w-full" />

      <div className="flex flex-col items-end space-y-2">
        <div className="flex flex-col items-end space-y-1">
          <button className="hover:text-red" onClick={openUserProfile}>
            account
          </button>

          <SignOutButton>
            <button className="hover:text-red">sign out</button>
          </SignOutButton>
        </div>

        {isAdmin ? (
          <>
            <hr className="border-muted-2 w-full" />

            <div className="flex flex-col items-end space-y-1">
              <Link href="/users">users</Link>
              <Link href="/votes">votes</Link>
              <Link href="/activity">
                activity
                {unreviewedLogCountSlot}
              </Link>
              <Link href="/needs-work">needs work</Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
