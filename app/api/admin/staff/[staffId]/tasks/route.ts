import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params;

  await connectDB();
  const auth = await getAuthUser();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const tasks = await Task.find({ staff: staffId })
    .populate("customer", "name phone location")
    .sort({ createdAt: -1 });

  return NextResponse.json(tasks);
}
