import crypto from "crypto";

const OTP_LENGTH = 6;

export const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;

export function generateNumericOtp() {
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
}

export function hashOtp(otp: string) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return crypto.createHash("sha256").update(`${otp}:${secret}`).digest("hex");
}

export function isOtpExpired(expiresAt?: Date | null) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}
