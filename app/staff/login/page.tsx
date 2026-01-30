"use client";
import { useState } from "react";

export default function StaffLoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function sendOtp() {
    const res = await fetch("/api/auth/staff/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setOtpSent(true);
  }

  async function verifyOtp() {
    const res = await fetch("/api/auth/staff/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    // ✅ SESSION CREATED → REDIRECT
    window.location.href = "/staff/tasks";
  }

  return (
    <div>
      <input
        placeholder="Mobile number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      {!otpSent && (
        <button onClick={sendOtp}>Send OTP</button>
      )}

      {otpSent && (
        <>
          <input
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}
    </div>
  );
}
