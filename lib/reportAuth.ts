import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/authServer";

export const REPORTS_UNLOCK_COOKIE = "reports_unlock";

export function getReportsUnlockSeconds() {
  const raw = process.env.REPORTS_UNLOCK_SECONDS;
  const parsed = raw ? Number(raw) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 60 * 15;
}

export async function getReportUnlock(adminId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(REPORTS_UNLOCK_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      adminId: string;
      role: "admin";
      scope: "reports";
    };
    if (adminId && payload.adminId !== adminId) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
