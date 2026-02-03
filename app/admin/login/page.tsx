"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  function startCooldown(seconds: number) {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function sendOtp() {
    setError("");

    const res = await fetch("/api/auth/admin/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }

    setOtpSent(true);
    startCooldown(60);
  }

  async function verifyOtp() {
    setError("");

    const res = await fetch("/api/auth/admin/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "OTP verification failed");
      return;
    }

    window.location.href = "/admin/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="border p-6 w-80">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>

        {error && (
          <p className="text-red-600 mb-2">{error}</p>
        )}

        <input
          placeholder="Mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        {!otpSent && (
          <button
            onClick={sendOtp}
            disabled={cooldown > 0}
            className="w-full bg-black text-white p-2 disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Send OTP"}
          </button>
        )}

        {otpSent && (
          <>
            <input
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border p-2 w-full mb-4 mt-2"
            />
            <button
              onClick={verifyOtp}
              className="w-full bg-black text-white p-2"
            >
              Verify OTP
            </button>
            <button
              onClick={sendOtp}
              disabled={cooldown > 0}
              className="w-full mt-2 text-sm text-blue-600 underline disabled:opacity-60"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
