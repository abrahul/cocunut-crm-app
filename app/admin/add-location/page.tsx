"use client";

import { useState, type FormEvent } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AddLocationPage() {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [defaultRate, setDefaultRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { adminFetch } = useAdminAuth();

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await adminFetch("/api/admin/add-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        latitude,
        longitude,
        defaultRate,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setName("");
      setLatitude("");
      setLongitude("");
      setDefaultRate("");
      setMessage("Location added successfully");
    } else {
      setMessage(data.error || "Failed to add location");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="crm-pill">Service Areas</p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
          Add Location
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Define coverage zones and default pricing for new customers.
        </p>
      </div>

      <form onSubmit={submitHandler} className="crm-card space-y-4">
        <label className="block">
          <span className="crm-label">Location name</span>
          <input
            type="text"
            placeholder="Location name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="crm-input mt-2"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label">Latitude</span>
            <input
              type="number"
              step="any"
              placeholder="Latitude (-90 to 90)"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="crm-input mt-2"
            />
          </label>
          <label className="block">
            <span className="crm-label">Longitude</span>
            <input
              type="number"
              step="any"
              placeholder="Longitude (-180 to 180)"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="crm-input mt-2"
            />
          </label>
        </div>
        <label className="block">
          <span className="crm-label">Default rate</span>
          <input
            type="number"
            step="any"
            placeholder="Default rate"
            value={defaultRate}
            onChange={(e) => setDefaultRate(e.target.value)}
            className="crm-input mt-2"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="crm-btn-primary disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Location"}
          </button>
          {message && (
            <p className="text-sm font-semibold text-[color:var(--muted)]">
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
