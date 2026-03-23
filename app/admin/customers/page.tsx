"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatPhone } from "@/lib/formatPhone";

type Location = {
  _id: string;
  name: string;
};

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
  location?: Location;
  createdAt?: string;
  updatedAt?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const getDueDays = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff < 0 ? "0" : String(diff);
};

const formatCoordinate = (
  value?: number,
  positiveLabel?: "N" | "E",
  negativeLabel?: "S" | "W"
) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const direction = value < 0 ? negativeLabel : positiveLabel;
  return `${Math.abs(value)} ${direction}`;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminFetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Admin customers fetch error", err);
        if (!active) return;
        setCustomers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [adminFetch]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const mobile = customer.mobile || "";
      const alt = customer.alternateMobile || "";
      return name.includes(q) || mobile.includes(q) || alt.includes(q);
    });
  }, [customers, query]);

  const handleDelete = async (customerId: string) => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    setNotice(null);
    setSuccess(null);
    try {
      const res = await adminFetch(`/api/admin/customers/${customerId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data?.error || "Delete failed.");
        return;
      }
      setCustomers((prev) => prev.filter((c) => c._id !== customerId));
      setSuccess("Customer deleted.");
    } catch (err) {
      console.error("Delete customer error", err);
      setNotice("Delete failed. Please try again.");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-pill">Directory</p>
          <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
            Manage Customers
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {filteredCustomers.length}{" "}
            {filteredCustomers.length === 1 ? "customer" : "customers"}
          </p>
        </div>
        <Link href="/admin/add-customer" className="crm-btn-primary">
          Add Customer
        </Link>
      </div>

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {notice}
        </div>
      )}

      <div className="crm-toolbar">
        <label className="block w-full md:max-w-sm">
          <span className="crm-label">Search</span>
          <input
            placeholder="Search by name or phone number"
            className="crm-input mt-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {customers.length === 0 && (
        <div className="crm-card">
          <p className="text-sm text-[color:var(--muted)]">
            No customers found.
          </p>
        </div>
      )}
      {customers.length > 0 && filteredCustomers.length === 0 && (
        <div className="crm-card">
          <p className="text-sm text-[color:var(--muted)]">
            No customers match the search.
          </p>
        </div>
      )}

      {filteredCustomers.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
          <table className="crm-table">
            <thead className="bg-white/70">
              <tr>
                <th className="crm-th">No.</th>
                <th className="crm-th">Name</th>
                <th className="crm-th">Mobile</th>
                <th className="crm-th">Alternate</th>
                <th className="crm-th">Profession</th>
                <th className="crm-th">Email</th>
                <th className="crm-th">Address</th>
                <th className="crm-th">Location</th>
                <th className="crm-th">Latitude</th>
                <th className="crm-th">Longitude</th>
                <th className="crm-th">Remark</th>
                <th className="crm-th">Last Climbed</th>
                <th className="crm-th">Due Days</th>
                <th className="crm-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {filteredCustomers.map((customer, index) => (
                <tr key={customer._id} className="hover:bg-white/70">
                  <td className="crm-td text-[color:var(--muted)]">
                    {index + 1}
                  </td>
                  <td className="crm-td font-semibold text-[color:var(--ink)]">
                    {customer.name || "-"}
                  </td>
                  <td className="crm-td">{formatPhone(customer.mobile)}</td>
                  <td className="crm-td">
                    {formatPhone(customer.alternateMobile)}
                  </td>
                  <td className="crm-td">{customer.profession || "-"}</td>
                  <td className="crm-td">{customer.email || "-"}</td>
                  <td className="crm-td">{customer.address || "-"}</td>
                  <td className="crm-td">
                    {customer.location?.name || "-"}
                  </td>
                  <td className="crm-td">
                    {formatCoordinate(customer.latitude, "N", "S")}
                  </td>
                  <td className="crm-td">
                    {formatCoordinate(customer.longitude, "E", "W")}
                  </td>
                  <td className="crm-td">{customer.remark || "-"}</td>
                  <td className="crm-td">
                    {formatDate(customer.lastDateOfService)}
                  </td>
                  <td className="crm-td">
                    {getDueDays(customer.lastDateOfService)}
                  </td>
                  <td className="crm-td">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/add-task?customerId=${customer._id}`}
                        className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] font-semibold"
                      >
                        Add Task
                      </Link>
                      <Link
                        href={`/admin/customers/${customer._id}/edit`}
                        className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] font-semibold"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="text-red-600 hover:text-red-700 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
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
