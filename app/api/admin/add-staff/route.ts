import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { name, mobile } = body;

    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Name and mobile are required" },
        { status: 400 }
      );
    }

    // Ensure mobile uniqueness
    const existing = await Staff.findOne({ mobile });
    if (existing) {
      return NextResponse.json(
        { error: "Staff with this mobile already exists" },
        { status: 409 }
      );
    }

    const staff = await Staff.create({
      name,
      mobile,
    });

    return NextResponse.json({ success: true, staff });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add staff" },
      { status: 500 }
    );
  }
}
