"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AddCustomerPage() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    alternateMobile: "",
    profession: "",
    latitude: "",
    longitude: "",
    address: "",
    email: "",
    remark: "",
    locationId: "",
  });
  const [errors, setErrors] = useState<
    Record<string, string>
  >({});
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    adminFetch("/api/admin/locations")
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        setLocations(data);
      });
  }, []);

  const submitHandler = async (e: any) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      nextErrors.name = "Name is required";
    }
    if (!form.mobile.trim()) {
      nextErrors.mobile = "Mobile is required";
    }
    if (!form.address.trim()) {
      nextErrors.address = "Address is required";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    }
    if (!form.locationId) {
      nextErrors.locationId = "Location is required";
    }
    const latNumber = Number(form.latitude);
    const lngNumber = Number(form.longitude);
    if (!form.latitude || Number.isNaN(latNumber)) {
      nextErrors.latitude = "Valid latitude is required";
    }
    if (!form.longitude || Number.isNaN(lngNumber)) {
      nextErrors.longitude = "Valid longitude is required";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const res = await adminFetch("/api/admin/add-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    alert(data.message || data.error);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="crm-pill">Customer Onboarding</p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
          Add Customer
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Capture contact details, location, and notes for future visits.
        </p>
      </div>

      <form onSubmit={submitHandler} className="crm-card space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Customer name</span>
            <input
              placeholder="Customer Name"
              className="crm-input mt-2"
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            {errors.name && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.name}
              </p>
            )}
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Primary mobile</span>
            <input
              placeholder="Mobile"
              className="crm-input mt-2"
              required
              value={form.mobile}
              onChange={(e) =>
                setForm({ ...form, mobile: e.target.value })
              }
            />
            {errors.mobile && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.mobile}
              </p>
            )}
          </label>

          <label className="block">
            <span className="crm-label">Alternate mobile</span>
            <input
              placeholder="Alternate Number (optional)"
              className="crm-input mt-2"
              value={form.alternateMobile}
              onChange={(e) =>
                setForm({
                  ...form,
                  alternateMobile: e.target.value,
                })
              }
            />
          </label>

          <label className="block">
            <span className="crm-label">Profession</span>
            <input
              placeholder="Profession (optional)"
              className="crm-input mt-2"
              value={form.profession}
              onChange={(e) =>
                setForm({
                  ...form,
                  profession: e.target.value,
                })
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
              placeholder="Latitude"
              className="crm-input mt-2"
              required
              value={form.latitude}
              onChange={(e) =>
                setForm({
                  ...form,
                  latitude: e.target.value,
                })
              }
            />
            {errors.latitude && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.latitude}
              </p>
            )}
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Longitude</span>
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              className="crm-input mt-2"
              required
              value={form.longitude}
              onChange={(e) =>
                setForm({
                  ...form,
                  longitude: e.target.value,
                })
              }
            />
            {errors.longitude && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.longitude}
              </p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="crm-label crm-label-required">Address</span>
          <input
            placeholder="Address"
            className="crm-input mt-2"
            required
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
          {errors.address && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {errors.address}
            </p>
          )}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Email</span>
            <input
              type="email"
              placeholder="Email"
              className="crm-input mt-2"
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
            {errors.email && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.email}
              </p>
            )}
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Location</span>
            <select
              className="crm-select mt-2"
              required
              value={form.locationId}
              onChange={(e) =>
                setForm({
                  ...form,
                  locationId: e.target.value,
                })
              }
            >
              <option value="">Select Location</option>
              {locations.map((loc: any) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {errors.locationId && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.locationId}
              </p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="crm-label">Remark</span>
          <input
            placeholder="Remark (optional)"
            className="crm-input mt-2"
            value={form.remark}
            onChange={(e) =>
              setForm({ ...form, remark: e.target.value })
            }
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button className="crm-btn-primary">Add Customer</button>
          <p className="text-xs text-[color:var(--muted)]">
            Required fields are marked with an asterisk (*).
          </p>
        </div>
      </form>
    </div>
  );
}
