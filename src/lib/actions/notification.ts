// src/lib/actions/notification.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getNotifications(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        profileId: profileId,
        createdAt: { lte: new Date() },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { data: notifications };
  } catch (e) {
    console.error("[getNotifications]", e);
    return { error: "Failed to fetch notifications" };
  }
}

export async function markNotificationsAsRead(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        profileId: profileId,
        isRead: false,
        createdAt: { lte: new Date() },
      },
      data: {
        isRead: true,
      },
    });
    revalidatePath("/dashboard"); // Or a more specific path if needed
    return { success: true };
  } catch (e) {
    console.error("[markNotificationsAsRead]", e);
    return { error: "Failed to mark notifications as read" };
  }
}

export async function createNotification(
  profileId: string,
  userId: string,
  type: string,
  message: string,
  link?: string,
  scheduledFor?: Date
) {
  try {
    await db.notification.create({
      data: {
        profileId,
        userId,
        type,
        message,
        link,
        ...(scheduledFor ? { createdAt: scheduledFor } : {}),
      },
    });
  } catch (e) {
    console.error("[createNotification]", e);
  }
}
