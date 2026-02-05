import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: Request) {
  try {
    // ✅ 1. Parse body FIRST
    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        { error: "Mobile and OTP required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ 2. Find staff
    const staff = await Staff.findOne({ mobile });

    if (!staff || !staff.otpSessionId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    if (staff.isActive === false) {
      return NextResponse.json(
        { error: "Staff is inactive" },
        { status: 403 }
      );
    }

    console.log("Verifying OTP for:", mobile);
    console.log("Session ID:", staff.otpSessionId);

    // ✅ 3. Verify OTP with 2Factor
    const res = await fetch(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/VERIFY/${staff.otpSessionId}/${otp}`
    );

    const data = await res.json();

    if (data.Status !== "Success") {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    // ✅ 4. Clear OTP session
    staff.otpSessionId = undefined;
    staff.otpAttempts = 0;
    await staff.save();

    // ✅ 5. Create JWT
    const token = jwt.sign(
      {
        staffId: staff._id,
        role: "staff",
      },
      JWT_SECRET,
      { expiresIn: "1m" }
    );

    // ✅ 6. Set cookie
    const response = NextResponse.json({ success: true });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60,
    });

    return response;

  } catch (err: any) {
    console.error("Verify OTP error:", err.message);
    return NextResponse.json(
      { error: "OTP verification failed" },
      { status: 500 }
    );
  }
}
