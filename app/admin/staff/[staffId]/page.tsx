"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Task = {
  _id: string;
  customer: { name: string };
  location: { name: string };
  serviceDate?: string;
  completedDate?: string;
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: string;
  createdAt: string;
};

type EditForm = {
  serviceDate: string;
  completedDate: string;
  numberOfTrees: string;
  ratePerTree: string;
  status: "pending" | "completed";
};

export default function StaffTaskHistoryPage() {
  const { staffId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    adminFetch(`/api/admin/staff/${staffId}/tasks`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        setTasks(data);
      });
  }, [adminFetch, staffId]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const startEdit = (task: Task) => {
    setEditingId(task._id);
    setNotice(null);
    const completedDateValue = task.completedDate
      ? new Date(task.completedDate).toISOString().slice(0, 10)
      : "";
    setEditForm({
      serviceDate: task.serviceDate || "",
      completedDate: completedDateValue,
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

    if (!editForm.serviceDate || !Number.isFinite(trees) || !Number.isFinite(rate)) {
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
          numberOfTrees: trees,
          ratePerTree: rate,
          status: editForm.status,
          serviceDate: editForm.serviceDate,
          completedDate: editForm.completedDate,
        }),
      });

      setTasks((prev) =>
        prev.map((task) => {
          if (task._id !== editingId) return task;
          const nextCompletedDate =
            editForm.status === "completed"
              ? editForm.completedDate || task.completedDate || new Date().toISOString()
              : undefined;
          return {
            ...task,
            numberOfTrees: trees,
            ratePerTree: rate,
            totalAmount: trees * rate,
            status: editForm.status,
            serviceDate: editForm.serviceDate,
            completedDate: nextCompletedDate,
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

  return (
    <div className="space-y-6">
      <div>
        <p className="crm-pill">Staff History</p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
          Staff Task History
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Review completed work and update pending task details.
        </p>
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

      {tasks.length === 0 && (
        <div className="crm-card">
          <p className="text-sm text-[color:var(--muted)]">
            No tasks found for this staff.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task._id} className="crm-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="crm-label">Customer</p>
                <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                  {task.customer?.name}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {task.location?.name}
                </p>
              </div>
              <span
                className={
                  task.status === "completed"
                    ? "crm-badge-success"
                    : "crm-badge-warning"
                }
              >
                {task.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="crm-label">Trees</span>
                <p className="mt-1 font-semibold text-[color:var(--ink)]">
                  {task.numberOfTrees}
                </p>
              </div>
              <div>
                <span className="crm-label">Rate</span>
                <p className="mt-1 font-semibold text-[color:var(--ink)]">
                  Rs. {task.ratePerTree}
                </p>
              </div>
              <div>
                <span className="crm-label">Total</span>
                <p className="mt-1 font-semibold text-[color:var(--ink)]">
                  Rs. {task.totalAmount}
                </p>
              </div>
              <div>
                <span className="crm-label">Created</span>
                <p className="mt-1 text-[color:var(--muted)]">
                  {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="crm-label">Service due</span>
                <p className="mt-1 text-[color:var(--muted)]">
                  {task.serviceDate || "-"}
                </p>
              </div>
              <div>
                <span className="crm-label">Completed on</span>
                <p className="mt-1 text-[color:var(--muted)]">
                  {task.completedDate
                    ? new Date(task.completedDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
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

            {editingId === task._id && editForm && (
              <div className="mt-5 rounded-2xl border border-[color:var(--border)] bg-white/70 p-4">
              <div className="grid gap-3 md:grid-cols-6">
                <label className="block">
                  <span className="crm-label">Service due</span>
                  <input
                    type="date"
                    className="crm-input mt-2"
                    value={editForm.serviceDate}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, serviceDate: event.target.value }
                          : prev
                      )
                    }
                  />
                </label>

                <label className="block">
                  <span className="crm-label">Completed on</span>
                  <input
                    type="date"
                    className="crm-input mt-2"
                    value={editForm.completedDate}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, completedDate: event.target.value }
                          : prev
                      )
                    }
                    disabled={editForm.status !== "completed"}
                  />
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
                            ? { ...prev, numberOfTrees: event.target.value }
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
                            ? { ...prev, ratePerTree: event.target.value }
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
                    {savingId === editingId ? "Saving..." : "Save changes"}
                  </button>
                  <button onClick={cancelEdit} className="crm-btn-outline">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
