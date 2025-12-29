import crypto from "crypto";

export function createSession(role: string, userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min

  return { token, role, userId, expiresAt };
}
