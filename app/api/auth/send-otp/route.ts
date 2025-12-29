import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const sessionId = await sendOTP(phone);

    return NextResponse.json({ sessionId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
