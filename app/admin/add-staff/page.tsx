"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatPhoneInput, normalizePhoneDigits } from "@/lib/formatPhone";

export default function AddStaffPage() {
  const router = useRouter();
  const { adminFetch } = useAdminAuth();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);

    if (password.trim() && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const normalizedMobile = normalizePhoneDigits(mobile);
    const res = await adminFetch("/api/admin/add-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mobile: normalizedMobile,
        password,
        isActive: true,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/admin/staff");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="crm-pill">Team Management</p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
          Add Staff
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Register a new staff member for upcoming assignments.
        </p>
      </div>

      <div className="crm-card space-y-4">
        <label className="block">
          <span className="crm-label crm-label-required">Staff name</span>
          <input
            className="crm-input mt-2"
            placeholder="Staff Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="crm-label crm-label-required">Mobile number</span>
          <input
            className="crm-input mt-2"
            placeholder="Mobile Number"
            required
            value={mobile}
            onChange={(e) => setMobile(formatPhoneInput(e.target.value))}
          />
        </label>

        <label className="block">
          <span className="crm-label crm-label-required">Password</span>
          <input
            className="crm-input mt-2"
            placeholder="Assign a password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </label>

        <label className="block">
          <span className="crm-label crm-label-required">Confirm password</span>
          <input
            className="crm-input mt-2"
            placeholder="Re-enter password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </label>

        {error && (
          <p className="text-sm font-semibold text-red-600">{error}</p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="crm-btn-primary disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Staff"}
        </button>
      </div>
    </div>
  );
}
