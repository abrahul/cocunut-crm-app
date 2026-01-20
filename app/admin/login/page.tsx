"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login() {
    setError("");

    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
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

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-4"
        />

        <button
          onClick={login}
          className="w-full bg-black text-white p-2"
        >
          Login
        </button>
      </div>
    </div>
  );
}
