"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getItems(profileId: string, options: { page?: number; limit?: number } = {}) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  const { page = 1, limit = 50 } = options;

  try {
    const [items, total] = await Promise.all([
      db.item.findMany({
        where: { profileId },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.item.count({ where: { profileId } }),
    ]);
    
    // Convert Decimal to number for client serialization
    const serializedItems = items.map(item => ({
      ...item,
      purchasePrice: Number(item.purchasePrice),
      sellingPrice: Number(item.sellingPrice),
    }));

    return { data: serializedItems, total, page, limit };
  } catch (e) {
    logger.error("Failed to fetch items", e, { profileId });
    return { error: "Failed to fetch items" };
  }
}

export async function createItem(
  profileId: string,
  data: {
    name: string;
    sku?: string;
    barcode?: string;
    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    unit?: string;
    type?: string;
    description?: string;
    specifications?: string;
    categoryId?: string;
    brand?: string;
    manufacturer?: string;
    supplierId?: string;
    reorderPoint?: number;
    maxStock?: number;
    weight?: number;
    dimensions?: string;
    shelfLocation?: string;
    images?: string[];
  }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const item = await db.item.create({
      data: {
        profileId,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        type: data.type || "PRODUCT",
        description: data.description,
        specifications: data.specifications,
        categoryId: data.categoryId,
        brand: data.brand,
        manufacturer: data.manufacturer,
        supplierId: data.supplierId,
        reorderPoint: data.reorderPoint || 10,
        maxStock: data.maxStock,
        weight: data.weight,
        dimensions: data.dimensions,
        shelfLocation: data.shelfLocation,
        images: data.images || [],
      },
    });
    
    revalidatePath("/inventory");
    return { data: item };
  } catch (e) {
    logger.error("Failed to create item", e, { profileId, data });
    return { error: "Failed to create item" };
  }
}

export async function getItem(profileId: string, itemId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const item = await db.item.findUnique({
      where: { id: itemId, profileId },
    });
    if (!item) return { error: "Item not found" };
    
    return {
      data: {
        ...item,
        purchasePrice: Number(item.purchasePrice),
        sellingPrice: Number(item.sellingPrice),
      }
    };
  } catch (e) {
    logger.error("Failed to fetch item", e, { profileId, itemId });
    return { error: "Failed to fetch item" };
  }
}

export async function updateItem(
  profileId: string,
  itemId: string,
  data: {
    name?: string;
    sku?: string;
    barcode?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    stockQuantity?: number;
    unit?: string;
    type?: string;
    description?: string;
    specifications?: string;
    categoryId?: string;
    brand?: string;
    manufacturer?: string;
    supplierId?: string;
    reorderPoint?: number;
    maxStock?: number;
    weight?: number;
    dimensions?: string;
    shelfLocation?: string;
    images?: string[];
  }
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const item = await db.item.update({
      where: { id: itemId, profileId },
      data: {
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        type: data.type,
        description: data.description,
        specifications: data.specifications,
        categoryId: data.categoryId,
        brand: data.brand,
        manufacturer: data.manufacturer,
        supplierId: data.supplierId,
        reorderPoint: data.reorderPoint,
        maxStock: data.maxStock,
        weight: data.weight,
        dimensions: data.dimensions,
        shelfLocation: data.shelfLocation,
        images: data.images,
      },
    });
    
    revalidatePath("/inventory");
    return { data: item };
  } catch (e) {
    logger.error("Failed to update item", e, { profileId, itemId, data });
    return { error: "Failed to update item" };
  }
}

export async function deleteItem(profileId: string, itemId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.item.delete({
      where: { id: itemId, profileId },
    });
    
    revalidatePath("/inventory");
    return { success: true };
  } catch (e) {
    logger.error("Failed to delete item", e, { profileId, itemId });
    return { error: "Failed to delete item" };
  }
}

export async function getItemCategories(profileId: string, options: { page?: number; limit?: number } = {}) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  const { page = 1, limit = 100 } = options;

  try {
    const [categories, total] = await Promise.all([
      db.itemCategory.findMany({
        where: { profileId },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.itemCategory.count({ where: { profileId } }),
    ]);
    return { data: categories, total, page, limit };
  } catch (e) {
    logger.error("Failed to fetch item categories", e, { profileId });
    return { error: "Failed to fetch categories" };
  }
}

export async function createItemCategory(profileId: string, name: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const category = await db.itemCategory.create({
      data: { profileId, name },
    });
    return { data: category };
  } catch (e) {
    logger.error("Failed to create item category", e, { profileId, name });
    return { error: "Failed to create category" };
  }
}

export async function deleteItemCategory(profileId: string, categoryId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.itemCategory.delete({
      where: { id: categoryId, profileId },
    });
    return { success: true };
  } catch (e) {
    logger.error("Failed to delete item category", e, { profileId, categoryId });
    return { error: "Failed to delete category" };
  }
}

export async function adjustStock(
  profileId: string,
  itemId: string,
  type: "ADD" | "REDUCE",
  data: {
    quantity: number;
    price: number;
    remarks: string;
    adjustedDate: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    // 1. Get the item to determine previous stock
    const item = await db.item.findUnique({
      where: { id: itemId, profileId }
    });
    if (!item) return { error: "Item not found" };

    const previousQty = item.stockQuantity;
    const quantity = Math.abs(data.quantity);
    const newQty = type === "ADD" 
      ? previousQty + quantity 
      : Math.max(0, previousQty - quantity);

    // 2. Perform updates: stock quantity & prices
    const updateData: any = {
      stockQuantity: newQty
    };
    if (type === "ADD") {
      updateData.purchasePrice = data.price;
    } else {
      updateData.sellingPrice = data.price;
    }

    // Run transaction to ensure atomicity
    const [updatedItem, movement] = await db.$transaction([
      db.item.update({
        where: { id: itemId, profileId },
        data: updateData
      }),
      db.stockMovement.create({
        data: {
          itemId,
          profileId,
          type,
          quantity,
          previousQty,
          newQty,
          reason: data.remarks,
          userId: session.user.id,
          createdAt: new Date(data.adjustedDate)
        }
      })
    ]);

    revalidatePath("/inventory");
    return { data: { item: updatedItem, movement } };
  } catch (e) {
    logger.error("Failed to adjust stock", e, { profileId, itemId, type, data });
    return { error: "Failed to adjust stock" };
  }
}

export async function getItemActivity(profileId: string, itemId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const movements = await db.stockMovement.findMany({
      where: { itemId, profileId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return { data: movements };
  } catch (e) {
    logger.error("Failed to fetch item activity", e, { profileId, itemId });
    return { error: "Failed to fetch item activity" };
  }
}

// ─── Inventory Reports ────────────────────────────────────────────────────────

export async function getInventoryReports(profileId: string, options?: {
  startDate?: string;
  endDate?: string;
}) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const dateFilter: any = {};
    if (options?.startDate || options?.endDate) {
      dateFilter.createdAt = {};
      if (options.startDate) dateFilter.createdAt.gte = new Date(options.startDate);
      if (options.endDate) dateFilter.createdAt.lte = new Date(options.endDate);
    }

    // Get all items
    const items = await db.item.findMany({
      where: { profileId },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get stock movements
    const movements = await db.stockMovement.findMany({
      where: { profileId, ...dateFilter },
      orderBy: { createdAt: "desc" }
    });

    // Calculate metrics
    const totalItems = items.length;
    const totalStock = items.reduce((sum, item) => sum + Number(item.stockQuantity || 0), 0);
    const totalValue = items.reduce((sum, item) => sum + (Number(item.stockQuantity || 0) * Number(item.purchasePrice || 0)), 0);
    const lowStockItems = items.filter(item => item.reorderPoint && Number(item.stockQuantity) <= Number(item.reorderPoint));
    const outOfStockItems = items.filter(item => Number(item.stockQuantity) === 0);

    // Category-wise analysis
    const categoryAnalysis = items.reduce((acc, item) => {
      const categoryName = item.category?.name || "General";
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          itemCount: 0,
          totalStock: 0,
          totalValue: 0
        };
      }
      acc[categoryName].itemCount += 1;
      acc[categoryName].totalStock += Number(item.stockQuantity || 0);
      acc[categoryName].totalValue += Number(item.stockQuantity || 0) * Number(item.purchasePrice || 0);
      return acc;
    }, {} as Record<string, any>);

    // Stock movement summary
    const stockAdded = movements.filter(m => m.type === "ADD").reduce((sum, m) => sum + m.quantity, 0);
    const stockReduced = movements.filter(m => m.type === "REDUCE").reduce((sum, m) => sum + m.quantity, 0);

    return {
      data: {
        summary: {
          totalItems,
          totalStock,
          totalValue,
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          stockAdded,
          stockReduced
        },
        lowStockItems,
        outOfStockItems,
        categoryAnalysis: Object.values(categoryAnalysis),
        movements: movements.slice(0, 50) // Last 50 movements
      }
    };
  } catch (e) {
    logger.error("Failed to fetch inventory reports", e, { profileId, options });
    return { error: "Failed to fetch inventory reports" };
  }
}

