// src/lib/actions/profile.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { CreateProfileInput, UpdateSettingsInput } from "@/lib/validations/account";

// ── Get all profiles for current user ────────────────────
export async function getProfiles() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const profiles = await db.profile.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return { data: profiles };
  } catch {
    return { error: "Failed to fetch profiles" };
  }
}

// ── Get active profile ────────────────────────────────────
export async function getActiveProfile(profileId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const profile = await db.profile.findFirst({
      where: {
        userId: session.user.id,
        ...(profileId ? { id: profileId } : { isDefault: true }),
      },
    });

    if (!profile) {
      // Get first profile
      const firstProfile = await db.profile.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      });
      return { data: firstProfile };
    }

    return { data: profile };
  } catch {
    return { error: "Failed to fetch profile" };
  }
}

// ── Create new profile ────────────────────────────────────
export async function createProfile(input: CreateProfileInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Check if this is the first profile
    const existingCount = await db.profile.count({
      where: { userId: session.user.id },
    });

    const profile = await db.profile.create({
      data: {
        userId: session.user.id,
        type: input.type as "BUSINESS" | "PERSONAL",
        name: input.name,
        category: input.category || null,
        logo: input.logo || null,
        address: input.address || null,
        isDefault: existingCount === 0,
      },
    });

    // Seed default categories for the new profile
    await Promise.all([
      ...DEFAULT_EXPENSE_CATEGORIES.map((name) =>
        db.expenseCategory.create({
          data: { profileId: profile.id, name, isDefault: true },
        })
      ),
      ...DEFAULT_INCOME_CATEGORIES.map((name) =>
        db.incomeCategory.create({
          data: { profileId: profile.id, name, isDefault: true },
        })
      ),
      // Create default Cash account
      db.bankAccount.create({
        data: {
          profileId: profile.id,
          type: "Cash",
          bankName: "Cash",
          holderName: input.name,
          currentBalance: 0,
        },
      }),
    ]);

    revalidatePath("/dashboard");
    return { data: profile };
  } catch (e) {
    console.error("[createProfile]", e);
    return { error: "Failed to create profile" };
  }
}

// ── Switch active/default profile ────────────────────────
export async function switchProfile(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Verify ownership
    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    });
    if (!profile) return { error: "Profile not found" };

    // Unset all defaults, set new one
    await db.$transaction([
      db.profile.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      }),
      db.profile.update({
        where: { id: profileId },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "Failed to switch profile" };
  }
}

// ── Update profile settings ───────────────────────────────
export async function updateProfileSettings(
  profileId: string,
  settings: UpdateSettingsInput
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    });
    if (!profile) return { error: "Profile not found" };

    const updated = await db.profile.update({
      where: { id: profileId },
      data: {
        ...(settings.currency && { currency: settings.currency }),
        ...(settings.currencyPos && { currencyPos: settings.currencyPos }),
        ...(settings.language && { language: settings.language }),
        ...(settings.calendarType && { calendarType: settings.calendarType as "AD" | "BS" }),
        ...(settings.theme && { theme: settings.theme }),
        ...(settings.privacyMode !== undefined && { privacyMode: settings.privacyMode }),
        ...(settings.appLock !== undefined && { appLock: settings.appLock }),
        ...(settings.numberFormat && { numberFormat: settings.numberFormat }),
      },
    });

    revalidatePath("/settings");
    return { data: updated };
  } catch {
    return { error: "Failed to update settings" };
  }
}

// ── Check if user has profiles ────────────────────────────
export async function hasProfiles(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const count = await db.profile.count({
    where: { userId: session.user.id },
  });
  return count > 0;
}
