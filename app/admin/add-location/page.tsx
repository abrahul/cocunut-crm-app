"use client";

import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AddLocationPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { adminFetch } = useAdminAuth();

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await adminFetch("/api/admin/add-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setName("");
      setMessage("✅ Location added successfully");
    } else {
      setMessage(data.error || "❌ Failed to add location");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <h1 className="text-xl font-bold mb-4">Add Location</h1>

      <form onSubmit={submitHandler} className="space-y-4">
        <input
          type="text"
          placeholder="Location name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded"
        >
          {loading ? "Adding..." : "Add Location"}
        </button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
