export async function sendOTP(phone: string) {
  // DEV MODE: skip real OTP sending
  if (process.env.NODE_ENV === "development") {
    console.log("⚠️ DEV MODE: OTP send bypassed for", phone);
    return "DEV_SESSION_ID";
  }

  const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${phone}/AUTOGEN`;

  const res = await fetch(url);
  const data = await res.json();

  console.log("2FACTOR SEND RESPONSE:", data);

  if (data.Status !== "Success") {
    throw new Error(data.Details || "OTP send failed");
  }

  return data.Details; // sessionId
}

export async function verifyOTP(sessionId: string, otp: string) {
  // DEV OTP BYPASS
  if (process.env.NODE_ENV === "development" && otp === "123456") {
    console.log("⚠️ DEV OTP BYPASS USED");
    return true;
  }

  const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

  const res = await fetch(url);
  const data = await res.json();

  console.log("2FACTOR VERIFY RESPONSE:", data);

  if (data.Status !== "Success") {
    throw new Error(data.Details || "OTP verification failed");
  }

  return true;
}
