import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Customer from "@/models/Customer";
import Location from "@/models/Location";
import Staff from "@/models/Staff";

export async function GET() {
  try {
    await connectDB();

    const tasks = await Task.find()
      .populate("customer")
      .populate("location")
      .populate("staff")
      .sort({ createdAt: -1 });

    console.log("ADMIN TASKS COUNT:", tasks.length);

    return NextResponse.json(tasks);
  } catch (err: any) {
    console.error("ADMIN TASKS ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
