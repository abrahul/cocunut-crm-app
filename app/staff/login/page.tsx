"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const router = useRouter();

  async function login() {
    const res = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    router.push("/staff/tasks");
  }

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-xl font-bold mb-4">Staff Login</h1>

      <input
        placeholder="Mobile number"
        className="border p-2 w-full mb-2"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <input
        placeholder="OTP (use 123456)"
        className="border p-2 w-full mb-4"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <button
        onClick={login}
        className="bg-black text-white w-full py-2"
      >
        Login
      </button>
    </div>
  );
}
