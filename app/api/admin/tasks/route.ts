import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Customer from "@/models/Customer";
import { getAuthUser } from "@/lib/authServer";

// ✅ FORCE schema registration
import "@/models/Staff";
import "@/models/Customer";
import "@/models/Location";

export async function GET(request: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    let taskFilter = {};
    if (q) {
      const customers = await Customer.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { mobile: { $regex: q, $options: "i" } },
        ],
      }).select("_id");
      const ids = customers.map((c: any) => c._id);
      taskFilter = { customer: { $in: ids } };
    }

    const tasks = await Task.find(taskFilter)
      .populate("customer", "name mobile")
      .populate("location", "name")
      .populate("staff", "name phone")
      .sort({ createdAt: -1 });

    return NextResponse.json(tasks);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
