"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Staff = {
  _id: string;
  name: string;
  phone: string;
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStaff(search = "") {
    setLoading(true);
    const res = await fetch(`/api/admin/staff?q=${search}`);
    const data = await res.json();
    setStaff(data);
    setLoading(false);
  }

  useEffect(() => {
    loadStaff(); // load ALL staff initially
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStaff(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staff</h1>

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Search by name or phone"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 w-full mb-6"
      />

      {loading && <p>Loading...</p>}

      {!loading && staff.length === 0 && (
        <p className="text-gray-500">No staff found</p>
      )}

      <ul className="space-y-3">
        {staff.map((s) => (
          <li
            key={s._id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-gray-600">{s.phone}</p>
            </div>

            <Link
              href={`/admin/staff/${s._id}`}
              className="text-blue-600 underline"
            >
              View
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
