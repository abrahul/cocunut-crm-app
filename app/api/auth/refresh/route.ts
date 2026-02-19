import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/authServer";
import { connectDB } from "@/lib/db";
import AdminSession from "@/models/AdminSession";
const STAFF_SESSION_SECONDS = 10 * 60;
const ADMIN_SESSION_SECONDS = 10 * 60;

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      staffId?: string;
      adminId?: string;
      sessionId?: string;
      role: "staff" | "admin";
      iat?: number;
      exp?: number;
    };

    const { iat, exp, ...claims } = payload;

    const sessionSeconds = payload.role === "admin" ? ADMIN_SESSION_SECONDS : STAFF_SESSION_SECONDS;

    const newToken = jwt.sign(claims, getJwtSecret(), { expiresIn: sessionSeconds });
    const res = NextResponse.json({ success: true });

    if (payload.role === "admin" && payload.sessionId) {
      await connectDB();
      await AdminSession.updateOne(
        { _id: payload.sessionId, logoutAt: null },
        { $set: { lastActivityAt: new Date() } }
      );
    }

    res.cookies.set("auth_token", newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionSeconds,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}


