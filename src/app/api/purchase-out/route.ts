import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
    }

    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Return purchases as purchase-outs (same functionality)
    const purchases = await db.purchase.findMany({
      where: { profileId },
      include: { party: true, items: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ purchaseOuts: purchases });
  } catch (error) {
    logger.error("Failed to fetch purchase outs", error, { userId: session?.user?.id });
    return NextResponse.json({ error: "Failed to fetch purchase outs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let session: any = null;
  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, billNo, partyId, items, totalAmount, discount, grandTotal, paymentMethod, status, remarks, date } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
    }

    const profile = await db.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Create purchase record (purchase-out is same as purchase)
    const purchase = await db.purchase.create({
      data: {
        profileId,
        billNo: billNo || 1,
        partyId,
        totalAmount,
        discount: discount || 0,
        grandTotal,
        paymentMethod: paymentMethod || "CASH",
        status: status || "PAID",
        remarks,
        date: date ? new Date(date) : new Date(),
        items: {
          create: items?.map((item: any) => ({
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
          })) || [],
        },
      },
    });

    return NextResponse.json({ success: true, data: purchase });
  } catch (error) {
    logger.error("Failed to create purchase out", error, { userId: session?.user?.id });
    return NextResponse.json({ error: "Failed to create purchase out" }, { status: 500 });
  }
}
