import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";

export const dynamic = "force-dynamic";

function normalizeIsActive(value: unknown) {
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  return true;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    let filter = {};

    if (q) {
      filter = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { mobile: { $regex: q, $options: "i" } },
        ],
      };
    }

    const staff = await Staff.find(filter)
      .select("name mobile isActive")
      .sort({ createdAt: -1 })
      .lean();
    const staffIds = staff.map((s: any) => s._id);
    const lastCompleted = staffIds.length
      ? await Task.aggregate([
          {
            $match: {
              staff: { $in: staffIds },
              status: "completed",
              completedDate: { $ne: null },
            },
          },
          {
            $group: {
              _id: "$staff",
              lastCompletedDate: { $max: "$completedDate" },
            },
          },
        ])
      : [];
    const lastCompletedMap = new Map(
      lastCompleted.map((row) => [String(row._id), row.lastCompletedDate])
    );

    return NextResponse.json(
      staff.map((s) => ({
        ...s,
        isActive: normalizeIsActive(s.isActive),
        lastCompletedDate: lastCompletedMap.get(String(s._id)) || null,
      }))
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
