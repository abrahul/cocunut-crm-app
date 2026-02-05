import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      staffId?: string;
      adminId?: string;
      role: "staff" | "admin";
      iat?: number;
      exp?: number;
    };

    const { iat, exp, ...claims } = payload;

    const newToken = jwt.sign(claims, JWT_SECRET, { expiresIn: "1m" });
    const res = NextResponse.json({ success: true });

    res.cookies.set("auth_token", newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
