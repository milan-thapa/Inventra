// src/lib/actions/gallery.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function verifyProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.profile.findFirst({ where: { id: profileId, userId: session.user.id } });
}

export async function getBillImages(profileId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    const images = await db.billImage.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });
    return { data: images };
  } catch (e) {
    console.error("[getBillImages]", e);
    return { error: "Failed to fetch bill images" };
  }
}

export async function createBillImage(
  profileId: string,
  url: string,
  fileName?: string
) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

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
    console.error("[createBillImage]", e);
    return { error: "Failed to create bill image" };
  }
}

export async function deleteBillImage(profileId: string, imageId: string) {
  const profile = await verifyProfile(profileId);
  if (!profile) return { error: "Unauthorized" };

  try {
    await db.billImage.delete({
      where: { id: imageId, profileId },
    });
    revalidatePath("/business-tools/bill-gallery");
    return { success: true };
  } catch (e) {
    console.error("[deleteBillImage]", e);
    return { error: "Failed to delete bill image" };
  }
}
