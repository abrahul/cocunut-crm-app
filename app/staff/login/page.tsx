"use client";
import { useState } from "react";

export default function StaffLoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [error, setError] = useState("");

  async function sendOTP() {
    setError("");
    const res = await fetch("/api/auth/staff/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    if (!res.ok) {
      setError("Failed to send OTP");
      return;
    }

    setStep("otp");
  }

  async function verifyOTP() {
    setError("");
    const res = await fetch("/api/auth/staff/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    });

    if (!res.ok) {
      setError("Invalid OTP");
      return;
    }

    window.location.href = "/staff/tasks";
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="border p-6 w-80">
        <h1 className="text-xl font-bold mb-4">Staff Login</h1>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        {step === "mobile" && (
          <>
            <input
              placeholder="Mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="border p-2 w-full mb-4"
            />
            <button
              onClick={sendOTP}
              className="w-full bg-black text-white p-2"
            >
              Send OTP
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border p-2 w-full mb-4"
            />
            <button
              onClick={verifyOTP}
              className="w-full bg-black text-white p-2"
            >
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
