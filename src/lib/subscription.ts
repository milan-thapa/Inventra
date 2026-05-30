// src/lib/subscription.ts
import { db } from "./db";
import { PLANS, PlanType, createCheckoutSession, createPortalSession } from "./stripe";
import { AppError } from "./error-handler";
import { invalidateProfileCache } from "./cache";

/**
 * Get user's subscription status
 */
export async function getUserSubscription(userId: string) {
  const profiles = await db.profile.findMany({
    where: { userId },
    select: {
      id: true,
      subscriptionPlan: true,
      subscriptionEnd: true,
    },
  });

  return profiles.map((profile) => ({
    profileId: profile.id,
    plan: profile.subscriptionPlan,
    endDate: profile.subscriptionEnd,
    isActive: !profile.subscriptionEnd || profile.subscriptionEnd > new Date(),
  }));
}

/**
 * Check if user has active subscription for a profile
 */
export async function hasActiveSubscription(profileId: string): Promise<boolean> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: {
      subscriptionPlan: true,
      subscriptionEnd: true,
    },
  });

  if (!profile) return false;

  // Trial users have access
  if (profile.subscriptionPlan === "trial") return true;

  // Check if subscription is active
  return !profile.subscriptionEnd || profile.subscriptionEnd > new Date();
}

/**
 * Check if profile can perform action based on plan limits
 */
export async function checkPlanLimits(
  profileId: string,
  action: "transactions" | "profiles" | "api"
): Promise<{ allowed: boolean; limit?: number; current?: number }> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: {
      subscriptionPlan: true,
      subscriptionEnd: true,
      userId: true,
    },
  });

  if (!profile) {
    return { allowed: false };
  }

  const plan = profile.subscriptionPlan as PlanType;
  const planConfig = PLANS[plan];

  if (!planConfig) {
    return { allowed: false };
  }

  // Check if subscription is active
  if (profile.subscriptionEnd && profile.subscriptionEnd < new Date()) {
    return { allowed: false };
  }

  // Check specific limits based on plan
  switch (action) {
    case "transactions":
      if (plan === "BASIC") {
        const currentMonth = new Date();
        const transactionCount = await db.transaction.count({
          where: {
            profileId,
            date: {
              gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
            },
          },
        });
        return {
          allowed: transactionCount < 100,
          limit: 100,
          current: transactionCount,
        };
      }
      return { allowed: true };

    case "profiles":
      const profileCount = await db.profile.count({
        where: { userId: profile.userId },
      });
      const maxProfiles = plan === "BASIC" ? 1 : plan === "PRO" ? 5 : Infinity;
      return {
        allowed: profileCount < maxProfiles,
        limit: maxProfiles === Infinity ? undefined : maxProfiles,
        current: profileCount,
      };

    case "api":
      return { allowed: plan !== "BASIC" };

    default:
      return { allowed: true };
  }
}

/**
 * Upgrade subscription
 */
export async function upgradeSubscription(
  profileId: string,
  plan: PlanType,
  successUrl: string,
  cancelUrl: string
) {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { userId: true },
  });

  if (!profile) {
    throw new AppError("Profile not found", "NOT_FOUND", 404);
  }

  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    throw new AppError("Invalid plan", "INVALID_PLAN", 400);
  }

  const session = await createCheckoutSession(
    profile.userId,
    priceId,
    successUrl,
    cancelUrl
  );

  return session;
}

/**
 * Manage subscription (customer portal)
 */
export async function manageSubscription(profileId: string, returnUrl: string) {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { 
      stripeCustomerId: true,
      userId: true,
    },
  });

  if (!profile?.stripeCustomerId) {
    throw new AppError(
      "No active subscription found",
      "NO_SUBSCRIPTION",
      404
    );
  }

  const session = await createPortalSession(profile.stripeCustomerId, returnUrl);
  return session;
}

/**
 * Update subscription in database after webhook
 */
export async function updateSubscriptionFromWebhook(
  userId: string,
  subscriptionId: string,
  customerId: string,
  status: string,
  endDate?: Date
) {
  const profile = await db.profile.findFirst({
    where: { userId },
  });

  if (profile) {
    await db.profile.update({
      where: { id: profile.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        subscriptionEnd: endDate,
        subscriptionPlan: status === "active" ? "PRO" : "trial",
      },
    });

    // Invalidate cache
    await invalidateProfileCache(profile.id);
  }
}
