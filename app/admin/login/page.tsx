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
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="crm-card">
          <p className="crm-pill">Secure Access</p>
          <h1 className="mt-4 text-3xl font-semibold text-[color:var(--ink)]">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Enter your mobile number to receive a one-time password.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="crm-label">Mobile number</span>
              <input
                placeholder="Enter mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="crm-input mt-2"
              />
            </label>

            {!otpSent && (
              <button
                onClick={sendOtp}
                disabled={cooldown > 0}
                className="crm-btn-primary w-full disabled:opacity-60"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Send OTP"}
              </button>
            )}

            {otpSent && (
              <>
                <label className="block">
                  <span className="crm-label">OTP</span>
                  <input
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="crm-input mt-2"
                  />
                </label>
                <button
                  onClick={verifyOtp}
                  className="crm-btn-primary w-full"
                >
                  Verify OTP
                </button>
                <button
                  onClick={sendOtp}
                  disabled={cooldown > 0}
                  className="crm-btn-ghost w-full text-sm disabled:opacity-60"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
