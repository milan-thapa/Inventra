// src/lib/actions/notification-preferences.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getNotificationPreferences(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const preferences = await db.notificationPreference.findMany({
      where: {
        userId: session.user.id,
        profileId,
      },
    });
    return { data: preferences };
  } catch (e) {
    logger.error("Failed to fetch notification preferences", e, { profileId });
    return { error: "Failed to fetch notification preferences" };
  }
}

export async function setNotificationPreference(
  profileId: string,
  category: string,
  channel: string,
  enabled: boolean
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.notificationPreference.upsert({
      where: {
        userId_profileId_category_channel: {
          userId: session.user.id,
          profileId,
          category,
          channel,
        },
      },
      create: {
        userId: session.user.id,
        profileId,
        category,
        channel,
        enabled,
      },
      update: {
        enabled,
      },
    });
    return { success: true };
  } catch (e) {
    logger.error("Failed to set notification preference", e, { profileId, category, channel });
    return { error: "Failed to set notification preference" };
  }
}

export async function initializeDefaultPreferences(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  const categories = ["GENERAL", "SALES", "PURCHASE", "PAYMENT", "REMINDER", "SYSTEM"];
  const channels = ["IN_APP", "EMAIL"];

  try {
    for (const category of categories) {
      for (const channel of channels) {
        await db.notificationPreference.upsert({
          where: {
            userId_profileId_category_channel: {
              userId: session.user.id,
              profileId,
              category,
              channel,
            },
          },
          create: {
            userId: session.user.id,
            profileId,
            category,
            channel,
            enabled: channel === "IN_APP", // Enable in-app by default
          },
          update: {}, // Don't update if exists
        });
      }
    }
    return { success: true };
  } catch (e) {
    logger.error("Failed to initialize default preferences", e, { profileId });
    return { error: "Failed to initialize default preferences" };
  }
}
