"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Entity = {
  _id: string;
  name: string;
  mobile?: string;
};

type Task = {
  _id: string;
  customer?: Entity;
  location?: Entity;
  staff?: Entity;
  serviceDate?: string;
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: "pending" | "completed" | string;
};

type EditForm = {
  staffId: string;
  locationId: string;
  numberOfTrees: string;
  ratePerTree: string;
  status: "pending" | "completed";
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffOptions, setStaffOptions] = useState<Entity[]>([]);
  const [locationOptions, setLocationOptions] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<"pending" | "completed">(
    "pending"
  );
  const [bulkSaving, setBulkSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
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
    const timer = setTimeout(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          const searchParam = searchQuery.trim()
            ? `?q=${encodeURIComponent(searchQuery.trim())}`
            : "";
          const [tasksRes, staffRes, locationsRes] = await Promise.all([
            adminFetch(`/api/admin/tasks${searchParam}`),
            adminFetch("/api/admin/staff"),
            adminFetch("/api/admin/locations"),
          ]);

          const [tasksData, staffData, locationsData] = await Promise.all([
            tasksRes.json(),
            staffRes.json(),
            locationsRes.json(),
          ]);

          if (!active) return;

          setTasks(Array.isArray(tasksData) ? tasksData : []);
          setStaffOptions(Array.isArray(staffData) ? staffData : []);
          setLocationOptions(Array.isArray(locationsData) ? locationsData : []);
          setSelectedIds(new Set());
        } catch (err) {
          console.error("Admin tasks fetch error", err);
          if (!active) return;
          setTasks([]);
          setStaffOptions([]);
          setLocationOptions([]);
        } finally {
          if (active) setLoading(false);
        }
      };

      loadData();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [adminFetch, searchQuery]);

  const startEdit = (task: Task) => {
    setEditingId(task._id);
    setNotice(null);
    setEditForm({
      staffId: task.staff?._id || "",
      locationId: task.location?._id || "",
      numberOfTrees: String(task.numberOfTrees ?? ""),
      ratePerTree: String(task.ratePerTree ?? ""),
      status: task.status === "completed" ? "completed" : "pending",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setNotice(null);
  };

  const previewTotal = useMemo(() => {
    if (!editForm) return 0;
    const trees = Number(editForm.numberOfTrees);
    const rate = Number(editForm.ratePerTree);
    if (!Number.isFinite(trees) || !Number.isFinite(rate)) return 0;
    return trees * rate;
  }, [editForm]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (staffFilter !== "all" && task.staff?._id !== staffFilter) {
        return false;
      }
      if (locationFilter !== "all" && task.location?._id !== locationFilter) {
        return false;
      }
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, staffFilter, locationFilter, statusFilter]);

  const allVisibleSelected =
    filteredTasks.length > 0 &&
    filteredTasks.every((task) => selectedIds.has(task._id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredTasks.forEach((task) => next.delete(task._id));
      } else {
        filteredTasks.forEach((task) => next.add(task._id));
      }
      return next;
    });
  };

  const toggleSelectOne = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const applyBulkStatus = async () => {
    if (selectedIds.size === 0) return;
    const confirmMessage = `Update ${selectedIds.size} task${
      selectedIds.size === 1 ? "" : "s"
    } to ${bulkStatus}?`;
    if (!window.confirm(confirmMessage)) return;
    setBulkSaving(true);
    setNotice(null);
    setSuccess(null);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((taskId) =>
          adminFetch("/api/admin/tasks/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId,
              status: bulkStatus,
            }),
          })
        )
      );

      setTasks((prev) =>
        prev.map((task) =>
          selectedIds.has(task._id)
            ? { ...task, status: bulkStatus }
            : task
        )
      );
      setSelectedIds(new Set());
      setSuccess("Bulk status updated.");
    } catch (err) {
      console.error("Bulk update error", err);
      setNotice("Bulk update failed. Please try again.");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    setNotice(null);
    setSuccess(null);
    try {
      await adminFetch("/api/admin/tasks/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      if (editingId === taskId) {
        cancelEdit();
      }
      setSuccess("Task deleted.");
    } catch (err) {
      console.error("Delete task error", err);
      setNotice("Delete failed. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!editingId || !editForm) return;

    const trees = Number(editForm.numberOfTrees);
    const rate = Number(editForm.ratePerTree);

    if (
      !editForm.staffId ||
      !editForm.locationId ||
      !Number.isFinite(trees) ||
      !Number.isFinite(rate)
    ) {
      setNotice("Please fill all fields with valid values.");
      return;
    }

    setSavingId(editingId);
    setNotice(null);
    setSuccess(null);

    try {
      await adminFetch("/api/admin/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: editingId,
          staffId: editForm.staffId,
          locationId: editForm.locationId,
          numberOfTrees: trees,
          ratePerTree: rate,
          status: editForm.status,
        }),
      });

      const nextStaff =
        staffOptions.find((staff) => staff._id === editForm.staffId) || null;
      const nextLocation =
        locationOptions.find((location) => location._id === editForm.locationId) ||
        null;

      setTasks((prev) =>
        prev.map((task) => {
          if (task._id !== editingId) return task;
          return {
            ...task,
            numberOfTrees: trees,
            ratePerTree: rate,
            totalAmount: trees * rate,
            status: editForm.status,
            staff: nextStaff || task.staff,
            location: nextLocation || task.location,
          };
        })
      );

      cancelEdit();
      setSuccess("Task updated.");
    } catch (err) {
      console.error("Admin task update error", err);
      setNotice("Update failed. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-pill">Task Control</p>
          <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
            All Tasks
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {filteredTasks.length}{" "}
            {filteredTasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        <label className="block w-full md:max-w-xs">
          <span className="crm-label">Search</span>
          <input
            type="text"
            placeholder="Customer name or mobile"
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

      <div className="crm-toolbar">
        <span className="text-xs font-semibold text-[color:var(--muted)]">
          {selectedIds.size} selected
        </span>
        <label className="block w-full max-w-[180px]">
          <span className="crm-label">Bulk status</span>
          <select
            className="crm-select mt-2"
            value={bulkStatus}
            onChange={(event) =>
              setBulkStatus(
                event.target.value === "completed" ? "completed" : "pending"
              )
            }
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <button
          onClick={applyBulkStatus}
          disabled={selectedIds.size === 0 || bulkSaving}
          className="crm-btn-primary disabled:opacity-60"
        >
          {bulkSaving ? "Updating..." : "Apply"}
        </button>
        <button
          onClick={() => setSelectedIds(new Set())}
          disabled={selectedIds.size === 0}
          className="crm-btn-outline disabled:opacity-60"
        >
          Clear selection
        </button>
      </div>

      {tasks.length === 0 && (
        <div className="crm-card">
          <p className="text-sm text-[color:var(--muted)]">No tasks found</p>
        </div>
      )}
      {tasks.length > 0 && filteredTasks.length === 0 && (
        <div className="crm-card">
          <p className="text-sm text-[color:var(--muted)]">
            No tasks match the filters.
          </p>
        </div>
      )}

      {filteredTasks.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
          <table className="crm-table">
            <thead className="bg-white/70">
              <tr>
                <th className="crm-th">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                  />
                </th>
                <th className="crm-th">No.</th>
                <th className="crm-th">Customer</th>
                <th className="crm-th">Phone</th>
                <th className="crm-th">Location</th>
                <th className="crm-th">Service due</th>
                <th className="crm-th">Staff</th>
                <th className="crm-th">Trees</th>
                <th className="crm-th">Rate</th>
                <th className="crm-th">Total</th>
                <th className="crm-th">Status</th>
                <th className="crm-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {filteredTasks.map((task, index) => (
                <Fragment key={task._id}>
                  <tr className="hover:bg-white/70">
                    <td className="crm-td">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task._id)}
                        onChange={() => toggleSelectOne(task._id)}
                      />
                    </td>
                    <td className="crm-td text-[color:var(--muted)]">
                      {index + 1}
                    </td>
                    <td className="crm-td font-semibold text-[color:var(--ink)]">
                      {task.customer?.name || "-"}
                    </td>
                    <td className="crm-td">{task.customer?.mobile || "-"}</td>
                    <td className="crm-td">{task.location?.name || "-"}</td>
                    <td className="crm-td">{task.serviceDate || "-"}</td>
                    <td className="crm-td">{task.staff?.name || "-"}</td>
                    <td className="crm-td">{task.numberOfTrees}</td>
                    <td className="crm-td">Rs. {task.ratePerTree}</td>
                    <td className="crm-td font-semibold">
                      Rs. {task.totalAmount}
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
                    <td className="crm-td">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEdit(task)}
                          className="text-[color:var(--brand)] hover:text-[color:var(--brand-dark)] font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editingId === task._id && editForm && (
                    <tr className="bg-white/70">
                      <td colSpan={12} className="px-4 py-4">
                        <div className="grid gap-3 md:grid-cols-6">
                          <label className="block">
                            <span className="crm-label">Staff</span>
                            <select
                              className="crm-select mt-2"
                              value={editForm.staffId}
                              onChange={(event) =>
                                setEditForm((prev) =>
                                  prev
                                    ? { ...prev, staffId: event.target.value }
                                    : prev
                                )
                              }
                            >
                              <option value="">Select</option>
                              {staffOptions.map((staff) => (
                                <option key={staff._id} value={staff._id}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="crm-label">Location</span>
                            <select
                              className="crm-select mt-2"
                              value={editForm.locationId}
                              onChange={(event) =>
                                setEditForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        locationId: event.target.value,
                                      }
                                    : prev
                                )
                              }
                            >
                              <option value="">Select</option>
                              {locationOptions.map((location) => (
                                <option key={location._id} value={location._id}>
                                  {location.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="crm-label">Trees</span>
                            <input
                              type="number"
                              min={0}
                              className="crm-input mt-2"
                              value={editForm.numberOfTrees}
                              onChange={(event) =>
                                setEditForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        numberOfTrees: event.target.value,
                                      }
                                    : prev
                                )
                              }
                            />
                          </label>

                          <label className="block">
                            <span className="crm-label">Rate</span>
                            <input
                              type="number"
                              min={0}
                              className="crm-input mt-2"
                              value={editForm.ratePerTree}
                              onChange={(event) =>
                                setEditForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        ratePerTree: event.target.value,
                                      }
                                    : prev
                                )
                              }
                            />
                          </label>

                          <label className="block">
                            <span className="crm-label">Status</span>
                            <select
                              className="crm-select mt-2"
                              value={editForm.status}
                              onChange={(event) =>
                                setEditForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        status:
                                          event.target.value === "completed"
                                            ? "completed"
                                            : "pending",
                                      }
                                    : prev
                                )
                              }
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                            </select>
                          </label>

                          <div>
                            <span className="crm-label">Total</span>
                            <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                              Rs. {previewTotal}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            onClick={handleSave}
                            disabled={savingId === editingId}
                            className="crm-btn-primary disabled:opacity-60"
                          >
                            {savingId === editingId
                              ? "Saving..."
                              : "Save changes"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="crm-btn-outline"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
