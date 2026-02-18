import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";
import { getReportUnlock } from "@/lib/reportAuth";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reportUnlock = await getReportUnlock(auth.staffId);
    if (!reportUnlock || reportUnlock.scope !== "reports") {
      return NextResponse.json(
        { error: "Reports locked" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const staffId = searchParams.get("staffId")?.trim();
    const locationId = searchParams.get("locationId")?.trim();

    const match: Record<string, any> = {
      completedDate: { $ne: null },
    };
    const completedDateRange: Record<string, Date> = {};
    if (from) {
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(fromDate.getTime())) {
        completedDateRange.$gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(toDate.getTime())) {
        completedDateRange.$lte = toDate;
      }
    }
    if (Object.keys(completedDateRange).length > 0) {
      match.completedDate = {
        ...match.completedDate,
        ...completedDateRange,
      };
    }

    if (staffId && mongoose.Types.ObjectId.isValid(staffId)) {
      match.staff = new mongoose.Types.ObjectId(staffId);
    }

    if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
      match.location = new mongoose.Types.ObjectId(locationId);
    }

    const data = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$staff",
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          pendingTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          totalTrees: { $sum: "$numberOfTrees" },
          totalEarnings: { $sum: "$totalAmount" },
          lastCompletedDate: { $max: "$completedDate" },
        },
      },
      {
        $lookup: {
          from: "staffs",
          localField: "_id",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: "$staff" },
      {
        $project: {
          _id: 0,
          staffId: "$staff._id",
          staffName: "$staff.name",
          mobile: "$staff.mobile",
          totalTasks: 1,
          completedTasks: 1,
          pendingTasks: 1,
          totalTrees: 1,
          totalEarnings: 1,
          lastCompletedDate: 1,
        },
      },
      { $sort: { totalTasks: -1, staffName: 1 } },
    ]);

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
