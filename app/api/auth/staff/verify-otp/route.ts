import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, otp } = await req.json();

    if (!sessionId || !otp) {
      return NextResponse.json(
        { error: "Session ID and OTP are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`,
      { method: "GET" }
    );

    const data = await response.json();

    if (data.Status !== "Success") {
      return NextResponse.json(
        { error: "Invalid or expired OTP", providerError: data },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Server error while verifying OTP" },
      { status: 500 }
    );
  }
}
