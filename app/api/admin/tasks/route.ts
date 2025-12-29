import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

// ✅ FORCE schema registration
import "@/models/Staff";
import "@/models/Customer";
import "@/models/Location";

export async function GET() {
  try {
    await connectDB();

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
