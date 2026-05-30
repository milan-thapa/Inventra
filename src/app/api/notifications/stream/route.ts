// src/app/api/notifications/stream/route.ts
/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 * Allows clients to receive notifications without polling
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection message
      sendEvent({ type: "connected", message: "Notification stream connected" });

      // Poll for new notifications every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          const notifications = await db.notification.findMany({
            where: {
              userId: session.user.id,
              isRead: false,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
            orderBy: [
              { priority: "desc" },
              { createdAt: "desc" },
            ],
            take: 10,
          });

          sendEvent({ type: "notifications", data: notifications });
        } catch (error) {
          console.error("[SSE Poll Error]", error);
        }
      }, 2000);

      // Clean up on connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
