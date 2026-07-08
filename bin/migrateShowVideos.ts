import { isNotNull } from "drizzle-orm";

import { db } from "../src/drizzle/db";
import { shows, showVideos } from "../src/drizzle/schema";

/**
 * Migration script to populate show_videos table from existing shows.youtubeVideoId
 *
 * Run with: bun run src/scripts/migrateShowVideos.ts
 */
async function migrateShowVideos() {
  console.log("Starting migration of show YouTube videos...");

  // Get all shows that have a youtubeVideoId
  const showsWithVideos = await db.query.shows.findMany({
    where: isNotNull(shows.youtubeVideoId),
  });

  console.log(`Found ${showsWithVideos.length} shows with YouTube videos`);

  // Process all shows in parallel
  const results = await Promise.all(
    showsWithVideos.map(async (show) => {
      if (!show.youtubeVideoId) {
        return { status: "skipped", reason: "no video id" };
      }

      try {
        // Check if this video already exists in show_videos
        const existing = await db.query.showVideos.findFirst({
          where: (videos, { and, eq }) =>
            and(
              eq(videos.showId, show.id),
              eq(videos.youtubeVideoId, show.youtubeVideoId!),
            ),
        });

        if (existing) {
          console.log(
            `Skipping ${show.location} ${show.date} - already migrated`,
          );
          return { status: "skipped", reason: "already exists" };
        }

        // Insert the video
        await db.insert(showVideos).values({
          showId: show.id,
          youtubeVideoId: show.youtubeVideoId,
          title: "Full Show",
        });

        console.log(`✓ Migrated ${show.location} ${show.date}`);
        return { status: "migrated" };
      } catch (error) {
        console.error(`Error migrating ${show.location} ${show.date}:`, error);
        return { status: "error" };
      }
    }),
  );

  const migratedCount = results.filter((r) => r.status === "migrated").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  console.log("\nMigration complete!");
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);
  console.log(`Total: ${showsWithVideos.length}`);

  process.exit(0);
}

try {
  await migrateShowVideos();
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
