import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";
import "@/models/Staff";

export async function PATCH(req: Request) {
  await connectDB();

  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { taskId, numberOfTrees, ratePerTree } = await req.json();

  if (!taskId || numberOfTrees == null || ratePerTree == null) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 }
    );
  }

  // 🔐 STAFF RESTRICTIONS
  if (auth.role === "staff") {
    // Must own the task
    if (task.staff.toString() !== auth.staffId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Cannot edit completed task
    if (task.status === "completed") {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 403 }
      );
    }
  }

  // ✅ APPLY UPDATE
  task.numberOfTrees = numberOfTrees;
  task.ratePerTree = ratePerTree;
  task.totalAmount = numberOfTrees * ratePerTree;
  task.status = "completed";

  // Admin edit tracking
  if (auth.role === "admin") {
    task.adminEdited = true;
  }

  await task.save();

  return NextResponse.json({ success: true });
}
