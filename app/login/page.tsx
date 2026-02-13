"use client";
import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");

  async function send() {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSessionId(data.sessionId);
  }

  async function verify() {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      otp,
      role: "admin",
      userId: "TEMP_ADMIN_ID",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "OTP failed");
    return;
  }

  alert("Login successful");
  window.location.href = "/admin/tasks";
}


  return (
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="crm-card">
          <p className="crm-pill">Legacy Access</p>
          <h1 className="mt-4 text-3xl font-semibold text-[color:var(--ink)]">
            Login
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Request a one-time code to continue.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="crm-label crm-label-required">Phone</span>
              <input
                placeholder="Phone"
                required
                onChange={(e) => setPhone(e.target.value)}
                className="crm-input mt-2"
              />
            </label>

            <button onClick={send} className="crm-btn-primary w-full">
              Send OTP
            </button>

            {sessionId && (
              <>
                <label className="block">
                  <span className="crm-label crm-label-required">OTP</span>
                  <input
                    placeholder="OTP"
                    required
                    onChange={(e) => setOtp(e.target.value)}
                    className="crm-input mt-2"
                  />
                </label>
                <button onClick={verify} className="crm-btn-outline w-full">
                  Verify
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
