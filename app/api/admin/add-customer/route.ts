import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import { getAuthUser } from "@/lib/authServer";
import { normalizePhoneDigits } from "@/lib/formatPhone";

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
      serviceDate,
      dueDate,
      locationId,
    } = await req.json();

    const latNumber = Number(latitude);
    const lngNumber = Number(longitude);
    const normalizedMobile = normalizePhoneDigits(mobile);
    const normalizedAlternate = normalizePhoneDigits(alternateMobile);
    const treesProvided =
      numberOfTrees !== undefined &&
      numberOfTrees !== null &&
      String(numberOfTrees).trim() !== "";
    const treesNumber = treesProvided ? Number(numberOfTrees) : undefined;
    const serviceDateInput =
      typeof serviceDate === "string" && serviceDate.trim() !== ""
        ? serviceDate
        : typeof dueDate === "string" && dueDate.trim() !== ""
          ? dueDate
          : "";
    const hasServiceDate = Boolean(serviceDateInput);

    if (
      !name ||
      !normalizedMobile ||
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
    if (hasServiceDate) {
      const parsedService = new Date(serviceDateInput);
      if (Number.isNaN(parsedService.getTime())) {
        return NextResponse.json(
          { error: "Invalid service date" },
          { status: 400 }
        );
      }
    }

    const existing = await Customer.findOne({
      mobile: normalizedMobile,
    })
      .select("_id")
      .lean();
    if (existing) {
      return NextResponse.json(
        { error: "Customer with this mobile already exists" },
        { status: 409 }
      );
    }

    const customer = await Customer.create({
      name,
      mobile: normalizedMobile,
      alternateMobile: normalizedAlternate,
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
      serviceDate: hasServiceDate ? new Date(serviceDateInput) : undefined,
      location: locationId,
    });

    return NextResponse.json({
      message: "Customer added",
      customer,
    });
  } catch (err: any) {
    console.error(err);
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: "Customer with this mobile already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
