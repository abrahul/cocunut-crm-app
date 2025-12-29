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
    <div>
      <input placeholder="Phone" onChange={e => setPhone(e.target.value)} />
      <button onClick={send}>Send OTP</button>

      {sessionId && (
        <>
          <input placeholder="OTP" onChange={e => setOtp(e.target.value)} />
          <button onClick={verify}>Verify</button>
        </>
      )}
    </div>
  );
}
