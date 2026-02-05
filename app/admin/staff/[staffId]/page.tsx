"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Task = {
  _id: string;
  customer: { name: string };
  location: { name: string };
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: string;
  createdAt: string;
};

type EditForm = {
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
    setEditForm({
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

    if (!Number.isFinite(trees) || !Number.isFinite(rate)) {
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
        }),
      });

      setTasks((prev) =>
        prev.map((task) => {
          if (task._id !== editingId) return task;
          return {
            ...task,
            numberOfTrees: trees,
            ratePerTree: rate,
            totalAmount: trees * rate,
            status: editForm.status,
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staff Task History</h1>

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

      {tasks.length === 0 && <p>No tasks found for this staff.</p>}

      {tasks.map((task) => (
        <div
          key={task._id}
          className="border rounded p-4 mb-4 bg-white shadow"
        >
          <p>
            <b>Customer:</b> {task.customer?.name}
          </p>
          <p>
            <b>Location:</b> {task.location?.name}
          </p>
          <p>
            <b>Trees:</b> {task.numberOfTrees}
          </p>
          <p>
            <b>Rate:</b> Rs. {task.ratePerTree}
          </p>
          <p>
            <b>Total:</b> Rs. {task.totalAmount}
          </p>
          <p>
            <b>Status:</b>{" "}
            <span
              className={
                task.status === "completed" ? "text-green-600" : "text-orange-600"
              }
            >
              {task.status}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            {new Date(task.createdAt).toLocaleString()}
          </p>

          <div className="mt-3 flex items-center gap-4">
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

          {editingId === task._id && editForm && (
            <div className="mt-4 rounded border bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-4">
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
                          ? { ...prev, numberOfTrees: event.target.value }
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
                          ? { ...prev, ratePerTree: event.target.value }
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
