import type { DrizzleClient } from "@/drizzle/db";
import { activityLogs } from "@/drizzle/schema";

type EntityType = "album" | "song" | "show" | "performance";
type ActionType = "create" | "update" | "delete";

interface LogActivityParams {
  userId: string;
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  entityBefore?: Record<string, any> | null;
  entityAfter?: Record<string, any> | null;
  db: DrizzleClient;
}

/**
 * Log an activity to the activity_logs table.
 */
async function logActivity(params: LogActivityParams): Promise<void> {
  await params.db.insert(activityLogs).values({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    entityBefore: params.entityBefore ?? null,
    entityAfter: params.entityAfter ?? null,
  });
}

/**
 * Log a create operation
 */
export async function logCreate(
  entityType: EntityType,
  entityId: string,
  entityData: Record<string, any>,
  userId: string,
  db: DrizzleClient,
): Promise<void> {
  await logActivity({
    userId,
    action: "create",
    entityType,
    entityId,
    entityBefore: null,
    entityAfter: entityData,
    db,
  });
}

/**
 * Log an update operation
 */
export async function logUpdate(
  entityType: EntityType,
  entityId: string,
  beforeData: Record<string, any>,
  afterData: Record<string, any>,
  userId: string,
  db: DrizzleClient,
): Promise<void> {
  await logActivity({
    userId,
    action: "update",
    entityType,
    entityId,
    entityBefore: beforeData,
    entityAfter: afterData,
    db,
  });
}

/**
 * Log a delete operation
 */
// export async function logDelete(
//   entityType: EntityType,
//   entityId: string,
//   entityData: Record<string, any>,
//   userId: string,
//   db: DrizzleClient,
// ): Promise<void> {
//   await logActivity({
//     userId,
//     action: "delete",
//     entityType,
//     entityId,
//     entityBefore: entityData,
//     entityAfter: null,
//     db,
//   });
// }
