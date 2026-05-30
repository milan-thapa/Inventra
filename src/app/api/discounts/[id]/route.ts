import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// PUT - Update a discount
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { profileId, name, type, value, startDate, endDate, isActive } = body;

    const discount = await db.discount.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(value !== undefined && { value }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    revalidatePath("/settings/discounts");
    return NextResponse.json({ discount });
  } catch (error) {
    console.error("[PUT /api/discounts/[id]]", error);
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }
}

// DELETE - Delete a discount
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.discount.delete({
      where: { id: params.id },
    });

    revalidatePath("/settings/discounts");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/discounts/[id]]", error);
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 });
  }
}
