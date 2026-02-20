"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordLoginLoading, setPasswordLoginLoading] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
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
    const sessionName = window.prompt("Enter session name");
    if (!sessionName || !sessionName.trim()) {
      setError("Session name is required");
      return;
    }

    const res = await fetch("/api/auth/admin/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp, sessionName: sessionName.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "OTP verification failed");
      return;
    }

    try {
      localStorage.setItem("adminLastActivityAt", Date.now().toString());
    } catch {}

    window.location.href = "/admin/";
  }

  async function loginWithoutOtp() {
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    setPasswordLoginLoading(true);

    try {
      const sessionName = window.prompt("Enter session name");
      if (!sessionName || !sessionName.trim()) {
        setError("Session name is required");
        return;
      }

      const res = await fetch("/api/auth/admin/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          sessionName: sessionName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      try {
        localStorage.setItem("adminLastActivityAt", Date.now().toString());
      } catch {}

      window.location.href = "/admin/";
    } finally {
      setPasswordLoginLoading(false);
    }
  }

  async function sendPasswordResetOtp() {
    setError("");
    if (!resetIdentifier.trim()) {
      setError("Enter username or mobile for password reset");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/admin/password-reset/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: resetIdentifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send reset OTP");
        return;
      }
      setResetOtpSent(true);
    } finally {
      setResetLoading(false);
    }
  }

  async function confirmPasswordReset() {
    setError("");
    if (!resetIdentifier.trim() || !resetOtp.trim() || !newPassword.trim()) {
      setError("Username/mobile, OTP and new password are required");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/admin/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: resetIdentifier.trim(),
          otp: resetOtp.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed");
        return;
      }

      setResetOtp("");
      setNewPassword("");
      setResetOtpSent(false);
    } finally {
      setResetLoading(false);
    }
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
              <span className="crm-label crm-label-required">Mobile number</span>
              <input
                placeholder="Enter mobile"
                value={mobile}
                required
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
                  <span className="crm-label crm-label-required">OTP</span>
                  <input
                    placeholder="Enter OTP"
                    value={otp}
                    required
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

          <div className="my-7 h-px w-full bg-[color:var(--border)]" />

          <div className="space-y-4">
            <p className="text-sm font-semibold text-[color:var(--ink)]">
              Login without OTP
            </p>

            <label className="block">
              <span className="crm-label crm-label-required">Username</span>
              <input
                placeholder="Enter username"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
                className="crm-input mt-2"
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="crm-label crm-label-required">Password</span>
              <input
                placeholder="Enter password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="crm-input mt-2"
                type="password"
                autoComplete="current-password"
              />
            </label>

            <button
              onClick={loginWithoutOtp}
              disabled={passwordLoginLoading}
              className="crm-btn-outline w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {passwordLoginLoading ? "Signing in..." : "Login without OTP"}
            </button>
          </div>

          <div className="my-7 h-px w-full bg-[color:var(--border)]" />

          <div className="space-y-4">
            <p className="text-sm font-semibold text-[color:var(--ink)]">
              Forgot password (Email OTP)
            </p>

            <label className="block">
              <span className="crm-label crm-label-required">Username or mobile</span>
              <input
                placeholder="Enter username or mobile"
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                className="crm-input mt-2"
              />
            </label>

            {!resetOtpSent && (
              <button
                onClick={sendPasswordResetOtp}
                disabled={resetLoading}
                className="crm-btn-outline w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {resetLoading ? "Sending OTP..." : "Send reset OTP"}
              </button>
            )}

            {resetOtpSent && (
              <>
                <label className="block">
                  <span className="crm-label crm-label-required">OTP</span>
                  <input
                    placeholder="Enter OTP"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="crm-input mt-2"
                  />
                </label>

                <label className="block">
                  <span className="crm-label crm-label-required">New password</span>
                  <input
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="crm-input mt-2"
                    type="password"
                  />
                </label>

                <button
                  onClick={confirmPasswordReset}
                  disabled={resetLoading}
                  className="crm-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {resetLoading ? "Resetting..." : "Reset password"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
