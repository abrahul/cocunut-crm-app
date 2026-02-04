import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";

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

    const admin = await Admin.findOne({ mobile });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

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

    if (!data.Details) {
      return NextResponse.json(
        { error: "OTP session not created. Please try again." },
        { status: 500 }
      );
    }

    admin.otpSessionId = data.Details;
    admin.otpAttempts = 0;
    admin.otpLastSentAt = new Date();
    await admin.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin send OTP error:", err.message);
    return NextResponse.json(
      { error: "OTP send failed" },
      { status: 500 }
    );
  }
}
