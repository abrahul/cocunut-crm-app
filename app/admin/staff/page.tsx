"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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
  }, []);

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
          s._id === staffId
            ? { ...s, isActive: confirmedActive }
            : s
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
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Staff</h1>
        <Link href="/admin/add-staff" className="text-blue-600 underline">
          + Add Staff
        </Link>
      </div>

      <input
        placeholder="Search by name or mobile"
        className="border p-2 w-full mb-4"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Mobile</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => {
            const isActive = normalizeIsActive(s.isActive);
            const isUpdating = updatingId === s._id;
            return (
            <tr key={s._id}>
              <td className="border p-2">
                <Link
                  href={`/admin/staff/${s._id}`}
                  className="text-blue-600 underline"
                >
                  {s.name}
                </Link>
              </td>
              <td className="border p-2">{s.mobile}</td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    isActive ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {isActive ? "Active" : "Disabled"}
                </span>
              </td>

              <td className="border p-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-blue-600 underline disabled:opacity-50"
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
                    className="text-blue-600 underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="text-red-600 underline"
                    onClick={() => handleDelete(s._id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}
