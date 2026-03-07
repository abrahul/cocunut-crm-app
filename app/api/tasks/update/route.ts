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

  const { taskId, numberOfTrees, ratePerTree, sideTask } = await req.json();

  if (!taskId || numberOfTrees == null || ratePerTree == null) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const mainTrees = Number(numberOfTrees);
  const mainRate = Number(ratePerTree);
  if (
    !Number.isFinite(mainTrees) ||
    !Number.isFinite(mainRate) ||
    mainTrees < 0 ||
    mainRate < 0
  ) {
    return NextResponse.json(
      { error: "Trees and rate must be valid numbers" },
      { status: 400 }
    );
  }

  if (sideTask != null && typeof sideTask !== "object") {
    return NextResponse.json(
      { error: "Invalid side task payload" },
      { status: 400 }
    );
  }

  const hasSideTaskInput =
    sideTask &&
    (sideTask.numberOfTrees !== undefined || sideTask.ratePerTree !== undefined);
  const sideTaskTrees = hasSideTaskInput ? Number(sideTask.numberOfTrees) : null;
  const sideTaskRate = hasSideTaskInput ? Number(sideTask.ratePerTree) : null;

  if (hasSideTaskInput) {
    if (
      sideTaskTrees === null ||
      sideTaskRate === null ||
      !Number.isFinite(sideTaskTrees) ||
      !Number.isFinite(sideTaskRate) ||
      sideTaskTrees < 0 ||
      sideTaskRate < 0
    ) {
      return NextResponse.json(
        { error: "Side task trees and rate must be valid numbers" },
        { status: 400 }
      );
    }
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
  task.numberOfTrees = mainTrees;
  task.ratePerTree = mainRate;
  task.totalAmount = mainTrees * mainRate;
  task.status = "completed";
  task.completedDate = new Date();

  // Admin edit tracking
  if (auth.role === "admin") {
    task.adminEdited = true;
  }

  await task.save();

  if (hasSideTaskInput) {
    const sideTrees = sideTaskTrees as number;
    const sideRate = sideTaskRate as number;
    const sideTaskCustomerPhone =
      typeof sideTask?.customerPhone === "string" &&
      sideTask.customerPhone.trim()
        ? sideTask.customerPhone.trim()
        : undefined;

    await Task.create({
      customer: task.customer,
      location: task.location,
      staff: task.staff,
      taskType: "side",
      parentTask: task._id,
      sideTaskCustomerPhone,
      numberOfTrees: sideTrees,
      ratePerTree: sideRate,
      totalAmount: sideTrees * sideRate,
      serviceDate: task.serviceDate,
      serviceTime: task.serviceTime,
      medicine: task.medicine,
      exactAddress: task.exactAddress,
      latitude: task.latitude,
      longitude: task.longitude,
      status: "completed",
      completedDate: new Date(),
      adminEdited: auth.role === "admin",
    });
  }

  return NextResponse.json({ success: true });
}
