import crypto from "crypto";

const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_KEYLEN = 64;
const PASSWORD_DIGEST = "sha512";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString("hex");
  return { salt, hash };
}

export function verifyPassword(
  password: string,
  salt?: string,
  hash?: string
) {
  if (!salt || !hash) return false;
  const derived = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEYLEN, PASSWORD_DIGEST)
    .toString("hex");
  const hashBuf = Buffer.from(hash, "hex");
  const derivedBuf = Buffer.from(derived, "hex");
  if (hashBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, derivedBuf);
}
