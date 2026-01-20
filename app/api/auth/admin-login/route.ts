import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: Request) {
  await connectDB();

  const { mobile, password } = await req.json();

  if (!mobile || !password) {
    return NextResponse.json(
      { error: "Missing credentials" },
      { status: 400 }
    );
  }

  const admin = await Admin.findOne({ mobile });
  if (!admin || admin.password !== password) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    { adminId: admin._id, role: "admin" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const res = NextResponse.json({ success: true });

  res.cookies.set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
