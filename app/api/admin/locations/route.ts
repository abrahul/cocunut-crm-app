import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
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
    const locations = await Location.find().sort({ name: 1 });
    return NextResponse.json(locations);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
