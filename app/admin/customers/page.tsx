"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatPhone } from "@/lib/formatPhone";
import { formatDateDisplayIST } from "@/lib/date";

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
  serviceDate?: string;
  lastWorkedStaff?: {
    _id: string;
    name: string;
  };
  location?: Location;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDateDisplayIST(date);
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">(
    "active"
  );
  const [sortOrder, setSortOrder] = useState<
    "name-asc" | "name-desc" | "date-asc" | "date-desc"
  >("date-desc");
  const [locationFilter, setLocationFilter] = useState("all");
  const [serviceDateFilter, setServiceDateFilter] = useState("");
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminFetch("/api/admin/customers?includeArchived=true")
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

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sortOrder, locationFilter, serviceDateFilter, pageSize]);

  const availableLocations = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((customer) => {
      const id = customer.location?._id;
      const name = customer.location?.name;
      if (id && name) {
        map.set(id, name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible =
      statusFilter === "all"
        ? customers
        : customers.filter((customer) =>
            statusFilter === "archived" ? customer.isArchived : !customer.isArchived
          );
    const byLocation =
      locationFilter === "all"
        ? visible
        : visible.filter((customer) => customer.location?._id === locationFilter);
    const searched = !q
      ? byLocation
      : byLocation.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const mobile = customer.mobile || "";
      const alt = customer.alternateMobile || "";
      return name.includes(q) || mobile.includes(q) || alt.includes(q);
    });
    const withServiceDate = serviceDateFilter
      ? searched.filter((customer) => {
        if (!customer.serviceDate) return false;
        const service = new Date(customer.serviceDate);
        if (Number.isNaN(service.getTime())) return false;
        const serviceValue = service.toISOString().slice(0, 10);
        return serviceValue === serviceDateFilter;
      })
      : searched;
    const sorted = [...withServiceDate].sort((a, b) => {
      if (sortOrder.startsWith("name")) {
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        if (aName === bName) return 0;
        const cmp = aName < bName ? -1 : 1;
        return sortOrder === "name-asc" ? cmp : -cmp;
      }
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const cmp = aDate - bDate;
      return sortOrder === "date-asc" ? cmp : -cmp;
    });
    return sorted;
  }, [customers, query, statusFilter, sortOrder, locationFilter, serviceDateFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  }, [filteredCustomers.length, pageSize]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const pages: number[] = [];
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredCustomers.slice(start, end);
  }, [filteredCustomers, page, pageSize]);

  const handleArchiveToggle = async (customer: Customer) => {
    setNotice(null);
    setSuccess(null);
    try {
      const res = await adminFetch(
        `/api/admin/customers/${customer._id}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isArchived: !customer.isArchived }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setNotice(data?.error || "Update failed.");
        return;
      }
      setCustomers((prev) =>
        prev.map((c) =>
          c._id === customer._id ? { ...c, isArchived: data.isArchived } : c
        )
      );
      setSuccess(
        customer.isArchived ? "Customer restored." : "Customer archived."
      );
    } catch (err) {
      console.error("Archive customer error", err);
      setNotice("Update failed. Please try again.");
    }
  };

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
        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Status</span>
          <select
            className="crm-input mt-2"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "active" | "archived" | "all"
              )
            }
          >
            <option value="active">Active only</option>
            <option value="archived">Archived only</option>
            <option value="all">All customers</option>
          </select>
        </label>
        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Location</span>
          <select
            className="crm-input mt-2"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All locations</option>
            {availableLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Sort</span>
          <select
            className="crm-input mt-2"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(
                e.target.value as
                  | "name-asc"
                  | "name-desc"
                  | "date-asc"
                  | "date-desc"
              )
            }
          >
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="date-asc">Date added (oldest first)</option>
            <option value="date-desc">Date added (newest first)</option>
          </select>
        </label>
        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Service date</span>
          <input
            type="date"
            className="crm-input mt-2"
            value={serviceDateFilter}
            onChange={(e) => setServiceDateFilter(e.target.value)}
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
                <th className="crm-th">Address</th>
                <th className="crm-th">Location</th>
                <th className="crm-th">Latitude</th>
                <th className="crm-th">Longitude</th>
                <th className="crm-th">Remark</th>
                <th className="crm-th">Last Staff</th>
                <th className="crm-th">Last Climbed</th>
                <th className="crm-th">Service Date</th>
                <th className="crm-th">Due Days</th>
                <th className="crm-th">Status</th>
                <th className="crm-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {pagedCustomers.map((customer, index) => (
                <tr key={customer._id} className="hover:bg-white/70">
                  <td className="crm-td text-[color:var(--muted)]">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="crm-td font-semibold text-[color:var(--ink)]">
                    {customer.name || "-"}
                  </td>
                  <td className="crm-td">{formatPhone(customer.mobile)}</td>
                  <td className="crm-td">
                    {formatPhone(customer.alternateMobile)}
                  </td>
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
                    {customer.lastWorkedStaff?.name || "-"}
                  </td>
                  <td className="crm-td">
                    {formatDate(customer.lastDateOfService)}
                  </td>
                  <td className="crm-td">
                    {formatDate(customer.serviceDate)}
                  </td>
                  <td className="crm-td">
                    {getDueDays(customer.lastDateOfService)}
                  </td>
                  <td className="crm-td">
                    {customer.isArchived ? "Archived" : "Active"}
                  </td>
                  <td className="crm-td">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/add-task?customerId=${customer._id}`}
                        className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] font-semibold cursor-pointer"
                      >
                        Add Task
                      </Link>
                      <button
                        onClick={() => handleArchiveToggle(customer)}
                        className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                      >
                        {customer.isArchived ? "Unarchive" : "Archive"}
                      </button>
                      <Link
                        href={`/admin/customers/${customer._id}/edit`}
                        className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] font-semibold cursor-pointer"
                        aria-label="Edit customer"
                        title="Edit"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                          <path d="M12 20h9" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                        aria-label="Delete customer"
                        title="Delete"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M6 6l1 14h10l1-14" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCustomers.length > 0 && (
        <div className="crm-toolbar">
          <span className="text-xs font-semibold text-[color:var(--muted)]">
            Page {page} of {totalPages}
          </span>
          <label className="block w-full max-w-[140px]">
            <span className="crm-label">Page size</span>
            <select
              className="crm-select mt-2"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="crm-btn-outline disabled:opacity-60"
          >
            Previous
          </button>
          <div className="flex flex-wrap gap-2">
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => setPage(number)}
                className={
                  number === page ? "crm-btn-primary" : "crm-btn-outline"
                }
              >
                {number}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="crm-btn-outline disabled:opacity-60"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
