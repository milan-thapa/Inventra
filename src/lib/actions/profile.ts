// src/lib/actions/profile.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_ITEM_CATEGORIES } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { CreateProfileInput, UpdateSettingsInput } from "@/lib/validations/account";
import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

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

  // Rate limiting: max 5 profile creations per minute
  const { success } = await rateLimit(`create_profile_${session.user.id}`, 5, 60 * 1000);
  if (!success) return { error: "Too many requests. Please try again in a minute." };

  try {
    // Ensure user exists in database
    let user = await db.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user && session.user.email) {
      user = await db.user.findUnique({
        where: { email: session.user.email }
      });
    }
    
    if (!user) {
      // Create user if they don't exist (can happen with JWT sessions)
      try {
        user = await db.user.create({
          data: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          },
        });
      } catch (userError) {
        console.error("[createProfile] Failed to create user:", userError);
        return { error: "Failed to create user account" };
      }
    }

    // Check if this is the first profile
    const existingCount = await db.profile.count({
      where: { userId: user.id },
    });

    let profile;
    try {
      profile = await db.profile.create({
        data: {
          userId: user.id,
          type: input.type as "BUSINESS" | "PERSONAL",
          name: input.name,
          category: input.category || null,
          logo: input.logo || null,
          address: input.address || null,
          isDefault: existingCount === 0,
        },
      });
    } catch (profileError) {
      console.error("[createProfile] Failed to create profile:", profileError);
      return { error: "Failed to create profile. Please try again." };
    }

    // Seed default categories for the new profile
    try {
      await Promise.all([
        ...DEFAULT_EXPENSE_CATEGORIES.map((name) =>
          db.expenseCategory.create({
            data: { profileId: profile.id, name, isDefault: true },
          }).catch(e => {
            console.error(`[createProfile] Failed to create expense category "${name}":`, e);
          })
        ),
        ...DEFAULT_INCOME_CATEGORIES.map((name) =>
          db.incomeCategory.create({
            data: { profileId: profile.id, name, isDefault: true },
          }).catch(e => {
            console.error(`[createProfile] Failed to create income category "${name}":`, e);
          })
        ),
        ...DEFAULT_ITEM_CATEGORIES.map((name) =>
          db.itemCategory.create({
            data: { profileId: profile.id, name },
          }).catch(e => {
            console.error(`[createProfile] Failed to create item category "${name}":`, e);
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
        }).catch(e => {
          console.error("[createProfile] Failed to create default Cash account:", e);
        }),
      ]);
    } catch (seedError) {
      console.error("[createProfile] Failed to seed default data:", seedError);
      // Don't fail the entire profile creation if seeding fails
    }

    revalidatePath("/dashboard");
    return { data: profile };
  } catch (e) {
    console.error("[createProfile] Unexpected error:", e);
    return { error: "An unexpected error occurred. Please try again." };
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
        ...(settings.barcodeEnabled !== undefined && { barcodeEnabled: settings.barcodeEnabled }),
      },
    });

    revalidatePath("/settings");
    return { data: updated };
  } catch (e) {
    logger.error("Failed to update profile settings", e, { profileId, settings });
    return { error: "Failed to update settings" };
  }
}

// ── Update tax settings ────────────────────────────────────
export async function updateTaxSettings(
  profileId: string,
  settings: {
    taxEnabled: boolean;
    taxRate: number;
    taxType: string;
    taxNumber?: string;
  }
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
        taxEnabled: settings.taxEnabled,
        taxRate: settings.taxRate,
        taxType: settings.taxType,
        taxNumber: settings.taxNumber || null,
      },
    });

    revalidatePath("/settings/tax");
    return { data: updated };
  } catch {
    return { error: "Failed to update tax settings" };
  }
}

// ── Update personal profile ────────────────────────────────
export async function updatePersonalProfile(
  profileId: string,
  data: {
    name: string;
    category?: string;
    address?: string;
    logo?: string;
  }
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
        name: data.name,
        category: data.category || null,
        address: data.address || null,
        logo: data.logo || null,
      },
    });

    revalidatePath("/settings/personal-profile");
    revalidatePath("/dashboard");
    return { data: updated };
  } catch {
    return { error: "Failed to update profile" };
  }
}

// ── Update user account ────────────────────────────────────
export async function updateUserAccount(
  data: {
    name: string;
    phone?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phone: data.phone || null,
      },
    });

    revalidatePath("/settings/my-account");
    return { data: updated };
  } catch {
    return { error: "Failed to update account" };
  }
}

// ── Update feature settings ────────────────────────────────
export async function updateFeatureSettings(
  profileId: string,
  settings: {
    sendReminder?: boolean;
    openingBalance?: boolean;
    partyPhoto?: boolean;
    panNumber?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    });
    if (!profile) return { error: "Profile not found" };

    // Store feature settings in address field as JSON for now
    // In production, add dedicated columns to the Profile schema
    const currentSettings = profile.address ? JSON.parse(profile.address) : {};
    const newSettings = { ...currentSettings, ...settings };

    const updated = await db.profile.update({
      where: { id: profileId },
      data: {
        address: JSON.stringify(newSettings),
      },
    });

    revalidatePath("/settings/feature-settings/parties");
    return { data: updated, success: true };
  } catch (e) {
    logger.error("Failed to update feature settings", e, { profileId, settings });
    return { error: "Failed to update feature settings" };
  }
}

// ── Get feature settings ────────────────────────────────────
export async function getFeatureSettings(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    });
    if (!profile) return { error: "Profile not found" };

    // Parse feature settings from address field
    const settings = profile.address ? JSON.parse(profile.address) : {
      sendReminder: true,
      openingBalance: true,
      partyPhoto: false,
      panNumber: false,
    };

    return { data: settings };
  } catch (e) {
    logger.error("Failed to get feature settings", e, { profileId });
    return { error: "Failed to get feature settings" };
  }
}

// ── Check if user has profiles ────────────────────────────
export async function hasProfiles(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) {

    return false;
  }


  const count = await db.profile.count({
    where: { userId: session.user.id },
  });

  return count > 0;
}
