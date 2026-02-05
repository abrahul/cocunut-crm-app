"use client";
import { useState } from "react";

export default function StaffLoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function sendOtp() {
    if (!mobile.trim()) {
      setError("Please enter your mobile number.");
      return;
    }
    setError("");
    setSending(true);
    const res = await fetch("/api/auth/staff/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error || "Unable to send OTP right now.");
      return;
    }

    setOtpSent(true);
  }

  async function verifyOtp() {
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }
    setError("");
    setVerifying(true);
    const res = await fetch("/api/auth/staff/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = await res.json();
    setVerifying(false);

    if (!res.ok) {
      setError(data.error || "OTP verification failed.");
      return;
    }

    window.location.href = "/staff/tasks";
  }

  return (
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="crm-card">
          <p className="crm-pill">Field Access</p>
          <h1 className="mt-4 text-3xl font-semibold text-[color:var(--ink)]">
            Staff login
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            We will send a one-time code to your phone.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="crm-label">Mobile number</span>
              <input
                className="crm-input mt-2"
                placeholder="e.g. 5551234567"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
              />
            </label>

            {otpSent && (
              <label className="block">
                <span className="crm-label">One-time code</span>
                <input
                  className="crm-input mt-2"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </label>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {!otpSent && (
              <button
                onClick={sendOtp}
                disabled={sending}
                className="crm-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? "Sending..." : "Send OTP"}
              </button>
            )}

            {otpSent && (
              <>
                <button
                  onClick={verifyOtp}
                  disabled={verifying}
                  className="crm-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {verifying ? "Verifying..." : "Verify and continue"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                  }}
                  className="crm-btn-outline w-full"
                >
                  Use a different number
                </button>
              </>
            )}
          </div>

          <p className="mt-6 text-xs text-[color:var(--muted)]">
            Trouble signing in? Ask an admin to confirm your staff profile is
            active.
          </p>
        </div>
      </div>
    </div>
  );
}
