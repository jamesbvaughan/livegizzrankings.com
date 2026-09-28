import type { Metadata } from "next";

import { ensureAdmin } from "@/auth/utils";
import { PageContent, PageTitle } from "@/components/ui";
import { db } from "@/drizzle/db";
import type { ActivityLog, Nomination, Vote } from "@/drizzle/schema";
import { getUserDisplayNames } from "@/lib/users";

import { getPairCount } from "../rank/getRandomPair";
import UsersTable from "./users-table";

export const metadata: Metadata = {
  title: "Users",
};

function buildTableData(
  users: [string, Vote[] | undefined][],
  allNominations: Nomination[],
  allActivityLogs: ActivityLog[],
  userIdToUsername: Map<string, string>,
) {
  return users.map(([userId, userVotes]) => {
    const nominations = allNominations.filter(
      (nomination) => nomination.userId === userId,
    );

    const edits = allActivityLogs.filter((log) => log.userId === userId);

    const leftVotes = userVotes!.filter(
      (vote) => vote.winnerId === vote.performance1Id,
    );
    const rightVotes = userVotes!.filter(
      (vote) => vote.winnerId === vote.performance2Id,
    );

    return {
      userId,
      username: userIdToUsername.get(userId) ?? userId,
      votes: userVotes!.length,
      leftVotes: leftVotes.length,
      rightVotes: rightVotes.length,
      nominations: nominations.length,
      edits: edits.length,
    };
  });
}

export default async function UsersPage() {
  await ensureAdmin();

  const [allVotes, allNominations, allActivityLogs, nPairs] = await Promise.all(
    [
      db.query.votes.findMany(),
      db.query.nominations.findMany(),
      db.query.activityLogs.findMany(),
      getPairCount(),
    ],
  );

  const userToVotes = Object.groupBy(allVotes, (vote) => vote.voterId);

  const users = Object.entries(userToVotes);

  const userIds = users.map(([userId]) => userId);
  const userIdToUsername = await getUserDisplayNames(userIds);

  const tableData = buildTableData(
    users,
    allNominations,
    allActivityLogs,
    userIdToUsername,
  );

  return (
    <>
      <PageTitle>Users</PageTitle>

      <PageContent>
        <p>There are {nPairs} pairs of performances available to vote on.</p>

        <UsersTable data={tableData} />
      </PageContent>
    </>
  );
}
