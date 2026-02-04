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
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">Add Customer</h1>

      <form onSubmit={submitHandler} className="space-y-3">
        <input
          placeholder="Customer Name"
          className="border p-2 w-full"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />
        {errors.name && (
          <p className="text-red-600 text-sm">
            {errors.name}
          </p>
        )}

        <input
          placeholder="Mobile"
          className="border p-2 w-full"
          value={form.mobile}
          onChange={(e) =>
            setForm({ ...form, mobile: e.target.value })
          }
        />
        {errors.mobile && (
          <p className="text-red-600 text-sm">
            {errors.mobile}
          </p>
        )}

        <input
          placeholder="Alternate Number (optional)"
          className="border p-2 w-full"
          value={form.alternateMobile}
          onChange={(e) =>
            setForm({
              ...form,
              alternateMobile: e.target.value,
            })
          }
        />

        <input
          placeholder="Profession (optional)"
          className="border p-2 w-full"
          value={form.profession}
          onChange={(e) =>
            setForm({
              ...form,
              profession: e.target.value,
            })
          }
        />

        <input
          type="number"
          step="any"
          placeholder="Latitude"
          className="border p-2 w-full"
          value={form.latitude}
          onChange={(e) =>
            setForm({
              ...form,
              latitude: e.target.value,
            })
          }
        />
        {errors.latitude && (
          <p className="text-red-600 text-sm">
            {errors.latitude}
          </p>
        )}

        <input
          type="number"
          step="any"
          placeholder="Longitude"
          className="border p-2 w-full"
          value={form.longitude}
          onChange={(e) =>
            setForm({
              ...form,
              longitude: e.target.value,
            })
          }
        />
        {errors.longitude && (
          <p className="text-red-600 text-sm">
            {errors.longitude}
          </p>
        )}

        <input
          placeholder="Address"
          className="border p-2 w-full"
          value={form.address}
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />
        {errors.address && (
          <p className="text-red-600 text-sm">
            {errors.address}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />
        {errors.email && (
          <p className="text-red-600 text-sm">
            {errors.email}
          </p>
        )}

        <input
          placeholder="Remark (optional)"
          className="border p-2 w-full"
          value={form.remark}
          onChange={(e) =>
            setForm({ ...form, remark: e.target.value })
          }
        />

        <select
          className="border p-2 w-full"
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
          <p className="text-red-600 text-sm">
            {errors.locationId}
          </p>
        )}

        <button className="bg-black text-white px-4 py-2">
          Add Customer
        </button>
      </form>
    </div>
  );
}
