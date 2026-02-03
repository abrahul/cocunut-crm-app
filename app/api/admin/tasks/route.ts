import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";

// ✅ FORCE schema registration
import "@/models/Staff";
import "@/models/Customer";
import "@/models/Location";

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

    const tasks = await Task.find()
      .populate("customer", "name")
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
