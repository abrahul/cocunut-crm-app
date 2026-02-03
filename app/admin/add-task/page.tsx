"use client";

import { useEffect, useState } from "react";

type Customer = {
  _id: string;
  name: string;
  location?: {
    name: string;
  };
};

type Staff = {
  _id: string;
  name: string;
};

export default function AddTaskPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [form, setForm] = useState({
    customerId: "",
    staffId: "",
    treesCount: "",
    rate: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data)) {
          setCustomers(data);
        } else {
          console.error("Customer API error:", data);
          setCustomers([]);
        }
      })
      .catch(() => setCustomers([]));

    fetch("/api/admin/staff")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data)) {
          setStaff(data);
        } else {
          console.error("Staff API error:", data);
          setStaff([]);
        }
      })
      .catch(() => setStaff([]));
  }, []);

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.customerId ||
      !form.staffId ||
      !form.treesCount ||
      !form.rate
    ) {
      alert("All fields are required");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/add-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: form.customerId,
        staffId: form.staffId,
        treesCount: Number(form.treesCount),
        rate: Number(form.rate),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    if (res.ok) {
      alert("Task created successfully");
      setForm({
        customerId: "",
        staffId: "",
        treesCount: "",
        rate: "",
      });
    } else {
      alert(data.error || "Something went wrong");
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add Task</h1>

      <form onSubmit={submitHandler} className="space-y-4">
        <select
          className="border p-2 w-full"
          value={form.customerId}
          onChange={(e) =>
            setForm({
              ...form,
              customerId: e.target.value,
            })
          }
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.location?.name || "No location"})
            </option>
          ))}
        </select>

        <select
          className="border p-2 w-full"
          value={form.staffId}
          onChange={(e) =>
            setForm({
              ...form,
              staffId: e.target.value,
            })
          }
        >
          <option value="">Select Staff</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Number of Trees"
          className="border p-2 w-full"
          value={form.treesCount}
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
          value={form.rate}
          onChange={(e) =>
            setForm({
              ...form,
              rate: e.target.value,
            })
          }
        />

        <button
          disabled={loading}
          className="bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </div>
  );
}
