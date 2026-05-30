// src/lib/actions/notification.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { renderTemplate, TemplateData } from "@/lib/notification-templates";

export async function getNotifications(
  profileId: string,
  options: {
    category?: string;
    priority?: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const { category, priority, unreadOnly, page = 1, limit = 20 } = options;

  try {
    const where: any = {
      userId: session.user.id,
      profileId,
      // Filter out expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (unreadOnly) where.isRead = false;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: [
          { priority: "desc" }, // URGENT first
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
    ]);

    return { data: notifications, total, page, limit };
  } catch (e) {
    logger.error("Failed to fetch notifications", e, { profileId, options });
    return { error: "Failed to fetch notifications" };
  }
}

export async function markNotificationsAsRead(profileId: string, notificationId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const where: any = {
      userId: session.user.id,
      profileId,
      isRead: false,
    };

    if (notificationId) {
      where.id = notificationId;
    }

    await db.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    logger.error("Failed to mark notifications as read", e, { profileId, notificationId });
    return { error: "Failed to mark notifications as read" };
  }
}

export async function markAllNotificationsAsRead(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        profileId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    logger.error("Failed to mark all notifications as read", e, { profileId });
    return { error: "Failed to mark all notifications as read" };
  }
}

export async function deleteNotification(profileId: string, notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await db.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id,
        profileId,
      },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    logger.error("Failed to delete notification", e, { profileId, notificationId });
    return { error: "Failed to delete notification" };
  }
}

export async function deleteExpiredNotifications() {
  try {
    await db.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return { success: true };
  } catch (e) {
    logger.error("Failed to delete expired notifications", e);
    return { error: "Failed to delete expired notifications" };
  }
}

export async function createNotification(
  profileId: string,
  userId: string,
  type: string,
  message: string,
  options: {
    category?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    link?: string;
    expiresAt?: Date;
    scheduledFor?: Date;
  } = {}
) {
  try {
    const { category = "GENERAL", priority = "NORMAL", link, expiresAt, scheduledFor } = options;

    await db.notification.create({
      data: {
        profileId,
        userId,
        type,
        category,
        priority,
        message,
        link,
        expiresAt,
        ...(scheduledFor ? { createdAt: scheduledFor } : {}),
      },
    });
    return { success: true };
  } catch (e) {
    logger.error("Failed to create notification", e, { profileId, userId, type });
    return { error: "Failed to create notification" };
  }
}

export async function createNotificationFromTemplate(
  profileId: string,
  userId: string,
  templateKey: string,
  data: TemplateData
) {
  const rendered = renderTemplate(templateKey, data);
  if (!rendered) {
    logger.error("Failed to render notification template", null, { templateKey, data });
    return { error: "Invalid template" };
  }

  return createNotification(profileId, userId, rendered.type, rendered.message, {
    category: rendered.category,
    priority: rendered.priority,
    link: rendered.link,
    expiresAt: rendered.expiresAt,
  });
}

export async function getUnreadCount(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const count = await db.notification.count({
      where: {
        userId: session.user.id,
        profileId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    return { data: count };
  } catch (e) {
    logger.error("Failed to get unread count", e, { profileId });
    return { error: "Failed to get unread count" };
  }
}

