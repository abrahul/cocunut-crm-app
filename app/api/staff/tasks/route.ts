import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";
import "@/models/Customer";
import "@/models/Location";

export async function GET() {
  await connectDB();

  const auth = await getAuthUser(); // ✅ await
  if (!auth || auth.role !== "staff") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const tasks = await Task.find({
    staff: auth.staffId,
    status: { $ne: "completed" },
  })
    .populate("customer")
    .populate("location")
    .sort({ createdAt: -1 });

  return NextResponse.json(
    tasks.map((t) => ({
      _id: t._id,
      customerName: t.customer.name,
      location: t.location.name,
      numberOfTrees: t.numberOfTrees,
      ratePerTree: t.ratePerTree,
      totalAmount: t.totalAmount,
      status: t.status,
    }))
  );
}
