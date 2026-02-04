"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AddCustomerPage() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    locationId: "",
  });
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
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Mobile"
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({ ...form, mobile: e.target.value })
          }
        />

        <input
          placeholder="Address"
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />

        <select
          className="border p-2 w-full"
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

        <button className="bg-black text-white px-4 py-2">
          Add Customer
        </button>
      </form>
    </div>
  );
}
