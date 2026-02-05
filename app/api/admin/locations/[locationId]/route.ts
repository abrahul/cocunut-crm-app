import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import { getAuthUser } from "@/lib/authServer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locationId } = await params;
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return NextResponse.json(
        { error: "Invalid location id" },
        { status: 400 }
      );
    }

    const location = await Location.findById(locationId).lean();
    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json(location, { status: 200 });
  } catch (error: any) {
    console.error("LOCATION DETAIL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locationId } = await params;
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return NextResponse.json(
        { error: "Invalid location id" },
        { status: 400 }
      );
    }

    const { name, latitude, longitude, defaultRate } = await req.json();

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rate = Number(defaultRate);

    if (!name || !name.trim()) {
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

    const exists = await Location.findOne({
      name: name.trim(),
      _id: { $ne: locationId },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Location already exists" },
        { status: 409 }
      );
    }

    const updated = await Location.findByIdAndUpdate(
      locationId,
      {
        name: name.trim(),
        latitude: lat,
        longitude: lng,
        defaultRate: rate,
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, location: updated });
  } catch (error: any) {
    console.error("LOCATION UPDATE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locationId } = await params;
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return NextResponse.json(
        { error: "Invalid location id" },
        { status: 400 }
      );
    }

    const { default: Customer } = await import("@/models/Customer");
    const { default: Task } = await import("@/models/Task");

    const [customerCount, taskCount] = await Promise.all([
      Customer.countDocuments({ location: locationId }),
      Task.countDocuments({ location: locationId }),
    ]);

    if (customerCount > 0 || taskCount > 0) {
      return NextResponse.json(
        {
          error:
            "Location is in use. Reassign customers and tasks before deleting.",
        },
        { status: 409 }
      );
    }

    const deleted = await Location.findByIdAndDelete(locationId).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("LOCATION DELETE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
