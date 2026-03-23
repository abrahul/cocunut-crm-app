"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatPhone } from "@/lib/formatPhone";

type Staff = {
  _id: string;
  name: string;
  mobile: string;
  isActive: boolean | string | number | null | undefined;
};

function normalizeIsActive(value: unknown) {
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  return true;
}

export default function StaffListPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    adminFetch("/api/admin/staff", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        setStaff(data);
      });
  }, [adminFetch]);

  const handleToggle = async (staffId: string, nextActive: boolean) => {
    setUpdatingId(staffId);
    try {
      const res = await adminFetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Failed to update status");
        return;
      }

      const confirmedActive =
        typeof data?.staff?.isActive === "boolean"
          ? data.staff.isActive
          : nextActive;

      setStaff((prev) =>
        prev.map((s) =>
          s._id === staffId ? { ...s, isActive: confirmedActive } : s
        )
      );
    } catch (err: any) {
      alert(err?.message || "Failed to update status");
    } finally {
      setUpdatingId((prev) => (prev === staffId ? null : prev));
    }
  };

  const handleDelete = async (staffId: string) => {
    const confirmed = window.confirm(
      "Delete this staff member? This cannot be undone."
    );
    if (!confirmed) return;

    const res = await adminFetch(`/api/admin/staff/${staffId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Failed to delete staff");
      return;
    }

    setStaff((prev) => prev.filter((s) => s._id !== staffId));
  };

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.mobile.includes(query)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-pill">Staff Directory</p>
          <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
            Staff
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Manage field team access and activity status.
          </p>
        </div>
        <Link href="/admin/add-staff" className="crm-btn-primary">
          Add Staff
        </Link>
      </div>

      <div className="crm-toolbar">
        <label className="block w-full md:max-w-sm">
          <span className="crm-label">Search</span>
          <input
            placeholder="Search by name or mobile"
            className="crm-input mt-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
        <table className="crm-table min-w-[520px]">
          <thead className="bg-white/70">
            <tr>
              <th className="crm-th">Name</th>
              <th className="crm-th">Mobile</th>
              <th className="crm-th">Status</th>
              <th className="crm-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {filtered.map((s) => {
              const isActive = normalizeIsActive(s.isActive);
              const isUpdating = updatingId === s._id;
              return (
                <tr key={s._id} className="hover:bg-white/70">
                  <td className="crm-td font-semibold text-[color:var(--ink)]">
                    <Link
                      href={`/admin/staff/${s._id}`}
                      className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)]"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="crm-td">{formatPhone(s.mobile)}</td>
                  <td className="crm-td">
                    <span
                      className={
                        isActive ? "crm-badge-success" : "crm-badge-warning"
                      }
                    >
                      {isActive ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="crm-td">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] font-semibold disabled:opacity-50"
                        disabled={isUpdating}
                        onClick={() => handleToggle(s._id, !isActive)}
                      >
                        {isUpdating
                          ? "Updating..."
                          : isActive
                            ? "Disable"
                            : "Activate"}
                      </button>
                      <Link
                        href={`/admin/staff/${s._id}/edit`}
                        className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] font-semibold"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700 font-semibold"
                        onClick={() => handleDelete(s._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
