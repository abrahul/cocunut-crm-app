import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Customer from "@/models/Customer";
import mongoose from "mongoose";
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
    const body = await req.json();

    const {
      customerId,
      staffId,
      treesCount,
      rate,
      latitude,
      longitude,
      serviceDate,
      serviceTime,
      medicine,
      exactAddress,
      remark,
      allowDuplicate,
    } = body;

    const trees = Number(treesCount);
    const hasRate =
      rate !== undefined &&
      rate !== null &&
      String(rate).trim() !== "";
    const rateCandidate = Number(rate);

    if (
      !customerId ||
      !staffId ||
      !mongoose.Types.ObjectId.isValid(customerId) ||
      !mongoose.Types.ObjectId.isValid(staffId)
    ) {
      return NextResponse.json(
        { error: "Invalid customer or staff" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(trees) || trees < 0) {
      return NextResponse.json(
        { error: "Invalid trees count" },
        { status: 400 }
      );
    }

    if (
      !serviceDate ||
      typeof serviceDate !== "string" ||
      (serviceTime !== undefined &&
        serviceTime !== null &&
        typeof serviceTime !== "string")
    ) {
      return NextResponse.json(
        { error: "Service date is required" },
        { status: 400 }
      );
    }

    if (typeof medicine !== "boolean") {
      return NextResponse.json(
        { error: "Medicine selection is required" },
        { status: 400 }
      );
    }

    if (!exactAddress || typeof exactAddress !== "string") {
      return NextResponse.json(
        { error: "Exact address is required" },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(customerId)
      .select("latitude longitude lastDateOfService location")
      .populate("location", "defaultRate")
      .lean();

    if (!customer || !customer.location) {
      return NextResponse.json(
        { error: "Customer or location not found" },
        { status: 404 }
      );
    }

    if (!allowDuplicate) {
      const pendingTask = await Task.findOne({
        customer: customerId,
        status: "pending",
        taskType: "main",
      })
        .sort({ createdAt: -1 })
        .populate("staff", "name")
        .select("serviceDate staff createdAt")
        .lean();

      if (pendingTask) {
        const staffName =
          typeof (pendingTask as any)?.staff?.name === "string"
            ? (pendingTask as any).staff.name
            : undefined;
        return NextResponse.json(
          {
            error: "Pending task exists",
            pendingTask: {
              serviceDate: pendingTask.serviceDate,
              createdAt: pendingTask.createdAt,
              staffName,
            },
          },
          { status: 409 }
        );
      }
    }

    const latCandidate =
      latitude !== undefined && latitude !== null && String(latitude).trim() !== ""
        ? Number(latitude)
        : Number(customer.latitude);
    const lngCandidate =
      longitude !== undefined && longitude !== null && String(longitude).trim() !== ""
        ? Number(longitude)
        : Number(customer.longitude);

    if (
      !Number.isFinite(latCandidate) ||
      !Number.isFinite(lngCandidate)
    ) {
      return NextResponse.json(
        { error: "Valid latitude and longitude required" },
        { status: 400 }
      );
    }

    const locationDefaultRate = Number(
      (customer.location as any).defaultRate
    );

    let ratePerTree: number;
    if (hasRate) {
      if (!Number.isFinite(rateCandidate) || rateCandidate < 0) {
        return NextResponse.json(
          { error: "Invalid rate" },
          { status: 400 }
        );
      }
      ratePerTree = rateCandidate;
    } else if (Number.isFinite(locationDefaultRate)) {
      ratePerTree = locationDefaultRate;
    } else {
      return NextResponse.json(
        { error: "Rate is required" },
        { status: 400 }
      );
    }

    const task = await Task.create({
      customer: customerId,
      location: (customer.location as any)._id,
      staff: staffId,
      numberOfTrees: trees,
      ratePerTree,
      totalAmount: trees * ratePerTree,
      status: "pending",
      serviceDate,
      serviceTime,
      medicine,
      exactAddress,
      latitude: latCandidate,
      longitude: lngCandidate,
    });

    let parsedServiceDate: Date | null = null;
    if (serviceDate) {
      const candidate = new Date(serviceDate);
      if (!Number.isNaN(candidate.getTime())) {
        parsedServiceDate = candidate;
      }
    }

    const customerUpdate: Record<string, unknown> = {
      numberOfTrees: trees,
    };
    if (parsedServiceDate) {
      const existingLast = customer.lastDateOfService
        ? new Date(customer.lastDateOfService)
        : null;
      if (!existingLast || parsedServiceDate > existingLast) {
        customerUpdate.lastDateOfService = parsedServiceDate;
      }
    }
    if (typeof remark === "string" && remark.trim()) {
      customerUpdate.remark = remark.trim();
    }
    await Customer.findByIdAndUpdate(customerId, customerUpdate);

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error("TASK CREATE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Task creation failed" },
      { status: 500 }
    );
  }
}
