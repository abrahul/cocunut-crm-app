"use client";
import { useState } from "react";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");

  async function send() {
    if (mobile.length !== 10) {
      alert("Enter valid mobile number");
      return;
    }

    const res = await fetch("/api/auth/staff/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }), // ✅ FIX
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setSessionId(data.sessionId);
  }

  async function verify() {
    const res = await fetch("/api/auth/staff/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "OTP failed");
      return;
    }

    alert("Login successful 🎉");
    window.location.href = "/staff/tasks";
  }

  return (
    <div>
      <input
        placeholder="Mobile"
        onChange={e => setMobile(e.target.value)}
      />
      <button onClick={send}>Send OTP</button>

      {sessionId && (
        <>
          <input
            placeholder="OTP"
            onChange={e => setOtp(e.target.value)}
          />
          <button onClick={verify}>Verify</button>
        </>
      )}
    </div>
  );
}
