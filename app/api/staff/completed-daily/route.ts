import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";
import "@/models/Customer";
import mongoose from "mongoose";

const toDateParam = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export async function GET(request: Request) {
  await connectDB();

  const auth = await getAuthUser();
  if (!auth || auth.role !== "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from")?.trim();
  const toParam = searchParams.get("to")?.trim();
  const taskTypeParam = searchParams.get("taskType")?.trim();
  const taskType = taskTypeParam === "side" ? "side" : "main";

  const today = new Date();
  const defaultDate = toDateParam(today);
  const from = fromParam || defaultDate;
  const to = toParam || defaultDate;

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  const staffId =
    auth.staffId && mongoose.Types.ObjectId.isValid(auth.staffId)
      ? new mongoose.Types.ObjectId(auth.staffId)
      : null;

  if (!staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const match: Record<string, any> = {
    staff: staffId,
    status: "completed",
    taskType,
    completedDate: {
      $gte: Number.isNaN(fromDate.getTime()) ? new Date(0) : fromDate,
      $lte: Number.isNaN(toDate.getTime()) ? new Date() : toDate,
    },
  };

  const completedByDay = await Task.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $unwind: {
        path: "$customer",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        completedDay: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$completedDate",
          },
        },
      },
    },
    {
      $project: {
        completedDay: 1,
        completedDate: 1,
        customerName: "$customer.name",
        numberOfTrees: { $ifNull: ["$numberOfTrees", 0] },
      },
    },
    { $sort: { completedDate: 1, _id: 1 } },
    {
      $group: {
        _id: "$completedDay",
        tasks: {
          $push: {
            customerName: "$customerName",
            numberOfTrees: "$numberOfTrees",
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        tasks: 1,
      },
    },
  ]);

  return NextResponse.json(
    {
      from,
      to,
      days: completedByDay || [],
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
