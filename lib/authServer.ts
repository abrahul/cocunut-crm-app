import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function getStaffFromRequest() {
  const cookieStore = await cookies(); // ✅ AWAIT

  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as {
      staffId: string;
      role: "staff";
    };
  } catch {
    return null;
  }
}
