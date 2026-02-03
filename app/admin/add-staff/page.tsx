"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddStaffPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/add-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/admin/staff");
  }

  return (
    <div className="max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">Add Staff</h1>

      <input
        className="border p-2 w-full mb-3"
        placeholder="Staff Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-3"
        placeholder="Mobile Number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Adding..." : "Add Staff"}
      </button>
    </div>
  );
}
