import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: Request) {
  await connectDB();

  const { mobile, otp } = await req.json();

  if (!mobile || !otp) {
    return NextResponse.json(
      { error: "Mobile and OTP required" },
      { status: 400 }
    );
  }

  // ✅ DEV OTP BYPASS
  if (otp !== "123456") {
    return NextResponse.json(
      { error: "Invalid OTP" },
      { status: 401 }
    );
  }

  const staff = await Staff.findOne({ mobile });
  if (!staff) {
    return NextResponse.json(
      { error: "Staff not found" },
      { status: 404 }
    );
  }

  if (staff.isActive === false) {
    return NextResponse.json(
      { error: "Staff is inactive" },
      { status: 403 }
    );
  }

  const token = jwt.sign(
    { staffId: staff._id, role: "staff" },
    JWT_SECRET,
    { expiresIn: "10m" }
  );

  const res = NextResponse.json({
    success: true,
    staff: {
      id: staff._id,
      name: staff.name,
      mobile: staff.mobile,
    },
  });

  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return res;
}
