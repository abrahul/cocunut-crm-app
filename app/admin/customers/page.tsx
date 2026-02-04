"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Customers</h1>
          <p className="text-sm text-gray-500">
            {filteredCustomers.length}{" "}
            {filteredCustomers.length === 1 ? "customer" : "customers"}
          </p>
        </div>
        <Link href="/admin/add-customer" className="text-blue-600 underline">
          + Add Customer
        </Link>
      </div>

      {success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {notice}
        </div>
      )}

      <input
        placeholder="Search by name or phone number"
        className="border p-2 w-full mb-4"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {customers.length === 0 && (
        <p className="text-gray-500">No customers found.</p>
      )}
      {customers.length > 0 && filteredCustomers.length === 0 && (
        <p className="text-gray-500">No customers match the search.</p>
      )}

      {filteredCustomers.length > 0 && (
        <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">No.</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Mobile</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Alternate Mobile
                </th>
                <th className="px-4 py-3 text-left font-semibold">Profession</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Address</th>
                <th className="px-4 py-3 text-left font-semibold">Location</th>
                <th className="px-4 py-3 text-left font-semibold">Latitude</th>
                <th className="px-4 py-3 text-left font-semibold">Longitude</th>
                <th className="px-4 py-3 text-left font-semibold">Remark</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Last Climbed Date
                </th>
                <th className="px-4 py-3 text-left font-semibold">Due Days</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCustomers.map((customer, index) => (
                <tr key={customer._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {customer.name || "-"}
                  </td>
                  <td className="px-4 py-3">{customer.mobile || "-"}</td>
                  <td className="px-4 py-3">
                    {customer.alternateMobile || "-"}
                  </td>
                  <td className="px-4 py-3">{customer.profession || "-"}</td>
                  <td className="px-4 py-3">{customer.email || "-"}</td>
                  <td className="px-4 py-3">{customer.address || "-"}</td>
                  <td className="px-4 py-3">
                    {customer.location?.name || "-"}
                  </td>
                  <td className="px-4 py-3">{customer.latitude ?? "-"}</td>
                  <td className="px-4 py-3">{customer.longitude ?? "-"}</td>
                  <td className="px-4 py-3">{customer.remark || "-"}</td>
                  <td className="px-4 py-3">
                    {formatDate(customer.lastDateOfService)}
                  </td>
                  <td className="px-4 py-3">
                    {getDueDays(customer.lastDateOfService)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/customers/${customer._id}/edit`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="text-red-600 hover:text-red-700 font-medium"
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
