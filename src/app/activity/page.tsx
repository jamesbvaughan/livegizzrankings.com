import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Suspense } from "react";
import { diffLines, type Change } from "diff";

import { ensureAdmin } from "@/auth/utils";
import { PageContent, PageTitle } from "@/components/ui";
import { db } from "@/drizzle/db";
import { activityLogs, activityLogReviews } from "@/drizzle/schema";
import type { ActivityLog } from "@/drizzle/schema";
import { getUserDisplayNames } from "@/lib/users";
import { ReviewCheckbox } from "./ReviewCheckbox";
import { FilterToggle } from "./FilterToggle";
import {
  getAlbumPath,
  getPerformancePathBySongAndShow,
  getPerformanceTitle,
  getShowPath,
  getShowTitle,
  getSongPath,
} from "@/utils";

export const metadata: Metadata = {
  title: "Activity Log",
  description: "View recent activity on Live Gizz Rankings.",
};

export const dynamic = "force-dynamic";

async function getEntityInfo(entityType: string, entityId: string) {
  try {
    switch (entityType) {
      case "album": {
        const album = await db.query.albums.findFirst({
          where: (albums) => eq(albums.id, entityId),
        });
        if (album) {
          return {
            name: album.title,
            path: getAlbumPath(album),
          };
        }
        break;
      }
      case "song": {
        const song = await db.query.songs.findFirst({
          where: (songs) => eq(songs.id, entityId),
          with: { album: true },
        });
        if (song) {
          return {
            name: song.title,
            path: getSongPath(song),
          };
        }
        break;
      }
      case "show": {
        const show = await db.query.shows.findFirst({
          where: (shows) => eq(shows.id, entityId),
        });
        if (show) {
          return {
            name: getShowTitle(show),
            path: getShowPath(show),
          };
        }
        break;
      }
      case "performance": {
        const performance = await db.query.performances.findFirst({
          where: (performances) => eq(performances.id, entityId),
          with: {
            song: { with: { album: true } },
            show: true,
          },
        });
        if (performance) {
          return {
            name: getPerformanceTitle(performance.song, performance.show),
            path: getPerformancePathBySongAndShow(
              performance.song,
              performance.show,
            ),
          };
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Error fetching entity ${entityType}:${entityId}:`, error);
  }

  return null;
}

function DiffView({ before, after }: { before: any; after: any }) {
  const beforeStr = JSON.stringify(before, null, 2);
  const afterStr = JSON.stringify(after, null, 2);
  const diff = diffLines(beforeStr, afterStr);

  return (
    <div className="bg-muted-3 overflow-x-auto rounded p-2 text-xs font-mono">
      {diff.map((part: Change, index: number) => {
        const color = part.added
          ? "bg-green-600/20 text-green-400"
          : part.removed
            ? "bg-red/20 text-red"
            : "";
        const prefix = part.added ? "+ " : part.removed ? "- " : "  ";

        return (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={color}
          >
            {part.value.split("\n").map((line, lineIndex) => {
              if (lineIndex === part.value.split("\n").length - 1 && !line) {
                return null;
              }
              return (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={lineIndex}
                >
                  {prefix}
                  {line}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function getChangedFields(
  before: Record<string, any>,
  after: Record<string, any>,
): string[] {
  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      changes.push(key);
    }
  }

  return changes;
}

function formatChangeSummary(
  action: string,
  entityBefore: Record<string, any> | null,
  entityAfter: Record<string, any> | null,
): string | null {
  if (action === "create") {
    return "Created";
  }

  if (action === "delete") {
    return "Deleted";
  }

  if (action === "update" && entityBefore && entityAfter) {
    const changedFields = getChangedFields(entityBefore, entityAfter);
    if (changedFields.length === 0) {
      return "Updated";
    }
    if (changedFields.length === 1) {
      return `Updated ${changedFields[0]}`;
    }
    return `Updated ${changedFields.length} fields: ${changedFields.join(", ")}`;
  }

  return null;
}

async function ActivityLogItem({
  log,
  isReviewed,
  userDisplayName,
}: {
  log: ActivityLog;
  isReviewed: boolean;
  userDisplayName: string;
}) {
  const actionColors = {
    create: "text-green-600",
    update: "text-blue-600",
    delete: "text-red",
  };

  const entityTypeLabels = {
    album: "Album",
    song: "Song",
    show: "Show",
    performance: "Performance",
  };

  const entityInfo = await getEntityInfo(log.entityType, log.entityId);
  const changeSummary = formatChangeSummary(
    log.action,
    log.entityBefore,
    log.entityAfter,
  );

  return (
    <div className="border-muted-2 pb-4 not-last:border-b">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-semibold capitalize ${actionColors[log.action as keyof typeof actionColors]}`}
            >
              {log.action}
            </span>
            <span className="text-muted">
              {
                entityTypeLabels[
                  log.entityType as keyof typeof entityTypeLabels
                ]
              }
            </span>
            {entityInfo ? (
              <Link
                href={entityInfo.path}
                className="hover:text-foreground font-semibold underline"
              >
                {entityInfo.name}
              </Link>
            ) : (
              <span className="text-muted font-mono text-sm">
                {log.entityId}
              </span>
            )}
          </div>

          {changeSummary && (
            <div className="text-muted mt-1 text-sm">{changeSummary}</div>
          )}

          <div className="text-muted mt-1 text-sm">
            User: <span className="font-mono">{userDisplayName}</span>
          </div>
        </div>

        <div className="text-muted flex flex-col items-end gap-2 flex-shrink-0">
          <div>
            <div>{formatDistanceToNow(log.createdAt, { addSuffix: true })}</div>
            <time className="text-sm">{log.createdAt.toLocaleString()}</time>
          </div>
          <ReviewCheckbox activityLogId={log.id} isReviewed={isReviewed} />
        </div>
      </div>

      {log.action === "create" && log.entityAfter && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-green-600 mb-1">
            Created data:
          </div>
          <pre className="bg-muted-3 overflow-x-auto rounded p-2 text-xs">
            {JSON.stringify(log.entityAfter, null, 2)}
          </pre>
        </div>
      )}

      {log.action === "update" && log.entityBefore && log.entityAfter && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-muted mb-1">Changes:</div>
          <DiffView before={log.entityBefore} after={log.entityAfter} />
        </div>
      )}

      {log.action === "delete" && log.entityBefore && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-red mb-1">
            Deleted data:
          </div>
          <pre className="bg-muted-3 overflow-x-auto rounded p-2 text-xs">
            {JSON.stringify(log.entityBefore, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ showAll?: string }>;
}) {
  const userId = await ensureAdmin();

  const params = await searchParams;
  const showAll = params.showAll === "true";

  const logs = await db.query.activityLogs.findMany({
    orderBy: desc(activityLogs.createdAt),
  });

  // Fetch current user's reviews
  const reviews = userId
    ? await db.query.activityLogReviews.findMany({
        where: eq(activityLogReviews.userId, userId),
      })
    : [];

  // Create a Set of reviewed activity log IDs for efficient lookup
  const reviewedLogIds = new Set(reviews.map((r) => r.activityLogId));

  // Filter logs based on showAll parameter and limit to 100
  const filteredLogs = showAll
    ? logs.slice(0, 100)
    : logs.filter((log) => !reviewedLogIds.has(log.id)).slice(0, 100);

  // Get user display names
  const uniqueUserIds = [...new Set(filteredLogs.map((log) => log.userId))];
  const userDisplayNames = await getUserDisplayNames(uniqueUserIds);

  return (
    <>
      <PageTitle>Activity Log</PageTitle>

      <PageContent className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted">
            {showAll
              ? `Showing all activity (${filteredLogs.length} entries)`
              : `Showing unreviewed activity (${filteredLogs.length} entries)`}
          </p>
          <Suspense fallback={<div className="h-9 w-40" />}>
            <FilterToggle />
          </Suspense>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-muted">No activity logs found.</p>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <ActivityLogItem
                key={log.id}
                log={log}
                isReviewed={reviewedLogIds.has(log.id)}
                userDisplayName={userDisplayNames.get(log.userId) ?? log.userId}
              />
            ))}
          </div>
        )}
      </PageContent>
    </>
  );
}
