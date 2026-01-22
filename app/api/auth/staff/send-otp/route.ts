import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import { generateOTP, hashOTP } from "@/lib/otp";

const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds

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

  // ⏳ RESEND COOLDOWN
  if (
    staff.otpLastSentAt &&
    Date.now() - staff.otpLastSentAt.getTime() < OTP_COOLDOWN_MS
  ) {
    const wait =
      Math.ceil(
        (OTP_COOLDOWN_MS -
          (Date.now() - staff.otpLastSentAt.getTime())) / 1000
      );

    return NextResponse.json(
      { error: `Wait ${wait}s before requesting OTP again` },
      { status: 429 }
    );
  }

  const otp = generateOTP();

  staff.otpHash = hashOTP(otp);
  staff.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  staff.otpLastSentAt = new Date();
  staff.otpAttempts = 0; // reset attempts on resend

  await staff.save();

  console.log(`OTP for ${mobile}: ${otp}`);

  return NextResponse.json({ success: true });
}
