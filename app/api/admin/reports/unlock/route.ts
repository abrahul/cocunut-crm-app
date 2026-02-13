import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getAuthUser, getJwtSecret } from "@/lib/authServer";
import {
  getReportUnlock,
  getReportsUnlockSeconds,
  REPORTS_UNLOCK_COOKIE,
} from "@/lib/reportAuth";

const REPORTS_PASSWORD = process.env.REPORTS_PASSWORD;

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reportUnlock = await getReportUnlock(auth.adminId);
  return NextResponse.json({ unlocked: !!reportUnlock });
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!REPORTS_PASSWORD) {
      return NextResponse.json(
        { error: "Reports password not configured" },
        { status: 500 }
      );
    }

    const { password } = await req.json();
    if (!password || password !== REPORTS_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid reports password" },
        { status: 403 }
      );
    }

    const maxAge = getReportsUnlockSeconds();
    const token = jwt.sign(
      {
        adminId: auth.adminId,
        role: "admin",
        scope: "reports",
      },
      getJwtSecret(),
      { expiresIn: maxAge }
    );

    const response = NextResponse.json({ success: true, expiresIn: maxAge });
    response.cookies.set(REPORTS_UNLOCK_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Report unlock failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const auth = await getAuthUser();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(REPORTS_UNLOCK_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
