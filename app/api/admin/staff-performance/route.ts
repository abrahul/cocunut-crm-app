import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import "@/models/Staff";

export async function GET() {
  try {
    await connectDB();

    const data = await Task.aggregate([
      { $match: { status: "completed" } },

      {
        $group: {
          _id: "$staff",
          totalTasks: { $sum: 1 },
          totalTrees: { $sum: "$numberOfTrees" },
          totalEarnings: { $sum: "$totalAmount" },
          lastTaskDate: { $max: "$updatedAt" },
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
          phone: "$staff.phone",
          totalTasks: 1,
          totalTrees: 1,
          totalEarnings: 1,
          lastTaskDate: 1,
        },
      },
    ]);

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
