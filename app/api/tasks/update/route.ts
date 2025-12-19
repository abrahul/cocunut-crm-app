import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      taskId,
      numberOfTrees,
      ratePerTree,
      userId,
      role,
    } = body;

    if (!taskId || !userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAdmin = role === "admin";
    const isStaffOwner = task.staff.toString() === userId;

    // ❌ Staff cannot edit others' tasks
    if (!isAdmin && !isStaffOwner) {
      return NextResponse.json(
        { error: "Not allowed to edit this task" },
        { status: 403 }
      );
    }

    // ❌ Staff cannot edit completed tasks
    if (task.status === "completed" && !isAdmin) {
      return NextResponse.json(
        { error: "Completed tasks can be edited only by admin" },
        { status: 403 }
      );
    }

    // ✅ Update values
    task.numberOfTrees = numberOfTrees;
    task.ratePerTree = ratePerTree;
    task.totalAmount = numberOfTrees * ratePerTree;

    // ✅ Admin override marker
    if (isAdmin && task.status === "completed") {
      task.adminEdited = true;
    }

    await task.save();

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (err: any) {
    console.error("TASK UPDATE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Task update failed" },
      { status: 500 }
    );
  }
}
