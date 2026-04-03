import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Task from "@/models/Task";
import "@/models/Location";
import { getAuthUser } from "@/lib/authServer";
import mongoose from "mongoose";
import { normalizePhoneDigits } from "@/lib/formatPhone";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer id" },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(customerId)
      .select(
        "name mobile alternateMobile profession numberOfTrees latitude longitude address email remark lastDateOfService serviceDate dueDate location isArchived"
      )
      .populate("location", "name defaultRate")
      .lean();

    const lastService = await Task.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
          serviceDate: { $type: "string", $ne: "" },
        },
      },
      {
        $addFields: {
          serviceDateAsDate: {
            $dateFromString: { dateString: "$serviceDate" },
          },
        },
      },
      { $sort: { serviceDateAsDate: -1 } },
      { $limit: 1 },
    ]);

    const lastServiceDate = lastService?.[0]?.serviceDateAsDate;
    const lastTask = await Task.findOne({
      customer: new mongoose.Types.ObjectId(customerId),
    })
      .sort({ createdAt: -1 })
      .select("numberOfTrees ratePerTree")
      .lean();

    const lastWorkedTask = await Task.findOne({
      customer: new mongoose.Types.ObjectId(customerId),
      status: "completed",
    })
      .sort({ completedDate: -1, createdAt: -1 })
      .populate("staff", "name")
      .select("staff completedDate")
      .lean();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const legacyServiceDate =
      customer.serviceDate ||
      (customer as { dueDate?: unknown }).dueDate ||
      undefined;

    return NextResponse.json(
      {
        ...customer,
        serviceDate: legacyServiceDate,
        lastDateOfService: lastServiceDate || customer?.lastDateOfService,
        lastTask: lastTask
          ? {
              numberOfTrees: lastTask.numberOfTrees,
              ratePerTree: lastTask.ratePerTree,
            }
          : undefined,
        lastWorkedStaff:
          (lastWorkedTask as any)?.staff?._id &&
          (lastWorkedTask as any)?.staff?.name
            ? {
                _id: String((lastWorkedTask as any).staff._id),
                name: (lastWorkedTask as any).staff.name,
              }
            : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("CUSTOMER DETAIL ERROR:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer id" },
        { status: 400 }
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

    if (
      !name ||
      !normalizedMobile ||
      !address ||
      !locationId ||
      Number.isNaN(latNumber) ||
      Number.isNaN(lngNumber) ||
      !mongoose.Types.ObjectId.isValid(locationId)
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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

    const hasLastDate =
      typeof lastDateOfService === "string" &&
      lastDateOfService.trim() !== "";
    const serviceDateInput =
      typeof serviceDate === "string" && serviceDate.trim() !== ""
        ? serviceDate
        : typeof dueDate === "string" && dueDate.trim() !== ""
          ? dueDate
          : "";
    const hasServiceDate = Boolean(serviceDateInput);
    const shouldClearServiceDate =
      typeof serviceDate === "string" && !serviceDate.trim();

    let parsedLastDate: Date | undefined;
    if (hasLastDate) {
      parsedLastDate = new Date(lastDateOfService);
      if (Number.isNaN(parsedLastDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid last service date" },
          { status: 400 }
        );
      }
    }
    let parsedServiceDate: Date | undefined;
    if (hasServiceDate) {
      parsedServiceDate = new Date(serviceDateInput);
      if (Number.isNaN(parsedServiceDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid service date" },
          { status: 400 }
        );
      }
    }

    const existing = await Customer.findOne({
      mobile: normalizedMobile,
      _id: { $ne: customerId },
    })
      .select("_id")
      .lean();
    if (existing) {
      return NextResponse.json(
        { error: "Customer with this mobile already exists" },
        { status: 409 }
      );
    }

    const updateDoc: Record<string, any> = {
      name,
      mobile: normalizedMobile,
      alternateMobile: normalizedAlternate,
      profession,
      numberOfTrees: treesProvided ? treesNumber : undefined,
      latitude: latNumber,
      longitude: lngNumber,
      address,
      email,
      remark,
      location: locationId,
    };

    if (hasLastDate) {
      updateDoc.lastDateOfService = parsedLastDate;
    }
    if (hasServiceDate) {
      updateDoc.serviceDate = parsedServiceDate;
    } else if (shouldClearServiceDate) {
      updateDoc.$unset = { serviceDate: "" };
    }

    const updated = await Customer.findByIdAndUpdate(
      customerId,
      updateDoc,
      { new: true }
    )
      .select(
        "name mobile alternateMobile profession numberOfTrees latitude longitude address email remark lastDateOfService serviceDate dueDate location isArchived"
      )
      .populate("location", "name defaultRate")
      .lean();

    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER UPDATE ERROR:", error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "Customer with this mobile already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer id" },
        { status: 400 }
      );
    }

    const taskCount = await Task.countDocuments({
      customer: new mongoose.Types.ObjectId(customerId),
    });
    if (taskCount > 0) {
      return NextResponse.json(
        {
          error:
            "Customer has tasks assigned. Please reassign or archive instead.",
        },
        { status: 400 }
      );
    }

    const deleted = await Customer.findByIdAndDelete(customerId).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER DELETE ERROR:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
