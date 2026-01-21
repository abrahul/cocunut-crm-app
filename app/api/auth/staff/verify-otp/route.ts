import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import { hashOTP } from "@/lib/otp";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: Request) {
  await connectDB();

  const { mobile, otp } = await req.json();
  if (!mobile || !otp) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const staff = await Staff.findOne({ mobile });

 

  if (
    !staff ||
    !staff.otpHash ||
    staff.otpHash !== hashOTP(otp) ||
    !staff.otpExpiresAt ||
    staff.otpExpiresAt < new Date()
  ) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
  }
   console.log("Entered OTP:", otp);
console.log("Hashed Entered OTP:", hashOTP(otp));
console.log("Stored Hash:", staff?.otpHash);
console.log("Expires At:", staff?.otpExpiresAt);
console.log("Now:", new Date());

  // cleanup OTP
  staff.otpHash = undefined;
  staff.otpExpiresAt = undefined;
  await staff.save();

  const token = jwt.sign(
    { staffId: staff._id, role: "staff" },
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
