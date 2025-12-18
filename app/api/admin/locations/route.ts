import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";

export async function GET() {
  try {
    await connectDB();
    const locations = await Location.find().sort({ name: 1 });
    return NextResponse.json(locations);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
