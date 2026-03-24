import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import { getAuthUser } from "@/lib/authServer";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const isArchived = body?.isArchived === true;

    const updated = await Customer.findByIdAndUpdate(
      customerId,
      { isArchived },
      { new: true }
    )
      .populate("location")
      .lean();

    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER ARCHIVE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
