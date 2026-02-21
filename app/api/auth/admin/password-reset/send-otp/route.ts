import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import {
  generateNumericOtp,
  hashOtp,
  PASSWORD_RESET_OTP_TTL_MS,
} from "@/lib/adminPasswordReset";
import { EmailDeliveryError, sendOtpEmail } from "@/lib/emailOtp";

const RESET_EMAIL = process.env.ADMIN_PASSWORD_RESET_EMAIL || "abrahul100@gmail.com";
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username || !String(username).trim()) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalized = String(username).trim();
    const admin = await Admin.findOne({
      username: { $regex: `^${escapeRegex(normalized)}$`, $options: "i" },
    }).select(
      "+passwordResetOtpHash passwordResetOtpLastSentAt passwordResetOtpAttempts"
    );

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const lastSentAt = admin.passwordResetOtpLastSentAt
      ? new Date(admin.passwordResetOtpLastSentAt).getTime()
      : 0;
    if (lastSentAt && Date.now() - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Please wait before requesting OTP again" },
        { status: 429 }
      );
    }

    const otp = generateNumericOtp();
    await sendOtpEmail({ to: RESET_EMAIL, otp });

    admin.passwordResetOtpHash = hashOtp(otp);
    admin.passwordResetOtpExpiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);
    admin.passwordResetOtpLastSentAt = new Date();
    admin.passwordResetOtpAttempts = 0;
    await admin.save();

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${RESET_EMAIL}`,
    });
  } catch (err: unknown) {
    if (err instanceof EmailDeliveryError) {
      return NextResponse.json({ error: err.message }, { status: err.status || 500 });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("Admin password reset send OTP error:", message);
    return NextResponse.json({ error: "Failed to send reset OTP" }, { status: 500 });
  }
}
