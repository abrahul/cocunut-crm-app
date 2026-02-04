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

    console.log("TASK BODY RECEIVED:", body);

    const {
      customerId,
      staffId,
      treesCount,
      rate,
      serviceDate,
      serviceTime,
      medicine,
      exactAddress,
      remark,
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
      !serviceTime ||
      typeof serviceDate !== "string" ||
      typeof serviceTime !== "string"
    ) {
      return NextResponse.json(
        { error: "Service date and time are required" },
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

    const customer = await Customer.findById(customerId).populate("location");

    if (!customer || !customer.location) {
      return NextResponse.json(
        { error: "Customer or location not found" },
        { status: 404 }
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
      location: customer.location._id,
      staff: staffId,
      numberOfTrees: trees,
      ratePerTree,
      totalAmount: trees * ratePerTree,
      status: "pending",
      serviceDate,
      serviceTime,
      medicine,
      exactAddress,
    });

    if (typeof remark === "string" && remark.trim()) {
      await Customer.findByIdAndUpdate(customerId, {
        remark: remark.trim(),
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error("TASK CREATE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Task creation failed" },
      { status: 500 }
    );
  }
}
