"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatPhone } from "@/lib/formatPhone";

type Customer = {
  _id: string;
  name: string;
  mobile: string;
  alternateMobile?: string;
  profession?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  email?: string;
  remark?: string;
  lastDateOfService?: string;
  serviceDate?: string;
  lastWorkedStaff?: {
    _id: string;
    name: string;
  };
  location?: {
    _id: string;
    name: string;
  };
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    let active = true;
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("includeArchived", "true");
      params.set("status", "all");
      params.set("sort", "date-desc");

      adminFetch(`/api/admin/customers?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (!active) return;
          if (Array.isArray(data)) {
            setCustomers(data);
          } else if (Array.isArray(data?.customers)) {
            setCustomers(data.customers);
          } else {
            setCustomers([]);
          }
        })
        .catch((err) => {
          console.error("Admin customers fetch error", err);
          if (!active) return;
          setCustomers([]);
        })
        .finally(() => {
          if (active) {
            setLoading(false);
            setInitialLoading(false);
          }
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [adminFetch]);

  const pagedCustomers = customers;

  const handleDelete = async (customerId: string) => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      const res = await adminFetch(`/api/admin/customers/${customerId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Delete failed.");
        return;
      }
      setCustomers((prev) => prev.filter((c) => c._id !== customerId));
    } catch (err) {
      console.error("Delete customer error", err);
      alert("Delete failed. Please try again.");
    }
  };


  if (initialLoading) return <p className="p-4">Loading...</p>;
  const isRefreshing = loading && !initialLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-pill">Directory</p>
          <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
            Manage Customers
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {customers.length} {customers.length === 1 ? "customer" : "customers"}
          </p>
        </div>
      </div>

      {isRefreshing && (
        <p className="text-xs text-[color:var(--muted)]">Updating list...</p>
      )}

      {customers.length === 0 && (
        <div className="crm-card">
          <p className="text-sm text-[color:var(--muted)]">
            No customers found.
          </p>
        </div>
      )}

      {customers.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
          <table className="crm-table">
            <thead className="bg-white/70">
              <tr>
                <th className="crm-th">Name</th>
                <th className="crm-th">Phone</th>
                <th className="crm-th">Address</th>
                <th className="crm-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {pagedCustomers.map((customer, index) => (
                <tr key={customer._id} className="hover:bg-white/70">
                  <td className="crm-td font-semibold text-[color:var(--ink)]">
                    {customer.name || "-"}
                  </td>
                  <td className="crm-td">{formatPhone(customer.mobile)}</td>
                  <td className="crm-td">{customer.address || "-"}</td>
                  <td className="crm-td">
                    <button
                      onClick={() => handleDelete(customer._id)}
                      className="text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

