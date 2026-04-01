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
      const nextStaffId = body.staffId;
      if (String(task.staff) !== nextStaffId) {
        task.staff = nextStaffId;
        task.staffHidden = false;
        task.staffHiddenAt = undefined;
      }
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

    const wasCompleted = task.status === "completed";
    const nextStatus =
      body.status === "pending" || body.status === "completed"
        ? body.status
        : null;
    const completedDateInput =
      typeof body.completedDate === "string"
        ? body.completedDate.trim()
        : null;

    if (nextStatus) {
      task.status = nextStatus;
      if (nextStatus === "completed") {
        if (!wasCompleted || !task.completedDate) {
          task.completedDate = new Date();
        }
      } else {
        task.completedDate = undefined;
        task.staffHidden = false;
        task.staffHiddenAt = undefined;
      }
    }

    if (typeof body.serviceDate === "string" && body.serviceDate) {
      task.serviceDate = body.serviceDate;
    }

    if (completedDateInput !== null) {
      if (nextStatus === "pending") {
        task.completedDate = undefined;
      } else if (nextStatus === "completed" || task.status === "completed") {
        if (!completedDateInput) {
          task.completedDate = undefined;
        } else {
          const parsedCompleted = new Date(completedDateInput);
          if (!Number.isNaN(parsedCompleted.getTime())) {
            task.completedDate = parsedCompleted;
          }
        }
      }
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
