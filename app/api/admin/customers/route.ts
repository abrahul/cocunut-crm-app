import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Task from "@/models/Task";
import "@/models/Location";
import { getAuthUser } from "@/lib/authServer";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const customers = await Customer.find()
      .populate("location")
      .lean();

    const lastServiceDates = await Task.aggregate([
      { $match: { serviceDate: { $type: "string", $ne: "" } } },
      {
        $addFields: {
          serviceDateAsDate: {
            $dateFromString: {
              dateString: "$serviceDate", 
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $group: {
          _id: "$customer",
          lastServiceDate: { $max: "$serviceDateAsDate" },
        },
      },
    ]);
    const lastTasks = await Task.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$customer",
          numberOfTrees: { $first: "$numberOfTrees" },
          ratePerTree: { $first: "$ratePerTree" },
        },
      },
    ]);

    const lastServiceMap = new Map(
      lastServiceDates.map((item: any) => [
        String(item._id),
        item.lastServiceDate,
      ])
    );
    const lastTaskMap = new Map(
      lastTasks.map((item: any) => [
        String(item._id),
        {
          numberOfTrees: item.numberOfTrees,
          ratePerTree: item.ratePerTree,
        },
      ])
    );

    const customersWithLastService = customers.map((customer: any) => {
      const lastServiceDate = lastServiceMap.get(String(customer._id));
      const lastTask = lastTaskMap.get(String(customer._id));
      if (lastServiceDate) {
        return {
          ...customer,
          lastDateOfService: lastServiceDate,
          lastTask,
        };
      }
      if (lastTask) {
        return {
          ...customer,
          lastTask,
        };
      }
      return customer;
    });

    return NextResponse.json(customersWithLastService, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER API ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { customerId, remark } = await req.json();

    if (
      !customerId ||
      typeof remark !== "string" ||
      !mongoose.Types.ObjectId.isValid(customerId)
    ) {
      return NextResponse.json(
        { error: "Customer and remark are required" },
        { status: 400 }
      );
    }

    const updated = await Customer.findByIdAndUpdate(
      customerId,
      { remark },
      { new: true }
    )
      .populate("location")
      .lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("CUSTOMER UPDATE ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
