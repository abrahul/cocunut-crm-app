import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import "@/models/Location";
import { getAuthUser } from "@/lib/authServer";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const customers = await Customer.find()
      .populate("location")
      .lean();

    return NextResponse.json(customers, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER API ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { customerId, remark } = await req.json();

    if (
      !customerId ||
      typeof remark !== "string" ||
      !mongoose.Types.ObjectId.isValid(customerId)
    ) {
      return NextResponse.json(
        { error: "Customer and remark are required" },
        { status: 400 }
      );
    }

    const updated = await Customer.findByIdAndUpdate(
      customerId,
      { remark },
      { new: true }
    )
      .populate("location")
      .lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER UPDATE ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
