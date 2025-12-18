import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

export async function GET() {
  try {
    await connectDB();
    const customers = await Customer.find().populate("location");
    return NextResponse.json(customers);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
