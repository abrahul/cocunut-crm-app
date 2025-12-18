import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import mongoose from "mongoose";

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { taskId } = body;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
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

    if (task.status === "completed") {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 400 }
      );
    }

    task.status = "completed";
    await task.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ COMPLETE TASK ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete task" },
      { status: 500 }
    );
  }
}
