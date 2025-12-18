import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";

export async function GET() {
  try {
    await connectDB();
    const staff = await Staff.find({ isActive: true });
    return NextResponse.json(staff);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
