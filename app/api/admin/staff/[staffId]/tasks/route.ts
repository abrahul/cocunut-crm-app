import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params; // ✅ unwrap params

  await connectDB();

  const tasks = await Task.find({ staff: staffId })
    .populate("customer", "name phone location")
    .sort({ createdAt: -1 });

  return NextResponse.json(tasks);
}
