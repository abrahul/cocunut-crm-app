import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import { hashOtp, isOtpExpired } from "@/lib/adminPasswordReset";

const MAX_INVALID_OTP_ATTEMPTS = 5;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: Request) {
  try {
    const { username, otp, newPassword } = await req.json();

    if (!username || !String(username).trim()) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }
    if (!otp || !String(otp).trim()) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalized = String(username).trim();
    const admin = await Admin.findOne({
      username: { $regex: `^${escapeRegex(normalized)}$`, $options: "i" },
    }).select("+passwordResetOtpHash +password");

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (!admin.passwordResetOtpHash || isOtpExpired(admin.passwordResetOtpExpiresAt)) {
      return NextResponse.json(
        { error: "OTP expired. Please request a new OTP" },
        { status: 400 }
      );
    }

    if ((admin.passwordResetOtpAttempts || 0) >= MAX_INVALID_OTP_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many invalid attempts. Please request a new OTP" },
        { status: 429 }
      );
    }

    const expectedHash = admin.passwordResetOtpHash;
    const providedHash = hashOtp(String(otp).trim());

    if (expectedHash !== providedHash) {
      admin.passwordResetOtpAttempts = (admin.passwordResetOtpAttempts || 0) + 1;
      await admin.save();
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    admin.password = String(newPassword);
    admin.passwordResetOtpHash = undefined;
    admin.passwordResetOtpExpiresAt = undefined;
    admin.passwordResetOtpAttempts = 0;
    admin.passwordResetOtpLastSentAt = undefined;
    await admin.save();

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Admin password reset confirm error:", message);
    return NextResponse.json({ error: "Password reset failed" }, { status: 500 });
  }
}
