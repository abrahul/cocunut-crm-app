"use client";

import { useEffect, useState } from "react";
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
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    adminFetch("/api/admin/staff", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        setStaff(data);
      });
  }, [adminFetch]);

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
            {staff.map((s) => {
              const isActive = normalizeIsActive(s.isActive);
              return (
                <tr key={s._id} className="hover:bg-white/70">
                  <td className="crm-td font-semibold text-[color:var(--ink)]">
                    {s.name}
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
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-700 font-semibold"
                      onClick={() => handleDelete(s._id)}
                    >
                      Delete
                    </button>
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
