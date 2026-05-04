// src/lib/intelligence.ts
import { db } from "@/lib/db";
import { startOfDay, subDays } from "date-fns";

/**
 * Simplified Apriori-like algorithm to find items frequently bought together.
 */
export async function getFrequentlyBoughtTogether(profileId: string, currentItemIds: string[]) {
  if (currentItemIds.length === 0) return [];

  // 1. Find all sales that contain ANY of the current items
  const salesWithCurrentItems = await db.sale.findMany({
    where: {
      profileId,
      items: {
        some: {
          itemId: { in: currentItemIds },
        },
      },
    },
    include: {
      items: true,
    },
    take: 100, // Limit to recent 100 sales for performance
    orderBy: { createdAt: "desc" },
  });

  const frequencyMap: Record<string, { itemId: string; name: string; count: number }> = {};

  // 2. Count occurrences of OTHER items in these sales
  salesWithCurrentItems.forEach((sale) => {
    sale.items.forEach((item) => {
      if (item.itemId && !currentItemIds.includes(item.itemId)) {
        if (!frequencyMap[item.itemId]) {
          frequencyMap[item.itemId] = { itemId: item.itemId, name: item.name, count: 0 };
        }
        frequencyMap[item.itemId].count++;
      }
    });
  });

  // 3. Sort by frequency and return top items
  const recommendations = Object.values(frequencyMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Fetch full item details for the recommendations
  const recommendedItems = await db.item.findMany({
    where: {
      id: { in: recommendations.map((r) => r.itemId) },
    },
  });

  return recommendedItems.map(item => ({
    ...item,
    purchasePrice: Number(item.purchasePrice),
    sellingPrice: Number(item.sellingPrice),
  }));
}

/**
 * Predicts stock depletion based on Average Daily Sales (ADS).
 */
export async function getStockForecast(profileId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30);

  // 1. Get all sale items in the last 30 days
  const saleItems = await db.saleItem.findMany({
    where: {
      sale: {
        profileId,
        date: { gte: thirtyDaysAgo },
      },
    },
  });

  // 2. Calculate Average Daily Sales (ADS) per item
  const salesMap: Record<string, number> = {};
  saleItems.forEach((si) => {
    if (si.itemId) {
      salesMap[si.itemId] = (salesMap[si.itemId] || 0) + si.quantity;
    }
  });

  const adsMap: Record<string, number> = {};
  Object.keys(salesMap).forEach((id) => {
    adsMap[id] = salesMap[id] / 30;
  });

  // 3. Get current inventory
  const items = await db.item.findMany({
    where: { profileId },
  });

  // 4. Calculate days remaining
  const alerts = items.map((item) => {
    const ads = adsMap[item.id] || 0;
    const daysRemaining = ads > 0 ? Math.floor(item.stockQuantity / ads) : 999;
    
    return {
      itemId: item.id,
      name: item.name,
      stockQuantity: item.stockQuantity,
      ads,
      daysRemaining,
    };
  });

  // 5. Return items running out within 7 days
  return alerts
    .filter((a) => a.daysRemaining <= 7 || a.stockQuantity < 5)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Generates heuristic business insights.
 */
export async function getBusinessInsights(profileId: string) {
  const now = new Date();
  const currentWeekStart = subDays(now, 7);
  const prevWeekStart = subDays(now, 14);

  // 1. Get sales for current and previous weeks
  const [currentSales, prevSales] = await Promise.all([
    db.sale.findMany({
      where: { profileId, date: { gte: currentWeekStart } },
      include: { items: true },
    }),
    db.sale.findMany({
      where: { profileId, date: { gte: prevWeekStart, lt: currentWeekStart } },
      include: { items: true },
    }),
  ]);

  const currentTotal = currentSales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
  const prevTotal = prevSales.reduce((sum, s) => sum + Number(s.grandTotal), 0);

  // 2. Performance calculation
  const growth = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

  // 3. Top item identification
  const itemMap: Record<string, { name: string; current: number; prev: number }> = {};
  
  currentSales.forEach(s => s.items.forEach(i => {
    if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, current: 0, prev: 0 };
    itemMap[i.name].current += i.quantity;
  }));

  prevSales.forEach(s => s.items.forEach(i => {
    if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, current: 0, prev: 0 };
    itemMap[i.name].prev += i.quantity;
  }));

  const itemPerformances = Object.values(itemMap).map(item => ({
    ...item,
    diff: item.current - item.prev
  })).sort((a, b) => b.diff - a.diff);

  const topPerformer = itemPerformances[0];
  const lowPerformer = itemPerformances[itemPerformances.length - 1];

  // 4. Generate summary
  let summary = "";
  if (growth > 0) {
    summary += `Your sales are up by ${growth.toFixed(1)}% this week! 🎉 `;
  } else if (growth < 0) {
    summary += `Sales are down by ${Math.abs(growth).toFixed(1)}%. Let's look at some promotions. 📉 `;
  } else {
    summary += `Sales are steady this week. `;
  }

  if (topPerformer && topPerformer.current > 0) {
    summary += `Your most profitable item was '${topPerformer.name}'. `;
  }

  if (lowPerformer && lowPerformer.prev > lowPerformer.current) {
    summary += `However, '${lowPerformer.name}' sales are declining. Consider a clearance or bundling it with other items.`;
  }

  return {
    summary,
    growth,
    topPerformer,
    lowPerformer,
    stats: {
      currentTotal,
      prevTotal
    }
  };
}
