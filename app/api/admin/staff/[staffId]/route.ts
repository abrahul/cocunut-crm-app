import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import { getAuthUser } from "@/lib/authServer";
import { hashPassword } from "@/lib/password";

function normalizeIsActive(value: unknown) {
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  return true;
}

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

  return NextResponse.json({
    ...staff.toObject(),
    isActive: normalizeIsActive(staff.isActive),
  });
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
  const { name, mobile, isActive, password } = await req.json();

  const update: {
    name?: string;
    mobile?: string;
    isActive?: boolean;
    passwordHash?: string;
    passwordSalt?: string;
  } = {};

  if (typeof isActive === "boolean") {
    update.isActive = isActive;
  } else if (
    isActive === "true" ||
    isActive === "false" ||
    isActive === 1 ||
    isActive === 0 ||
    isActive === "1" ||
    isActive === "0"
  ) {
    update.isActive = normalizeIsActive(isActive);
  }

  if (name || mobile) {
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

    update.name = name;
    update.mobile = mobile;
  }

  if (typeof password === "string" && password.trim()) {
    if (password.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    const { hash, salt } = hashPassword(password.trim());
    update.passwordHash = hash;
    update.passwordSalt = salt;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const staff = await Staff.findByIdAndUpdate(staffId, update, {
    new: true,
    runValidators: true,
  });

  if (!staff) {
    return NextResponse.json(
      { error: "Staff not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    staff: {
      ...staff.toObject(),
      isActive: normalizeIsActive(staff.isActive),
    },
  });
}

export async function DELETE(
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

  const { default: Task } = await import("@/models/Task");
  const taskCount = await Task.countDocuments({ staff: staffId });

  if (taskCount > 0) {
    return NextResponse.json(
      { error: "Staff has tasks assigned. Reassign tasks before deleting." },
      { status: 409 }
    );
  }

  const staff = await Staff.findByIdAndDelete(staffId);
  if (!staff) {
    return NextResponse.json(
      { error: "Staff not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
