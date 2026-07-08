import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest } from "next/server";

import { getResendClient } from "@/lib/resendClient";

export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req);

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    // Get the primary email
    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id,
    );

    if (!primaryEmail?.email_address) {
      console.error("No primary email found for user:", id);
      return new Response("Error: No primary email found", { status: 400 });
    }

    // Add to Resend audience
    await addToResendAudience({
      email: primaryEmail.email_address,
      firstName: first_name ?? undefined,
      lastName: last_name ?? undefined,
    });

    console.log(`Added user ${id} to Resend audience`);
  }

  return new Response("Webhook processed", { status: 200 });
}

async function addToResendAudience(data: {
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  // Skip if not configured
  if (!process.env.RESEND_API_KEY || !audienceId) {
    console.log("Resend audience not configured - skipping");
    return;
  }

  const resend = await getResendClient();

  const result = await resend.contacts.create({
    // Resend migrated audiences to segments; existing audience IDs are now
    // segment IDs.
    // https://resend.com/docs/dashboard/segments/migrating-from-audiences-to-segments
    segments: [{ id: audienceId }],
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    unsubscribed: false,
  });

  console.log("Successfully added contact to Resend:", result);
}
