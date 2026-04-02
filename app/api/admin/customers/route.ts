import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Task from "@/models/Task";
import "@/models/Location";
import { getAuthUser } from "@/lib/authServer";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const customerFilter = includeArchived ? {} : { isArchived: { $ne: true } };

    const customers = await Customer.find(customerFilter)
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
    const lastWorkedStaff = await Task.aggregate([
      { $match: { status: "completed" } },
      { $sort: { completedDate: -1, createdAt: -1 } },
      {
        $group: {
          _id: "$customer",
          staffId: { $first: "$staff" },
          completedDate: { $first: "$completedDate" },
        },
      },
      {
        $lookup: {
          from: "staffs",
          localField: "staffId",
          foreignField: "_id",
          as: "staffDoc",
        },
      },
      { $unwind: { path: "$staffDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          staffId: 1,
          staffName: "$staffDoc.name",
          completedDate: 1,
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
    const lastWorkedMap = new Map(
      lastWorkedStaff.map((item: any) => [
        String(item._id),
        item.staffId && item.staffName
          ? { _id: String(item.staffId), name: item.staffName }
          : undefined,
      ])
    );

    const customersWithLastService = customers.map((customer: any) => {
      const lastServiceDate = lastServiceMap.get(String(customer._id));
      const lastTask = lastTaskMap.get(String(customer._id));
      const legacyServiceDate =
        customer.serviceDate ||
        (customer as { dueDate?: unknown }).dueDate ||
        undefined;
      const lastWorked = lastWorkedMap.get(String(customer._id));
      if (lastServiceDate) {
        return {
          ...customer,
          serviceDate: legacyServiceDate,
          lastDateOfService: lastServiceDate,
          lastTask,
          lastWorkedStaff: lastWorked,
        };
      }
      if (lastTask) {
        return {
          ...customer,
          serviceDate: legacyServiceDate,
          lastTask,
          lastWorkedStaff: lastWorked,
        };
      }
      return {
        ...customer,
        serviceDate: legacyServiceDate,
        lastWorkedStaff: lastWorked,
      };
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
