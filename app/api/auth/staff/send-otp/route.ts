import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Staff from "@/models/Staff";

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    if (!mobile) {
      return NextResponse.json(
        { error: "Mobile number is required" },
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

    const response = await fetch(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${mobile}/AUTOGEN`,
      { method: "GET" }
    );

    const data = await response.json();

    if (data.Status !== "Success") {
      return NextResponse.json(
        { error: "Failed to send OTP", providerError: data },
        { status: 400 }
      );
    }

    staff.otpSessionId = data.Details;
    staff.otpAttempts = 0;
    await staff.save();

    return NextResponse.json({
      success: true,
      sessionId: data.Details, // ✅ IMPORTANT
    });

  } catch (err) {
    console.error("Send OTP Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
