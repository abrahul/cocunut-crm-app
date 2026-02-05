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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-amber-100 bg-white/90 shadow-xl shadow-amber-100/40 backdrop-blur px-6 py-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/70">
              Coconut CRM
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Staff login
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              We will send a one-time code to your phone.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Mobile number
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                placeholder="e.g. 5551234567"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
              />
            </label>

            {otpSent && (
              <label className="block text-sm font-medium text-slate-700">
                One-time code
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
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
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {!otpSent && (
              <button
                onClick={sendOtp}
                disabled={sending}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? "Sending..." : "Send OTP"}
              </button>
            )}

            {otpSent && (
              <>
                <button
                  onClick={verifyOtp}
                  disabled={verifying}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
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
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Use a different number
                </button>
              </>
            )}
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Trouble signing in? Ask an admin to confirm your staff profile is
            active.
          </p>
        </div>
      </div>
    </div>
  );
}
