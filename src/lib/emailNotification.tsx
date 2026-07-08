import { eq } from "drizzle-orm";

import { authWithSentry } from "@/auth/utils";
import { db } from "@/drizzle/db";
import { shows, performances, songs, albums } from "@/drizzle/schema";
import {
  getShowTitle,
  getShowPath,
  getPerformancePathBySongAndShow,
  getPerformanceTitle,
  getSongPath,
  getAlbumPath,
} from "@/utils";

import EditNotification from "../emails/EditNotification";
import { getResendClient } from "./resendClient";

interface EditNotificationData {
  entityType: string;
  action: "create" | "update" | "delete";
  entityId?: string;
  details?: string;
}

export async function sendEditNotification(data: EditNotificationData) {
  // Skip if no Resend credentials configured
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_EMAIL) {
    console.log("Email notification skipped - Resend not configured");
    return;
  }

  try {
    const { userId } = await authWithSentry();
    const userInfo = userId ?? "Unknown user";

    // Fetch entity title and URL based on type
    let entityTitle: string | undefined;
    let entityUrl: string | undefined;
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "https://livegizzrankings.com";

    if (data.entityId) {
      try {
        switch (data.entityType) {
          case "show": {
            const show = await db.query.shows.findFirst({
              where: eq(shows.id, data.entityId),
            });
            if (show) {
              entityTitle = getShowTitle(show);
              entityUrl = `${baseUrl}${getShowPath(show)}`;
            }
            break;
          }
          case "performance": {
            const performance = await db.query.performances.findFirst({
              where: eq(performances.id, data.entityId),
              with: {
                song: { with: { album: true } },
                show: true,
              },
            });
            if (performance) {
              entityTitle = getPerformanceTitle(
                performance.song,
                performance.show,
              );
              entityUrl = `${baseUrl}${getPerformancePathBySongAndShow(performance.song, performance.show)}`;
            }
            break;
          }
          case "song": {
            const song = await db.query.songs.findFirst({
              where: eq(songs.id, data.entityId),
            });
            if (song) {
              entityTitle = song.title;
              entityUrl = `${baseUrl}${getSongPath(song)}`;
            }
            break;
          }
          case "album": {
            const album = await db.query.albums.findFirst({
              where: eq(albums.id, data.entityId),
            });
            if (album) {
              entityTitle = album.title;
              entityUrl = `${baseUrl}${getAlbumPath(album)}`;
            }
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching entity details:", error);
      }
    }

    const subject = `🎸 Live Gizz Edit: ${data.action.toUpperCase()} ${data.entityType}${entityTitle ? ` - ${entityTitle}` : ""}`;

    const resend = await getResendClient();
    await resend.emails.send({
      from: "Live Gizz Rankings <notifications@livegizzrankings.com>",
      to: [process.env.NOTIFICATION_EMAIL],
      subject,
      react: (
        <EditNotification
          entityType={data.entityType}
          action={data.action}
          entityId={data.entityId}
          entityTitle={entityTitle}
          entityUrl={entityUrl}
          details={data.details}
          userInfo={userInfo}
          timestamp={new Date().toLocaleString()}
          environment={process.env.NODE_ENV || "development"}
        />
      ),
    });

    console.log("Email notification sent successfully");
  } catch (error) {
    // Don't throw errors for notification failures
    console.error("Failed to send email notification:", error);
  }
}
