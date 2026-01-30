import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    if (!mobile) {
      return NextResponse.json(
        { error: "Mobile number required" },
        { status: 400 }
      );
    }

    await connectDB();

    const staff = await Staff.findOne({ mobile });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    // 📲 SEND OTP
    const res = await fetch(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${mobile}/AUTOGEN`
    );

    const data = await res.json();

    if (data.Status !== "Success") {
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 500 }
      );
    }

    // ✅ SAVE SESSION ID (CRITICAL)
    staff.otpSessionId = data.Details;
    staff.otpAttempts = 0;
    await staff.save();

    console.log("OTP session saved:", staff.otpSessionId);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Send OTP error:", err.message);
    return NextResponse.json(
      { error: "OTP send failed" },
      { status: 500 }
    );
  }
}
