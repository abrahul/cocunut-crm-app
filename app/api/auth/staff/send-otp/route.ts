import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import { generateOTP, hashOTP } from "@/lib/otp";

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const mobile = String(body.mobile).trim();

  if (!mobile) {
    return NextResponse.json(
      { error: "Mobile required" },
      { status: 400 }
    );
  }

  const staff = await Staff.findOne({ mobile });

  if (!staff) {
    return NextResponse.json(
      { error: "Staff not found" },
      { status: 404 }
    );
  }

  const otp = generateOTP();

  staff.otpHash = hashOTP(otp);
  staff.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await staff.save(); // 🔥 THIS MUST HAPPEN

  console.log("OTP SAVED FOR:", mobile);
  console.log("OTP:", otp);
  console.log("OTP HASH:", staff.otpHash);
  console.log("OTP EXPIRES:", staff.otpExpiresAt);

  return NextResponse.json({ success: true });
}
