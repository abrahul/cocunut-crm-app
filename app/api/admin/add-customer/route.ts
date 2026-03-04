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
      numberOfTrees,
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
    const treesProvided =
      numberOfTrees !== undefined &&
      numberOfTrees !== null &&
      String(numberOfTrees).trim() !== "";
    const treesNumber = treesProvided ? Number(numberOfTrees) : undefined;

    if (
      !name ||
      !mobile ||
      !locationId ||
      !address ||
      Number.isNaN(latNumber) ||
      Number.isNaN(lngNumber) ||
      !treesProvided
    ) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }
    if (
      treesProvided &&
      (treesNumber === undefined ||
        !Number.isFinite(treesNumber) ||
        treesNumber < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid number of trees" },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      name,
      mobile,
      alternateMobile,
      profession,
      numberOfTrees: treesProvided ? treesNumber : undefined,
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
