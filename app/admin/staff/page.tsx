"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Staff = {
  _id: string;
  name: string;
  mobile: string;
  isActive: boolean;
};

export default function StaffListPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/staff")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setStaff(data);
      });
  }, []);

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
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
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
                    s.isActive ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {s.isActive ? "Active" : "Disabled"}
                </span>
              </td>

              <td className="border p-2">
                <Link
                  href={`/admin/staff/${s._id}/edit`}
                  className="text-blue-600 underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
