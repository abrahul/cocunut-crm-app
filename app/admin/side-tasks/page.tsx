"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatPhone } from "@/lib/formatPhone";

type Entity = {
  _id: string;
  name: string;
  mobile?: string;
};

type SideTask = {
  _id: string;
  customer?: Entity;
  location?: Entity;
  staff?: Entity;
  sideTaskCustomerPhone?: string;
  parentTask?: {
    _id: string;
    serviceDate?: string;
  };
  completedDate?: string;
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: "pending" | "completed" | string;
};

export default function AdminSideTasksPage() {
  const [tasks, setTasks] = useState<SideTask[]>([]);
  const [staffOptions, setStaffOptions] = useState<Entity[]>([]);
  const [locationOptions, setLocationOptions] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadLists = async () => {
      const [staffResult, locationsResult] = await Promise.allSettled([
        adminFetch("/api/admin/staff", { signal: controller.signal }).then((res) =>
          res.json()
        ),
        adminFetch("/api/admin/locations", { signal: controller.signal }).then((res) =>
          res.json()
        ),
      ]);

      if (cancelled) return;

      if (staffResult.status === "fulfilled" && Array.isArray(staffResult.value)) {
        setStaffOptions(staffResult.value);
      } else {
        setStaffOptions([]);
      }

      if (locationsResult.status === "fulfilled" && Array.isArray(locationsResult.value)) {
        setLocationOptions(locationsResult.value);
      } else {
        setLocationOptions([]);
      }
    };

    loadLists().catch(() => {
      if (!cancelled) {
        setStaffOptions([]);
        setLocationOptions([]);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [adminFetch]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, staffFilter, locationFilter, statusFilter, pageSize]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const loadTasks = async () => {
        setLoading(true);
        setNotice(null);
        try {
          const params = new URLSearchParams();
          if (searchQuery.trim()) params.set("q", searchQuery.trim());
          if (staffFilter !== "all") params.set("staffId", staffFilter);
          if (locationFilter !== "all") params.set("locationId", locationFilter);
          if (statusFilter !== "all") params.set("status", statusFilter);
          params.set("page", String(page));
          params.set("pageSize", String(pageSize));

          const res = await adminFetch(`/api/admin/side-tasks?${params.toString()}`, {
            signal: controller.signal,
          });
          const data = await res.json();
          if (!active) return;
          const nextTasks = Array.isArray(data?.tasks) ? data.tasks : [];
          setTasks(nextTasks);
          setTotal(Number.isFinite(data?.total) ? data.total : nextTasks.length);
        } catch (err) {
          if (!active) return;
          setNotice("Failed to load side tasks.");
          setTasks([]);
          setTotal(0);
        } finally {
          if (active) setLoading(false);
        }
      };

      loadTasks();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [adminFetch, searchQuery, staffFilter, locationFilter, statusFilter, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-pill">Side Tasks</p>
          <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
            Side Task List
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {total} {total === 1 ? "side task" : "side tasks"}
          </p>
        </div>
        <button
          onClick={() => {
            setSearchQuery("");
            setStaffFilter("all");
            setLocationFilter("all");
            setStatusFilter("all");
          }}
          className="crm-btn-outline"
        >
          Clear Filters
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {notice}
        </div>
      )}

      <div className="crm-toolbar">
        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Search</span>
          <input
            type="text"
            placeholder="Customer or phone"
            className="crm-input mt-2"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Staff</span>
          <select
            className="crm-select mt-2"
            value={staffFilter}
            onChange={(event) => setStaffFilter(event.target.value)}
          >
            <option value="all">All</option>
            {staffOptions.map((staff) => (
              <option key={staff._id} value={staff._id}>
                {staff.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Location</span>
          <select
            className="crm-select mt-2"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
          >
            <option value="all">All</option>
            {locationOptions.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Status</span>
          <select
            className="crm-select mt-2"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="crm-card">
          <p className="text-sm text-[color:var(--muted)]">No side tasks found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
          <table className="crm-table">
            <thead className="bg-white/70">
              <tr>
                <th className="crm-th">No.</th>
                <th className="crm-th">Customer</th>
                <th className="crm-th">Side Task Phone</th>
                <th className="crm-th">Location</th>
                <th className="crm-th">Staff</th>
                <th className="crm-th">Linked Main Date</th>
                <th className="crm-th">Trees</th>
                <th className="crm-th">Rate</th>
                <th className="crm-th">Total</th>
                <th className="crm-th">Completed</th>
                <th className="crm-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {tasks.map((task, index) => (
                <tr key={task._id} className="hover:bg-white/70">
                  <td className="crm-td text-[color:var(--muted)]">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="crm-td font-semibold text-[color:var(--ink)]">
                    {task.customer?.name || "-"}
                  </td>
                  <td className="crm-td">
                    {formatPhone(
                      task.sideTaskCustomerPhone || task.customer?.mobile
                    )}
                  </td>
                  <td className="crm-td">{task.location?.name || "-"}</td>
                  <td className="crm-td">{task.staff?.name || "-"}</td>
                  <td className="crm-td">{task.parentTask?.serviceDate || "-"}</td>
                  <td className="crm-td">{task.numberOfTrees ?? "-"}</td>
                  <td className="crm-td">Rs. {task.ratePerTree ?? 0}</td>
                  <td className="crm-td font-semibold">Rs. {task.totalAmount ?? 0}</td>
                  <td className="crm-td">
                    {task.completedDate
                      ? new Date(task.completedDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="crm-td">
                    <span
                      className={
                        task.status === "completed"
                          ? "crm-badge-success"
                          : "crm-badge-warning"
                      }
                    >
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
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
