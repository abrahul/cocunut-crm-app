import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
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

    const staff = await Staff.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(
      staff.map((s) => ({
        ...s.toObject(),
        isActive: normalizeIsActive(s.isActive),
      }))
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
