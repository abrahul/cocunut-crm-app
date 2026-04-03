import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";
import "@/models/Customer";
import "@/models/Location";

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
    .select(
      "customer location exactAddress latitude longitude serviceDate completedDate numberOfTrees ratePerTree totalAmount status createdAt"
    )
    .populate("customer", "name")
    .populate("location", "name")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(tasks);
}
