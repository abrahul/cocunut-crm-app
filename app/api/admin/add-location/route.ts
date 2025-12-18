import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Location name required" },
        { status: 400 }
      );
    }

    const exists = await Location.findOne({ name });
    if (exists) {
      return NextResponse.json(
        { error: "Location already exists" },
        { status: 409 }
      );
    }

    await Location.create({ name });

    return NextResponse.json({ message: "Location added" });
  } catch (err: any) {
    console.error("ADD LOCATION ERROR:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
