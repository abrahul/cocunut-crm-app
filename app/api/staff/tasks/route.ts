import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { getAuthUser } from "@/lib/authServer";
import "@/models/Customer";
import "@/models/Location";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await connectDB();

  const auth = await getAuthUser(); // ✅ await
  if (!auth || auth.role !== "staff") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const tasks = await Task.find({
    staff: auth.staffId,
    status: { $ne: "completed" },
    staffHidden: { $ne: true },
    taskType: "main",
  })
    .select(
      "customer location exactAddress latitude longitude numberOfTrees ratePerTree totalAmount status"
    )
    .populate(
      "customer",
      "name mobile alternateMobile address latitude longitude"
    )
    .populate("location", "name")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(
    tasks.map((t) => ({
      _id: t._id,
      customerName: t.customer.name,
      customerMobile: t.customer.mobile || "",
      customerAlternateMobile: t.customer.alternateMobile || "",
      address: t.exactAddress || t.customer.address || "",
      latitude:
        typeof t.latitude === "number" ? t.latitude : t.customer.latitude ?? null,
      longitude:
        typeof t.longitude === "number"
          ? t.longitude
          : t.customer.longitude ?? null,
      location: t.location.name,
      numberOfTrees: t.numberOfTrees,
      ratePerTree: t.ratePerTree,
      totalAmount: t.totalAmount,
      status: t.status,
    })),
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
