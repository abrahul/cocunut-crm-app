import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name, mobile, address, locationId } =
      await req.json();

    if (!name || !mobile || !locationId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      name,
      mobile,
      address,
      location: locationId,
    });

    return NextResponse.json({
      message: "Customer added",
      customer,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
