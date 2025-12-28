import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { taskId, numberOfTrees, ratePerTree, role } = body;

    if (!taskId || numberOfTrees == null || ratePerTree == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // STAFF restriction
    if (role === "staff" && task.status === "completed") {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 403 }
      );
    }

    task.numberOfTrees = numberOfTrees;
    task.ratePerTree = ratePerTree;
    task.totalAmount = numberOfTrees * ratePerTree;
    task.status = "completed";

    if (role === "admin") {
      task.adminEdited = true;
    }

    await task.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
