import z from "zod/v4";

const INVALID_VIDEOS_MESSAGE = "The list of videos couldn't be read.";

const showVideosSchema = z
  .array(
    z.object(
      {
        youtubeVideoId: z
          .string({ error: INVALID_VIDEOS_MESSAGE })
          .trim()
          .min(1, { error: "Each video needs a YouTube video ID." }),
        title: z
          .string({ error: INVALID_VIDEOS_MESSAGE })
          .trim()
          .min(1, { error: "Each video needs a title." }),
      },
      { error: INVALID_VIDEOS_MESSAGE },
    ),
    { error: INVALID_VIDEOS_MESSAGE },
  )
  .refine(
    (videos) =>
      new Set(videos.map((video) => video.youtubeVideoId)).size ===
      videos.length,
    { error: "The same YouTube video was added more than once." },
  );

type ShowVideoInput = z.infer<typeof showVideosSchema>[number];

/**
 * Parses the JSON-encoded list of videos submitted by the show form.
 */
export function parseShowVideos(
  videosJson: string | undefined,
): { videos: ShowVideoInput[] } | { errorMessage: string } {
  if (!videosJson) {
    return { videos: [] };
  }

  let json: unknown;
  try {
    json = JSON.parse(videosJson);
  } catch {
    return { errorMessage: INVALID_VIDEOS_MESSAGE };
  }

  const result = showVideosSchema.safeParse(json);
  if (!result.success) {
    return {
      errorMessage: result.error.issues[0]?.message ?? INVALID_VIDEOS_MESSAGE,
    };
  }

  return { videos: result.data };
}
