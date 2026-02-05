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
        staffOptions.find((staff) => staff._id === editForm.staffId) ||
        null;
      const nextLocation =
        locationOptions.find(
          (location) => location._id === editForm.locationId
        ) || null;

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">All Tasks</h1>
        <p className="text-sm text-gray-500">
          {filteredTasks.length}{" "}
          {filteredTasks.length === 1 ? "task" : "tasks"}
        </p>
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

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-gray-600">
            Search
            <input
              type="text"
              placeholder="Customer name or mobile"
              className="mt-1 w-56 rounded border px-2 py-1"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <label className="text-xs font-semibold text-gray-600">
            Staff
            <select
              className="mt-1 w-48 rounded border px-2 py-1"
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

          <label className="text-xs font-semibold text-gray-600">
            Location
            <select
              className="mt-1 w-48 rounded border px-2 py-1"
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

          <label className="text-xs font-semibold text-gray-600">
            Status
            <select
              className="mt-1 w-40 rounded border px-2 py-1"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <button
            onClick={() => {
              setSearchQuery("");
              setStaffFilter("all");
              setLocationFilter("all");
              setStatusFilter("all");
            }}
            className="rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-white"
          >
            Clear filters
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <span className="text-xs font-semibold text-gray-600">
            {selectedIds.size} selected
          </span>
          <label className="text-xs font-semibold text-gray-600">
            Bulk status
            <select
              className="mt-1 w-40 rounded border px-2 py-1"
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
            className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {bulkSaving ? "Updating..." : "Apply"}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            disabled={selectedIds.size === 0}
            className="rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-60"
          >
            Clear selection
          </button>
        </div>
      </div>

      {tasks.length === 0 && <p className="text-gray-500">No tasks found</p>}
      {tasks.length > 0 && filteredTasks.length === 0 && (
        <p className="text-gray-500">No tasks match the filters.</p>
      )}

      {filteredTasks.length > 0 && (
        <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold">No.</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-left font-semibold">Location</th>
                <th className="px-4 py-3 text-left font-semibold">Staff</th>
                <th className="px-4 py-3 text-left font-semibold">Trees</th>
                <th className="px-4 py-3 text-left font-semibold">Rate</th>
                <th className="px-4 py-3 text-left font-semibold">Total</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTasks.map((task, index) => (
                <Fragment key={task._id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task._id)}
                        onChange={() => toggleSelectOne(task._id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {task.customer?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {task.customer?.mobile || "-"}
                    </td>
                    <td className="px-4 py-3">{task.location?.name || "-"}</td>
                    <td className="px-4 py-3">{task.staff?.name || "-"}</td>
                    <td className="px-4 py-3">{task.numberOfTrees}</td>
                    <td className="px-4 py-3">Rs. {task.ratePerTree}</td>
                    <td className="px-4 py-3 font-semibold">
                      Rs. {task.totalAmount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          task.status === "completed"
                            ? "inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                            : "inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700"
                        }
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEdit(task)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editingId === task._id && editForm && (
                    <tr className="bg-slate-50">
                      <td colSpan={10} className="px-4 py-4">
                        <div className="grid gap-3 md:grid-cols-6">
                          <label className="text-xs font-semibold text-gray-600">
                            Staff
                            <select
                              className="mt-1 w-full rounded border px-2 py-1"
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

                          <label className="text-xs font-semibold text-gray-600">
                            Location
                            <select
                              className="mt-1 w-full rounded border px-2 py-1"
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

                          <label className="text-xs font-semibold text-gray-600">
                            Trees
                            <input
                              type="number"
                              min={0}
                              className="mt-1 w-full rounded border px-2 py-1"
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

                          <label className="text-xs font-semibold text-gray-600">
                            Rate
                            <input
                              type="number"
                              min={0}
                              className="mt-1 w-full rounded border px-2 py-1"
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

                          <label className="text-xs font-semibold text-gray-600">
                            Status
                            <select
                              className="mt-1 w-full rounded border px-2 py-1"
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

                          <div className="text-xs font-semibold text-gray-600">
                            Total
                            <div className="mt-2 text-sm text-gray-900">
                              Rs. {previewTotal}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            onClick={handleSave}
                            disabled={savingId === editingId}
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            {savingId === editingId ? "Saving..." : "Save changes"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
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
