import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();

    const task = await Task.findById(body.taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (typeof body.staffId === "string" && body.staffId) {
      task.staff = body.staffId;
    }

    if (typeof body.locationId === "string" && body.locationId) {
      task.location = body.locationId;
    }

    if (typeof body.numberOfTrees === "number") {
      task.numberOfTrees = body.numberOfTrees;
    }

    if (typeof body.ratePerTree === "number") {
      task.ratePerTree = body.ratePerTree;
    }

    if (body.status === "pending" || body.status === "completed") {
      task.status = body.status;
    }

    if (
      typeof task.numberOfTrees === "number" &&
      typeof task.ratePerTree === "number"
    ) {
      task.totalAmount = task.numberOfTrees * task.ratePerTree;
    }

    task.adminEdited = true;

    await task.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
