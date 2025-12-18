import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Customer from "@/models/Customer";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    console.log("📦 TASK BODY RECEIVED:", body);

    const { customerId, staffId, treesCount, rate } = body;

    // ✅ Validate input
    if (
      !customerId ||
      !staffId ||
      !mongoose.Types.ObjectId.isValid(customerId)
    ) {
      return NextResponse.json(
        { error: "Invalid customer or staff" },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(customerId).populate("location");

    if (!customer || !customer.location) {
      return NextResponse.json(
        { error: "Customer or location not found" },
        { status: 404 }
      );
    }

    const task = await Task.create({
      customer: customerId,
      location: customer.location._id,
      staff: staffId,
      numberOfTrees: treesCount,
      ratePerTree: rate,
      totalAmount: treesCount * rate,
      status: "pending",
    });

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error("❌ TASK CREATE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Task creation failed" },
      { status: 500 }
    );
  }
}
