import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import AdminSession from "@/models/AdminSession";
import { getJwtSecret } from "@/lib/authServer";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    try {
      const payload = jwt.verify(token, getJwtSecret()) as {
        role?: "staff" | "admin";
        sessionId?: string;
      };

      if (payload.role === "admin" && payload.sessionId) {
        const body = await req
          .json()
          .catch(() => ({} as { reason?: "manual" | "timeout" }));
        const reason = body?.reason === "timeout" ? "timeout" : "manual";

        await connectDB();
        await AdminSession.updateOne(
          { _id: payload.sessionId, logoutAt: null },
          { $set: { logoutAt: new Date(), logoutReason: reason } }
        );
      }
    } catch {}
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("auth_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return res;
}
