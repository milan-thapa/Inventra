import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET - Fetch all discounts for a profile
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
    }

    // Verify profile ownership
    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const discounts = await db.discount.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ discounts });
  } catch (error) {
    logger.error("Failed to fetch discounts", error, { userId: session?.user?.id });
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
  }
}

// POST - Create a new discount
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { profileId, name, type, value, startDate, endDate, isActive } = body;

    if (!profileId || !name || !type || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify profile ownership
    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const discount = await db.discount.create({
      data: {
        profileId,
        name,
        type,
        value,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    logger.error("Failed to create discount", error, { userId: session?.user?.id });
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
  }
}
