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
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const locationId = searchParams.get("locationId")?.trim();
    const serviceDate = searchParams.get("serviceDate")?.trim();
    const sortParam = searchParams.get("sort")?.trim() || "date-desc";

    const hasPagination =
      searchParams.has("page") || searchParams.has("pageSize");
    const pageParam = Number(searchParams.get("page") || 1);
    const pageSizeParam = Number(searchParams.get("pageSize") || 25);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const pageSizeRaw =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : 25;
    const pageSize = Math.min(pageSizeRaw, 100);

    const customerFilter: Record<string, any> = includeArchived
      ? {}
      : { isArchived: { $ne: true } };

    if (status === "archived") {
      customerFilter.isArchived = true;
    } else if (status === "active") {
      customerFilter.isArchived = { $ne: true };
    }

    if (q) {
      customerFilter.$or = [
        { name: { $regex: q, $options: "i" } },
        { mobile: { $regex: q, $options: "i" } },
        { alternateMobile: { $regex: q, $options: "i" } },
      ];
    }

    if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
      customerFilter.location = new mongoose.Types.ObjectId(locationId);
    }

    if (serviceDate) {
      const start = new Date(`${serviceDate}T00:00:00.000Z`);
      const end = new Date(`${serviceDate}T23:59:59.999Z`);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        customerFilter.serviceDate = { $gte: start, $lte: end };
      }
    }

    const sort: Record<string, 1 | -1> = {};
    if (sortParam.startsWith("name")) {
      sort.name = sortParam === "name-asc" ? 1 : -1;
    } else {
      sort.createdAt = sortParam === "date-asc" ? 1 : -1;
    }

    const baseQuery = Customer.find(customerFilter)
      .select(
        "name mobile alternateMobile profession numberOfTrees latitude longitude address email remark lastDateOfService serviceDate dueDate location isArchived createdAt"
      )
      .populate("location", "name defaultRate");

    const [customers, total] = hasPagination
      ? await Promise.all([
          baseQuery
            .sort(sort)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
          Customer.countDocuments(customerFilter),
        ])
      : [
          await baseQuery.sort(sort).lean(),
          0,
        ];

    const customerIds = customers.map((customer: any) => customer._id);

    const lastServiceDates = customerIds.length
      ? await Task.aggregate([
          {
            $match: {
              customer: { $in: customerIds },
              serviceDate: { $type: "string", $ne: "" },
            },
          },
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
        ])
      : [];
    const lastTasks = customerIds.length
      ? await Task.aggregate([
          { $match: { customer: { $in: customerIds } } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$customer",
              numberOfTrees: { $first: "$numberOfTrees" },
              ratePerTree: { $first: "$ratePerTree" },
            },
          },
        ])
      : [];
    const lastWorkedStaff = customerIds.length
      ? await Task.aggregate([
          { $match: { customer: { $in: customerIds }, status: "completed" } },
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
        ])
      : [];

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

    if (!hasPagination) {
      return NextResponse.json(customersWithLastService, { status: 200 });
    }

    return NextResponse.json(
      {
        customers: customersWithLastService,
        total,
        page,
        pageSize,
      },
      { status: 200 }
    );
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
      .select(
        "name mobile alternateMobile profession numberOfTrees latitude longitude address email remark lastDateOfService serviceDate dueDate location isArchived"
      )
      .populate("location", "name defaultRate")
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
