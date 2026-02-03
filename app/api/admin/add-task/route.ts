import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Customer from "@/models/Customer";
import mongoose from "mongoose";
import { getAuthUser } from "@/lib/authServer";

export async function POST(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const body = await req.json();

    console.log("📦 TASK BODY RECEIVED:", body);

    const { customerId, staffId, treesCount, rate } = body;

    // ✅ Validate input
    const trees = Number(treesCount);
    const ratePerTree = Number(rate);

    if (
      !customerId ||
      !staffId ||
      !mongoose.Types.ObjectId.isValid(customerId) ||
      !mongoose.Types.ObjectId.isValid(staffId)
    ) {
      return NextResponse.json(
        { error: "Invalid customer or staff" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(trees) || !Number.isFinite(ratePerTree) || trees < 0 || ratePerTree < 0) {
      return NextResponse.json(
        { error: "Invalid trees count or rate" },
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
      numberOfTrees: trees,
      ratePerTree,
      totalAmount: trees * ratePerTree,
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
