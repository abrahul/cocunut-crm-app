"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AddStaffPage() {
  const router = useRouter();
  const { adminFetch } = useAdminAuth();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);

    const res = await adminFetch("/api/admin/add-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile, isActive: true }),
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
          <span className="crm-label">Staff name</span>
          <input
            className="crm-input mt-2"
            placeholder="Staff Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="crm-label">Mobile number</span>
          <input
            className="crm-input mt-2"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
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
