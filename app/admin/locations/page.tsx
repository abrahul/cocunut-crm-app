"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Location = {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  defaultRate: number;
};

type EditForm = {
  name: string;
  latitude: string;
  longitude: string;
  defaultRate: string;
};

const emptyForm: EditForm = {
  name: "",
  latitude: "",
  longitude: "",
  defaultRate: "",
};

export default function LocationsPage() {
  const { adminFetch } = useAdminAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    adminFetch("/api/admin/locations", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        if (!active) return;
        setMessage(err?.message || "Failed to load locations");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [adminFetch]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return locations;
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(term)
    );
  }, [locations, query]);

  const startEdit = (loc: Location) => {
    setEditId(loc._id);
    setForm({
      name: loc.name ?? "",
      latitude: Number.isFinite(loc.latitude)
        ? String(loc.latitude)
        : "",
      longitude: Number.isFinite(loc.longitude)
        ? String(loc.longitude)
        : "",
      defaultRate: Number.isFinite(loc.defaultRate)
        ? String(loc.defaultRate)
        : "",
    });
    setMessage("");
  };

  const cancelEdit = (clearMessage = true) => {
    setEditId(null);
    setForm(emptyForm);
    if (clearMessage) setMessage("");
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    const nextErrors: string[] = [];

    if (!form.name.trim()) {
      nextErrors.push("Location name is required.");
    }

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const rate = Number(form.defaultRate);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      nextErrors.push("Latitude must be between -90 and 90.");
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      nextErrors.push("Longitude must be between -180 and 180.");
    }
    if (!Number.isFinite(rate) || rate < 0) {
      nextErrors.push("Default rate must be 0 or higher.");
    }

    if (nextErrors.length > 0) {
      setMessage(nextErrors[0]);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await adminFetch(`/api/admin/locations/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          latitude: lat,
          longitude: lng,
          defaultRate: rate,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || "Failed to update location");
        return;
      }

      if (data?.location) {
        setLocations((prev) =>
          prev.map((loc) =>
            loc._id === editId ? data.location : loc
          )
        );
      }
      setMessage("Location updated successfully.");
      cancelEdit(false);
    } catch (err: any) {
      setMessage(err?.message || "Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (locationId: string) => {
    const confirmed = window.confirm(
      "Delete this location? Customers and tasks must be reassigned first."
    );
    if (!confirmed) return;

    const res = await adminFetch(`/api/admin/locations/${locationId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Failed to delete location");
      return;
    }

    setLocations((prev) => prev.filter((loc) => loc._id !== locationId));
    if (editId === locationId) {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-pill">Service Areas</p>
          <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
            Locations
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Edit coverage zones, coordinates, and default pricing.
          </p>
        </div>
        <Link href="/admin/add-location" className="crm-btn-primary">
          Add Location
        </Link>
      </div>

      <div className="crm-toolbar">
        <label className="block w-full md:max-w-sm">
          <span className="crm-label">Search</span>
          <input
            placeholder="Search by location name"
            className="crm-input mt-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {message && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--muted)]">
          {message}
        </div>
      )}

      {editId && (
        <form onSubmit={handleSave} className="crm-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Editing
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--ink)]">
                Update Location
              </h2>
            </div>
            <button
              type="button"
              className="crm-btn-outline"
              onClick={() => cancelEdit()}
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="crm-label crm-label-required">Location name</span>
              <input
                className="crm-input mt-2"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="crm-label crm-label-required">Default rate</span>
              <input
                type="number"
                step="any"
                className="crm-input mt-2"
                required
                value={form.defaultRate}
                onChange={(e) =>
                  setForm({ ...form, defaultRate: e.target.value })
                }
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="crm-label crm-label-required">Latitude</span>
              <input
                type="number"
                step="any"
                className="crm-input mt-2"
                required
                value={form.latitude}
                onChange={(e) =>
                  setForm({ ...form, latitude: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="crm-label crm-label-required">Longitude</span>
              <input
                type="number"
                step="any"
                className="crm-input mt-2"
                required
                value={form.longitude}
                onChange={(e) =>
                  setForm({ ...form, longitude: e.target.value })
                }
              />
            </label>
          </div>

          <button
            type="submit"
            className="crm-btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
          <table className="crm-table min-w-[760px]">
            <thead className="bg-white/70">
              <tr>
                <th className="crm-th">Location</th>
                <th className="crm-th">Latitude</th>
                <th className="crm-th">Longitude</th>
                <th className="crm-th">Default Rate</th>
                <th className="crm-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {filtered.map((loc) => (
                <tr key={loc._id} className="hover:bg-white/70">
                  <td className="crm-td font-semibold text-[color:var(--ink)]">
                    {loc.name}
                  </td>
                  <td className="crm-td">{loc.latitude}</td>
                  <td className="crm-td">{loc.longitude}</td>
                  <td className="crm-td">{loc.defaultRate}</td>
                  <td className="crm-td">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] font-semibold"
                        onClick={() => startEdit(loc)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700 font-semibold"
                        onClick={() => handleDelete(loc._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td className="crm-td" colSpan={5}>
                    No locations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
