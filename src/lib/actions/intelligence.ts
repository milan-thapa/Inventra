// src/lib/actions/intelligence.ts
"use server";

import { getFrequentlyBoughtTogether, getStockForecast, getBusinessInsights } from "@/lib/intelligence";
import { serialize } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function getRecommendations(profileId: string, itemIds: string[]) {
  try {
    const items = await getFrequentlyBoughtTogether(profileId, itemIds);
    return { data: items };
  } catch (e) {
    logger.error("Failed to get recommendations", e, { profileId });
    return { error: "Failed to get recommendations" };
  }
}

export async function getInventoryForecast(profileId: string) {
  try {
    const alerts = await getStockForecast(profileId);
    return { data: alerts };
  } catch (e) {
    logger.error("Failed to get stock forecast", e, { profileId });
    return { error: "Failed to get stock forecast" };
  }
}

export async function getAIInsights(profileId: string) {
  try {
    const insights = await getBusinessInsights(profileId);
    return { data: insights };
  } catch (e) {
    logger.error("Failed to generate AI insights", e, { profileId });
    return { error: "Failed to generate AI insights" };
  }
}
