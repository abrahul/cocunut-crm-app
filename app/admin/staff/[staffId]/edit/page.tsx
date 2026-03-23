"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatPhoneInput, normalizePhoneDigits } from "@/lib/formatPhone";

export default function EditStaffPage() {
  const params = useParams();
  const staffId = params.staffId as string;
  const router = useRouter();
  const { adminFetch } = useAdminAuth();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffId) return;

    adminFetch(`/api/admin/staff/${staffId}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch staff");
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setName(data.name);
        setMobile(formatPhoneInput(data.mobile));
      })
      .catch((err) => {
        alert(err.message);
      })
      .finally(() => setLoading(false));
  }, [staffId]);

  async function handleUpdate() {
    if (password.trim() && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const normalizedMobile = normalizePhoneDigits(mobile);
    const res = await adminFetch(`/api/admin/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mobile: normalizedMobile,
        password: password.trim() ? password : undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("Staff updated successfully");
    router.push("/admin/staff");
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="crm-pill">Staff Profile</p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
          Edit Staff
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Update contact details for this team member.
        </p>
      </div>

      <div className="crm-card space-y-4">
        <label className="block">
          <span className="crm-label crm-label-required">Name</span>
          <input
            className="crm-input mt-2"
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="crm-label crm-label-required">Mobile</span>
          <input
            className="crm-input mt-2"
            placeholder="Mobile"
            required
            value={mobile}
            onChange={(e) => setMobile(formatPhoneInput(e.target.value))}
          />
        </label>

        <label className="block">
          <span className="crm-label">New password</span>
          <input
            className="crm-input mt-2"
            placeholder="Leave blank to keep current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </label>

        <label className="block">
          <span className="crm-label">Confirm password</span>
          <input
            className="crm-input mt-2"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </label>

        <button onClick={handleUpdate} className="crm-btn-primary">
          Save Changes
        </button>
      </div>
    </div>
  );
}
