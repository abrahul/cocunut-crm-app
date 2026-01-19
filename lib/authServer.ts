import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as {
      staffId: string;
      role: "staff" | "admin";
    };
  } catch {
    return null;
  }
}

console.log("authServer loaded");
