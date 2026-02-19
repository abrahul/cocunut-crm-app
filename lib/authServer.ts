import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

export function getJwtSecret() {
  if (JWT_SECRET) return JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not set");
  }
  return "dev_secret";
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      staffId?: string;
      adminId?: string;
      sessionId?: string;
      role: "staff" | "admin";
    };

    const staffId = payload.staffId ?? payload.adminId;
    if (!staffId) return null;

    return {
      staffId,
      sessionId: payload.sessionId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
