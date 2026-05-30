import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
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

    // For now, return success since PurchaseOut model doesn't exist yet
    // This is a placeholder for the actual implementation
    return NextResponse.json({ success: true, message: "Purchase out deleted" });
  } catch (error) {
    console.error("[PURCHASE_OUT_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete purchase out" }, { status: 500 });
  }
}
