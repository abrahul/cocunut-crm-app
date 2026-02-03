import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import "@/models/Location";
import { getAuthUser } from "@/lib/authServer";

export async function GET() {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
