import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const shows = pgTable("shows", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  location: text("location").notNull(),
  date: date("date").notNull().unique(),
  bandcampAlbumId: text("bandcamp_album_id").unique(),
  youtubeVideoId: text("youtube_video_id"),
  imageUrl: text("image_url").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Show = typeof shows.$inferSelect;

export const showsRelations = relations(shows, ({ many }) => ({
  performances: many(performances),
  videos: many(showVideos),
}));

export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  releaseDate: date("release_date").notNull(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull().unique(),
  imageUrl: text("image_url").notNull(),
  bandcampAlbumId: text("bandcamp_album_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Album = typeof albums.$inferSelect;

export const albumsRelations = relations(albums, ({ many }) => ({
  songs: many(songs),
}));

export const songs = pgTable("songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  albumId: uuid("album_id")
    .references(() => albums.id)
    .notNull(),
  albumPosition: integer("album_position").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  debutPerformanceId: uuid("debut_performance_id").references(
    (): AnyPgColumn => performances.id,
  ),
});

export type Song = typeof songs.$inferSelect;

export const songsRelations = relations(songs, ({ one, many }) => ({
  album: one(albums, {
    fields: [songs.albumId],
    references: [albums.id],
  }),
  performances: many(performances),
}));

const DEFAULT_ELO_RATING = 1500;

export const performances = pgTable(
  "performances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id),
    showId: uuid("show_id")
      .notNull()
      .references(() => shows.id),
    spotifyTrackId: text("spotify_track_id").unique(),
    bandcampTrackId: text("bandcamp_track_id").unique(),
    showPosition: integer("show_position").notNull(),
    youtubeVideoId: text("youtube_video_id"),
    youtubeVideoStartTime: integer("youtube_video_start_time"),
    eloRating: real("elo_rating").notNull().default(DEFAULT_ELO_RATING),
    ratingLastUpdatedAt: timestamp("rating_last_updated_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    unique().on(t.songId, t.showId),
    unique().on(t.youtubeVideoId, t.youtubeVideoStartTime),
  ],
);

export type Performance = typeof performances.$inferSelect;

export const performancesRelations = relations(performances, ({ one }) => ({
  song: one(songs, {
    fields: [performances.songId],
    references: [songs.id],
  }),
  show: one(shows, {
    fields: [performances.showId],
    references: [shows.id],
  }),
}));

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  performance1Id: uuid("performance_1_id")
    .notNull()
    .references(() => performances.id),
  performance2Id: uuid("performance_2_id")
    .notNull()
    .references(() => performances.id),
  winnerId: uuid("winner_id")
    .notNull()
    .references(() => performances.id),
  voterId: text("voter_id").notNull(), // References the Clerk user ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const votesRelations = relations(votes, ({ one }) => ({
  performance1: one(performances, {
    fields: [votes.performance1Id],
    references: [performances.id],
  }),
  performance2: one(performances, {
    fields: [votes.performance2Id],
    references: [performances.id],
  }),
  winner: one(performances, {
    fields: [votes.winnerId],
    references: [performances.id],
  }),
}));

export type Vote = typeof votes.$inferSelect;

export const nominations = pgTable("nominations", {
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * References the Clerk user ID or null if there was no logged in user.
   */
  userId: text("user_id"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  willNotAdd: boolean("will_not_add"),
  performanceId: uuid("performance_id").references(() => performances.id),
});

export type Nomination = typeof nominations.$inferSelect;

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Clerk user ID
  action: text("action").notNull(), // "create", "update", "delete"
  entityType: text("entity_type").notNull(), // "album", "song", "show", "performance"
  entityId: uuid("entity_id").notNull(), // ID of the modified entity
  entityBefore: jsonb("entity_before").$type<Record<string, any>>(), // null for creates
  entityAfter: jsonb("entity_after").$type<Record<string, any>>(), // null for deletes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;

export const activityLogReviews = pgTable(
  "activity_log_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityLogId: uuid("activity_log_id")
      .notNull()
      .references(() => activityLogs.id),
    userId: text("user_id").notNull(), // Clerk user ID
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.activityLogId, t.userId)],
);

export type ActivityLogReview = typeof activityLogReviews.$inferSelect;

export const activityLogReviewsRelations = relations(
  activityLogReviews,
  ({ one }) => ({
    activityLog: one(activityLogs, {
      fields: [activityLogReviews.activityLogId],
      references: [activityLogs.id],
    }),
  }),
);

export const skippedPairs = pgTable(
  "skipped_pairs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(), // Clerk user ID
    performanceAId: uuid("performance_a_id")
      .notNull()
      .references(() => performances.id),
    performanceBId: uuid("performance_b_id")
      .notNull()
      .references(() => performances.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.performanceAId, t.performanceBId)],
);

export type SkippedPair = typeof skippedPairs.$inferSelect;

export const showVideos = pgTable(
  "show_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .notNull()
      .references(() => shows.id),
    youtubeVideoId: text("youtube_video_id").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.showId, t.youtubeVideoId)],
);

export type ShowVideo = typeof showVideos.$inferSelect;

export const showVideosRelations = relations(showVideos, ({ one }) => ({
  show: one(shows, {
    fields: [showVideos.showId],
    references: [shows.id],
  }),
}));
