import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import { getAuthUser } from "@/lib/authServer";

export async function POST(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, latitude, longitude, defaultRate } = await req.json();

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rate = Number(defaultRate);

    if (!name) {
      return NextResponse.json(
        { error: "Location name required" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { error: "Valid latitude and longitude required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rate) || rate < 0) {
      return NextResponse.json(
        { error: "Valid default rate required" },
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

    await Location.create({
      name,
      latitude: lat,
      longitude: lng,
      defaultRate: rate,
    });

    return NextResponse.json({ message: "Location added" });
  } catch (err: any) {
    console.error("ADD LOCATION ERROR:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
