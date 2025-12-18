import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      customerId,
      staffId,
      treesCount,
      rate,
    } = await req.json();
     
    if (!customerId || !staffId || !treesCount || !rate) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const totalAmount = treesCount * rate;

    await Task.create({
      customer: customerId,
      staff: staffId,
      treesCount,
      rate,
      totalAmount,
    });

    return NextResponse.json({
      message: "Task created",
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
