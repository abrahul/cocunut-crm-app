import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { sessionId, otp, role, userId } = await req.json();

    if (!otp) {
      return NextResponse.json(
        { error: "OTP required" },
        { status: 400 }
      );
    }

    await verifyOTP(sessionId, otp);

    const session = createSession(role, userId);

    const res = NextResponse.json({ success: true });

    res.cookies.set("authToken", session.token, {
      maxAge: 600,
      httpOnly: true,
    });

    res.cookies.set("role", role, { maxAge: 600 });
    res.cookies.set("userId", userId, { maxAge: 600 });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "OTP failed" },
      { status: 401 }
    );
  }
}
