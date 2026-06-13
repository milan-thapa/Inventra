// src/lib/actions/gallery.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function getBillImages(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const images = await db.billImage.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });
    return { data: images };
  } catch (e) {
    logger.error("Failed to fetch bill images", e, { profileId });
    return { error: "Failed to fetch bill images" };
  }
}

export async function createBillImage(
  profileId: string,
  url: string,
  fileName?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const image = await db.billImage.create({
      data: {
        profileId,
        url,
        fileName,
      },
    });
    revalidatePath("/business-tools/bill-gallery");
    return { data: image };
  } catch (e) {
    logger.error("Failed to create bill image", e, { profileId });
    return { error: "Failed to create bill image" };
  }
}

export async function deleteBillImage(profileId: string, imageId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await db.billImage.delete({
      where: { id: imageId, profileId },
    });
    revalidatePath("/business-tools/bill-gallery");
    return { success: true };
  } catch (e) {
    logger.error("Failed to delete bill image", e, { profileId, imageId });
    return { error: "Failed to delete bill image" };
  }
}
