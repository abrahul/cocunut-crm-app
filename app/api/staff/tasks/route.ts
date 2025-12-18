import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

// 🔥 FORCE MODEL REGISTRATION
import "@/models/Customer";
import "@/models/Location";

export async function GET(req: Request) {
  console.log("✅ STAFF TASKS API HIT");

  try {
    await connectDB();
    console.log("✅ DB CONNECTED");

    const staffId = "6943aecda0c1ebef23e82f71";
    // const staffId = req.headers.get("staff-id");
    console.log("🧑 STAFF ID:", staffId);

    if (!staffId) {
      return NextResponse.json([], { status: 200 });
    }

    const tasks = await Task.find({ staff: staffId })
      .populate("customer")
      .populate("location");

    console.log("📦 TASKS FOUND:", tasks.length);

    return NextResponse.json(tasks);
  } catch (err: any) {
    console.error("🔥 API ERROR:", err);
    return NextResponse.json([], { status: 200 });
  }
}
