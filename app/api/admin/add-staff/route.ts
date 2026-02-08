import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import { getAuthUser } from "@/lib/authServer";
import { hashPassword } from "@/lib/password";

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

    const { name, mobile, isActive, password } = body;

    if (!name || !mobile || !password) {
      return NextResponse.json(
        { error: "Name, mobile, and password are required" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Ensure mobile uniqueness
    const existing = await Staff.findOne({ mobile });
    if (existing) {
      return NextResponse.json(
        { error: "Staff with this mobile already exists" },
        { status: 409 }
      );
    }

    const { hash, salt } = hashPassword(String(password));
    const staff = await Staff.create({
      name,
      mobile,
      isActive: typeof isActive === "boolean" ? isActive : true,
      passwordHash: hash,
      passwordSalt: salt,
    });

    return NextResponse.json({ success: true, staff });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add staff" },
      { status: 500 }
    );
  }
}
