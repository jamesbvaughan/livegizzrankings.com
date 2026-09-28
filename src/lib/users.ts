import { clerkClient } from "@clerk/nextjs/server";

/**
 * How many user IDs to look up per Clerk request. The IDs go in the query
 * string, so this keeps request URLs to a reasonable length.
 */
const USER_LOOKUP_BATCH_SIZE = 100;

export async function getUserDisplayNames(
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const clerk = await clerkClient();

  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += USER_LOOKUP_BATCH_SIZE) {
    batches.push(userIds.slice(i, i + USER_LOOKUP_BATCH_SIZE));
  }

  const responses = await Promise.all(
    batches.map((batch) =>
      clerk.users.getUserList({ userId: batch, limit: batch.length }),
    ),
  );

  return new Map(
    responses.flatMap((response) =>
      response.data.map((u) => [
        u.id,
        u.username ?? u.emailAddresses[0]?.emailAddress ?? u.id,
      ]),
    ),
  );
}
