import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const ADMIN_SESSION_SECONDS = 60 * 60 * 24;

export async function POST(req: Request) {
  try {
    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        { error: "Mobile and OTP required" },
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

    if (!admin.otpSessionId) {
      return NextResponse.json(
        { error: "OTP session missing. Please resend OTP." },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/VERIFY/${admin.otpSessionId}/${otp}`
    );

    const data = await res.json();

    if (data.Status !== "Success") {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    admin.otpSessionId = undefined;
    admin.otpAttempts = 0;
    await admin.save();

    const token = jwt.sign(
      {
        staffId: admin._id,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: ADMIN_SESSION_SECONDS }
    );

    const response = NextResponse.json({ success: true });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_SECONDS,
    });

    return response;
  } catch (err: any) {
    console.error("Admin verify OTP error:", err.message);
    return NextResponse.json(
      { error: "OTP verification failed" },
      { status: 500 }
    );
  }
}

