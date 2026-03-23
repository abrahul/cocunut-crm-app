import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Customer from "@/models/Customer";
import { getAuthUser } from "@/lib/authServer";

// FORCE schema registration
import "@/models/Staff";
import "@/models/Customer";
import "@/models/Location";

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
    const q = searchParams.get("q")?.trim();
    const staffId = searchParams.get("staffId")?.trim();
    const locationId = searchParams.get("locationId")?.trim();
    const status = searchParams.get("status")?.trim();
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();

    const pageParam = Number(searchParams.get("page") || 1);
    const pageSizeParam = Number(searchParams.get("pageSize") || 25);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const pageSizeRaw =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : 25;
    const pageSize = Math.min(pageSizeRaw, 100);

    const taskFilter: Record<string, any> = {
      taskType: "main",
    };

    if (q) {
      const customers = await Customer.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { mobile: { $regex: q, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();
      const ids = customers.map((c: any) => c._id);
      if (ids.length === 0) {
        return NextResponse.json({
          tasks: [],
          total: 0,
          page,
          pageSize,
        });
      }
      taskFilter.customer = { $in: ids };
    }

    if (staffId && staffId !== "all") taskFilter.staff = staffId;
    if (locationId && locationId !== "all") taskFilter.location = locationId;
    if (status && status !== "all") taskFilter.status = status;
    if (from || to) {
      const serviceDateRange: Record<string, string> = {};
      if (from) serviceDateRange.$gte = from;
      if (to) serviceDateRange.$lte = to;
      taskFilter.serviceDate = serviceDateRange;
    }

    const [tasks, total] = await Promise.all([
      Task.find(taskFilter)
        .populate("customer", "name mobile")
        .populate("location", "name")
        .populate("staff", "name phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Task.countDocuments(taskFilter),
    ]);

    return NextResponse.json({
      tasks,
      total,
      page,
      pageSize,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
