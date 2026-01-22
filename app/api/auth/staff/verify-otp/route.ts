import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import { hashOTP } from "@/lib/otp";

const MAX_ATTEMPTS = 3;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        { error: "Mobile and OTP required" },
        { status: 400 }
      );
    }

    const staff = await Staff.findOne({ mobile });

    // ✅ FIRST: validate staff + otp presence
    if (!staff || !staff.otpHash || !staff.otpExpiresAt) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    // 🚫 HARD BLOCK
    if (staff.otpAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Request new OTP." },
        { status: 429 }
      );
    }

    // ⏰ EXPIRED
    if (staff.otpExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "OTP expired" },
        { status: 401 }
      );
    }

    // ❌ WRONG OTP
    if (staff.otpHash !== hashOTP(otp)) {
      const nextAttempts = staff.otpAttempts + 1;
      staff.otpAttempts = nextAttempts;
      await staff.save();

      // 🔥 THIS IS THE KEY FIX
      if (nextAttempts >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many attempts. Request new OTP." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    // ✅ SUCCESS — RESET
    staff.otpHash = undefined;
    staff.otpExpiresAt = undefined;
    staff.otpAttempts = 0;
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
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
