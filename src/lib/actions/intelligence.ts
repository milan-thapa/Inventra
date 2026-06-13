// src/lib/actions/intelligence.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFrequentlyBoughtTogether, getStockForecast, getBusinessInsights } from "@/lib/intelligence";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getRecommendations(profileId: string, itemIds: string[]) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const items = await getFrequentlyBoughtTogether(profileId, itemIds);
    return { data: items };
  } catch (e) {
    console.error("[getRecommendations]", e);
    return { error: "Failed to get recommendations" };
  }
}

export async function getInventoryForecast(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const alerts = await getStockForecast(profileId);
    return { data: alerts };
  } catch (e) {
    console.error("[getInventoryForecast]", e);
    return { error: "Failed to get stock forecast" };
  }
}

export async function getAIInsights(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const insights = await getBusinessInsights(profileId);
    return { data: insights };
  } catch (e) {
    console.error("[getAIInsights]", e);
    return { error: "Failed to generate AI insights" };
  }
}
