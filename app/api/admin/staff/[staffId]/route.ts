import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import { getAuthUser } from "@/lib/authServer";

export async function GET(
  req: Request,
  context: { params: Promise<{ staffId: string }> }
) {
  await connectDB();
  const auth = await getAuthUser();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { staffId } = await context.params;

  if (!staffId) {
    return NextResponse.json(
      { error: "Staff ID missing" },
      { status: 400 }
    );
  }

  const staff = await Staff.findById(staffId);

  if (!staff) {
    return NextResponse.json(
      { error: "Staff not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(staff);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ staffId: string }> }
) {
  await connectDB();
  const auth = await getAuthUser();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { staffId } = await context.params;
  const { name, mobile } = await req.json();

  if (!name || !mobile) {
    return NextResponse.json(
      { error: "Name and mobile are required" },
      { status: 400 }
    );
  }

  const exists = await Staff.findOne({
    mobile,
    _id: { $ne: staffId },
  });

  if (exists) {
    return NextResponse.json(
      { error: "Mobile already exists" },
      { status: 409 }
    );
  }

  const staff = await Staff.findByIdAndUpdate(
    staffId,
    { name, mobile },
    { new: true }
  );

  if (!staff) {
    return NextResponse.json(
      { error: "Staff not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
