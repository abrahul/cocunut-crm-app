const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY!;

export async function sendOTP(mobile: string) {
  const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${mobile}/AUTOGEN`;

  const res = await fetch(url, { method: "GET" });
  const data = await res.json();

  if (data.Status !== "Success") {
    throw new Error("Failed to send OTP");
  }

  // 2Factor returns SessionId → VERY IMPORTANT
  return data.Details; // sessionId
}

export async function verifyOTP(sessionId: string, otp: string) {
  const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

  const res = await fetch(url, { method: "GET" });
  const data = await res.json();

  if (data.Status !== "Success") {
    throw new Error("Invalid OTP");
  }

  return data;
}
