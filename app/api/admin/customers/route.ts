import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import "@/models/Location"; // 👈 THIS LINE IS THE FIX

export async function GET() {
  try {
    await connectDB();

    const customers = await Customer.find()
      .populate("location")
      .lean();

    return NextResponse.json(customers, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER API ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
