"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getItems(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const items = await db.item.findMany({
      where: { profileId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    
    // Convert Decimal to number for client serialization
    const serializedItems = items.map(item => ({
      ...item,
      purchasePrice: Number(item.purchasePrice),
      sellingPrice: Number(item.sellingPrice),
    }));

    return { data: serializedItems };
  } catch (e) {
    console.error("[getItems]", e);
    return { error: "Failed to fetch items" };
  }
}

export async function createItem(
  profileId: string,
  data: {
    name: string;
    sku?: string;
    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    unit?: string;
    categoryId?: string;
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
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        categoryId: data.categoryId,
      },
    });
    
    revalidatePath("/inventory");
    return { data: item };
  } catch (e) {
    console.error("[createItem]", e);
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
    console.error("[getItem]", e);
    return { error: "Failed to fetch item" };
  }
}

export async function updateItem(
  profileId: string,
  itemId: string,
  data: {
    name?: string;
    sku?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    stockQuantity?: number;
    unit?: string;
    categoryId?: string;
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
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        categoryId: data.categoryId,
      },
    });
    
    revalidatePath("/inventory");
    return { data: item };
  } catch (e) {
    console.error("[updateItem]", e);
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
    console.error("[deleteItem]", e);
    return { error: "Failed to delete item" };
  }
}

export async function getItemCategories(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const categories = await db.itemCategory.findMany({
      where: { profileId },
      orderBy: { name: "asc" },
    });
    return { data: categories };
  } catch (e) {
    console.error("[getItemCategories]", e);
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
    console.error("[createItemCategory]", e);
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
    console.error("[deleteItemCategory]", e);
    return { error: "Failed to delete category" };
  }
}
