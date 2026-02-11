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
    return jwt.verify(token, getJwtSecret()) as {
      staffId: string;
      role: "staff" | "admin";
    };
  } catch {
    return null;
  }
}
