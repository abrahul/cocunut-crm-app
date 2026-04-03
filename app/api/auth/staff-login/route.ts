import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import jwt from "jsonwebtoken";
import { verifyPassword } from "@/lib/password";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: Request) {
  await connectDB();

  const { mobile, password } = await req.json();

  if (!mobile || !password) {
    return NextResponse.json(
      { error: "Mobile and password required" },
      { status: 400 }
    );
  }

  const staff = await Staff.findOne({ mobile }).select(
    "+passwordHash +passwordSalt"
  ).lean();
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

  if (!staff.passwordHash || !staff.passwordSalt) {
    return NextResponse.json(
      { error: "Password not set. Ask an admin to reset it." },
      { status: 400 }
    );
  }

  const isValid = verifyPassword(
    String(password),
    staff.passwordSalt,
    staff.passwordHash
  );
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = jwt.sign({ staffId: staff._id, role: "staff" }, JWT_SECRET);

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
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
