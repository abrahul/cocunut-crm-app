import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import { hashPassword, verifyPassword } from "@/lib/password";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const ADMIN_SESSION_SECONDS = 60 * 60 * 24;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedUsername = String(username).trim();
    const normalizedPassword = String(password);

    const admin = await Admin.findOne({
      $or: [
        { username: { $regex: `^${escapeRegex(normalizedUsername)}$`, $options: "i" } },
        { mobile: normalizedUsername },
      ],
    }).select("+password +passwordHash +passwordSalt");

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const hashedOk = verifyPassword(
      normalizedPassword,
      admin.passwordSalt,
      admin.passwordHash
    );

    // Backward-compatible path: allow existing plain-text admins once, then migrate to hash+salt.
    if (!hashedOk) {
      if (!admin.password || String(admin.password) !== normalizedPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const { hash, salt } = hashPassword(normalizedPassword);
      admin.passwordHash = hash;
      admin.passwordSalt = salt;
      admin.password = undefined;
      await admin.save();
    }

    const adminId = String(admin._id);
    const token = jwt.sign(
      {
        staffId: adminId,
        adminId,
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
    console.error("Admin password login error:", err?.message || err);
    return NextResponse.json(
      { error: "Password login failed" },
      { status: 500 }
    );
  }
}
