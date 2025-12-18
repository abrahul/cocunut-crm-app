"use client";

import { useEffect, useState } from "react";

export default function AddTaskPage() {
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    customerId: "",
    staffId: "",
    treesCount: "",
    rate: "",
  });

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then(setCustomers);
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then(setStaff);
  }, []);

  const submitHandler = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/admin/add-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        treesCount: Number(form.treesCount),
        rate: Number(form.rate),
      }),
    });

    const data = await res.json();
    alert(data.message || data.error);
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">
        Add Task
      </h1>

      <form className="space-y-3" onSubmit={submitHandler}>
        <select
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({
              ...form,
              customerId: e.target.value,
            })
          }
        >
          <option value="">Select Customer</option>
          {customers.map((c: any) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.location.name})
            </option>
          ))}
        </select>

        <select
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({
              ...form,
              staffId: e.target.value,
            })
          }
        >
          <option value="">Select Staff</option>
          {staff.map((s: any) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Number of Trees"
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({
              ...form,
              treesCount: e.target.value,
            })
          }
        />

        <input
          type="number"
          placeholder="Rate per Tree"
          className="border p-2 w-full"
          onChange={(e) =>
            setForm({
              ...form,
              rate: e.target.value,
            })
          }
        />

        <button className="bg-black text-white px-4 py-2">
          Create Task
        </button>
      </form>
    </div>
  );
}
