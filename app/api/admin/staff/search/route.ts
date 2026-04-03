import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import { getAuthUser } from "@/lib/authServer";

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

    if (!q) {
      return NextResponse.json([]);
    }

    const staff = await Staff.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      staff.map((s) => ({
        ...s,
        isActive: s.isActive ?? true,
      }))
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
