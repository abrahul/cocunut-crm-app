"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Customer = {
  _id: string;
  name: string;
  address?: string;
  remark?: string;
  location?: {
    name: string;
    defaultRate?: number;
  };
};

type Staff = {
  _id: string;
  name: string;
};

export default function AddTaskPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const { adminFetch } = useAdminAuth();

  const [form, setForm] = useState({
    customerId: "",
    staffId: "",
    treesCount: "",
    rate: "",
    serviceDate: "",
    serviceTime: "",
    medicine: "",
    exactAddress: "",
    remark: "",
  });
  const [previousRemark, setPreviousRemark] = useState("");
  const [updatingRemark, setUpdatingRemark] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminFetch("/api/admin/customers")
      .then((res) => res.json())
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

    adminFetch("/api/admin/staff")
      .then((res) => res.json())
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
      !form.rate ||
      !form.serviceDate ||
      !form.serviceTime ||
      !form.medicine ||
      !form.exactAddress
    ) {
      alert("All fields are required");
      return;
    }

    setLoading(true);

    const res = await adminFetch("/api/admin/add-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: form.customerId,
        staffId: form.staffId,
        treesCount: Number(form.treesCount),
        rate: Number(form.rate),
        serviceDate: form.serviceDate,
        serviceTime: form.serviceTime,
        medicine: form.medicine === "yes",
        exactAddress: form.exactAddress,
        remark: form.remark,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert("Task created successfully");
      setForm({
        customerId: "",
        staffId: "",
        treesCount: "",
        rate: "",
        serviceDate: "",
        serviceTime: "",
        medicine: "",
        exactAddress: "",
        remark: "",
      });
      setPreviousRemark("");
    } else {
      alert(data.error || "Something went wrong");
    }
  };

  const updateRemarkHandler = async () => {
    if (!form.customerId) {
      alert("Please select a customer first");
      return;
    }
    if (!form.remark.trim()) {
      alert("Please enter a remark");
      return;
    }

    setUpdatingRemark(true);
    const res = await adminFetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: form.customerId,
        remark: form.remark.trim(),
      }),
    });
    const data = await res.json();
    setUpdatingRemark(false);

    if (res.ok) {
      setPreviousRemark(data?.remark || "");
      setCustomers((prev) =>
        prev.map((c) =>
          c._id === form.customerId
            ? { ...c, remark: data?.remark || "" }
            : c
        )
      );
      setForm({
        ...form,
        remark: "",
      });
      alert("Remark updated");
    } else {
      alert(data?.error || "Failed to update remark");
    }
  };
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add Task</h1>

      <form onSubmit={submitHandler} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Customer
        </label>
        <select
          className="border p-2 w-full"
          value={form.customerId}
          onChange={(e) => {
            const customerId = e.target.value;
            const selectedCustomer = customers.find(
              (c) => c._id === customerId
            );
            const defaultRate = selectedCustomer?.location?.defaultRate;
            const nextPreviousRemark = selectedCustomer?.remark || "";
            const nextExactAddress =
              selectedCustomer?.address || "";
            setForm({
              ...form,
              customerId,
              rate:
                typeof defaultRate === "number"
                  ? String(defaultRate)
                  : "",
              exactAddress: nextExactAddress,
              remark: "",
            });
            setPreviousRemark(nextPreviousRemark);

            if (customerId) {
              adminFetch(`/api/admin/customers/${customerId}`)
                .then((res) => res.json())
                .then((data) => {
                  if (!data || data?.error) return;
                  setPreviousRemark(
                    typeof data.remark === "string"
                      ? data.remark
                      : ""
                  );
                  setForm((prev) => ({
                    ...prev,
                    exactAddress:
                      typeof data.address === "string"
                        ? data.address
                        : prev.exactAddress,
                    rate:
                      typeof data?.location?.defaultRate ===
                      "number"
                        ? String(data.location.defaultRate)
                        : prev.rate,
                  }));
                })
                .catch(() => {});
            }
          }}
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.location?.name || "No location"})
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium text-gray-700">
          Staff
        </label>
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

        <label className="block text-sm font-medium text-gray-700">
          Number of Trees
        </label>
        <input
          type="number"
          className="border p-2 w-full"
          value={form.treesCount}
          onChange={(e) =>
            setForm({
              ...form,
              treesCount: e.target.value,
            })
          }
        />

        <label className="block text-sm font-medium text-gray-700">
          Rate per Tree
        </label>
        <input
          type="number"
          className="border p-2 w-full"
          value={form.rate}
          onChange={(e) =>
            setForm({
              ...form,
              rate: e.target.value,
            })
          }
        />

        <label className="block text-sm font-medium text-gray-700">
          Date of Service
        </label>
        <input
          type="date"
          className="border p-2 w-full"
          value={form.serviceDate}
          onChange={(e) =>
            setForm({
              ...form,
              serviceDate: e.target.value,
            })
          }
        />

        <label className="block text-sm font-medium text-gray-700">
          Time of Service
        </label>
        <input
          type="time"
          className="border p-2 w-full"
          value={form.serviceTime}
          onChange={(e) =>
            setForm({
              ...form,
              serviceTime: e.target.value,
            })
          }
        />

        <div className="border p-2 w-full">
          <p className="text-sm text-gray-600 mb-2">
            Medicine required?
          </p>
          <label className="mr-4">
            <input
              type="radio"
              name="medicine"
              value="yes"
              checked={form.medicine === "yes"}
              onChange={(e) =>
                setForm({
                  ...form,
                  medicine: e.target.value,
                })
              }
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="medicine"
              value="no"
              checked={form.medicine === "no"}
              onChange={(e) =>
                setForm({
                  ...form,
                  medicine: e.target.value,
                })
              }
            />{" "}
            No
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Exact Address
        </label>
        <input
          type="text"
          className="border p-2 w-full"
          value={form.exactAddress}
          onChange={(e) =>
            setForm({
              ...form,
              exactAddress: e.target.value,
            })
          }
        />

        <label className="block text-sm font-medium text-gray-700">
          Remark
        </label>
        <textarea
          className="border p-2 w-full"
          rows={3}
          value={form.remark}
          onChange={(e) =>
            setForm({
              ...form,
              remark: e.target.value,
            })
          }
        />

        <button
          type="button"
          onClick={updateRemarkHandler}
          disabled={updatingRemark}
          className="bg-gray-700 text-white px-4 py-2 disabled:opacity-50"
        >
          {updatingRemark ? "Updating..." : "Update Remark"}
        </button>

        <label className="block text-sm font-medium text-gray-700">
          Previous Remark
        </label>
        <textarea
          className="border p-2 w-full bg-gray-50"
          rows={3}
          value={previousRemark}
          readOnly
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
