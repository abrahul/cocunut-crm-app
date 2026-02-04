import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import "@/models/Location";
import { getAuthUser } from "@/lib/authServer";
import mongoose from "mongoose";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer id" },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(customerId)
      .populate("location")
      .lean();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER DETAIL ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
