"use client";
import { useEffect, useState } from "react";

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function StaffLoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<DeferredInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as DeferredInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  async function login() {
    if (!mobile.trim()) {
      setError("Please enter your mobile number.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    setLoggingIn(true);
    const res = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password }),
    });

    const data = await res.json();
    setLoggingIn(false);

    if (!res.ok) {
      setError(data.error || "Login failed.");
      return;
    }

    if (data?.staff?.name) {
      localStorage.setItem("staffName", String(data.staff.name));
    }

    window.location.href = "/staff/tasks";
  }

  async function installApp() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
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
            Sign in using the mobile number registered by your admin.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="crm-label crm-label-required">Mobile number</span>
              <input
                className="crm-input mt-2"
                placeholder="e.g. 5551234567"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
              />
            </label>

            <label className="block">
              <span className="crm-label crm-label-required">Password</span>
              <input
                className="crm-input mt-2"
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={login}
              disabled={loggingIn}
              className="crm-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loggingIn ? "Signing in..." : "Sign in"}
            </button>

            {installPrompt && (
              <button
                onClick={installApp}
                className="crm-btn-outline w-full"
                type="button"
              >
                Install Staff App
              </button>
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
