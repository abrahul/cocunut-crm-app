"use client";

import { useEffect, useState } from "react";

export default function AddCustomerPage() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    locationId: "",
  });

  useEffect(() => {
    fetch("/api/admin/locations")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setLocations(data);
      });
  }, []);

  const submitHandler = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/admin/add-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

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
