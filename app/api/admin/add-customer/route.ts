import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
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

    const {
      name,
      mobile,
      alternateMobile,
      profession,
      latitude,
      longitude,
      address,
      email,
      remark,
      lastDateOfService,
      locationId,
    } = await req.json();

    const latNumber = Number(latitude);
    const lngNumber = Number(longitude);

    if (
      !name ||
      !mobile ||
      !locationId ||
      !address ||
      Number.isNaN(latNumber) ||
      Number.isNaN(lngNumber)
    ) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      name,
      mobile,
      alternateMobile,
      profession,
      latitude: latNumber,
      longitude: lngNumber,
      address,
      email: email?.trim() || undefined,
      remark,
      lastDateOfService: lastDateOfService
        ? new Date(lastDateOfService)
        : undefined,
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
