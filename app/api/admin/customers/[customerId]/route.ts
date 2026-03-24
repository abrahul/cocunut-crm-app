import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Task from "@/models/Task";
import "@/models/Location";
import { getAuthUser } from "@/lib/authServer";
import mongoose from "mongoose";

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
      .populate("location")
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

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...customer,
        lastDateOfService: lastServiceDate || customer?.lastDateOfService,
        lastTask: lastTask
          ? {
              numberOfTrees: lastTask.numberOfTrees,
              ratePerTree: lastTask.ratePerTree,
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

    const updateDoc: Record<string, any> = {
      name,
      mobile,
      alternateMobile,
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

    const updated = await Customer.findByIdAndUpdate(
      customerId,
      updateDoc,
      { new: true }
    )
      .populate("location")
      .lean();

    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER UPDATE ERROR:", error);

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
