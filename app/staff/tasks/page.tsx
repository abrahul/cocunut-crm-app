"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Task = {
  _id: string;
  customerName: string;
  location: string;
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: string;
};

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadTasks() {
      const res = await fetch("/api/staff/tasks");

      if (res.status === 401) {
        router.push("/staff/login");
        return;
      }

      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    }

    loadTasks();
  }, [router]);

  async function submitTask(task: Task) {
    const res = await fetch("/api/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task._id,
        numberOfTrees: task.numberOfTrees,
        ratePerTree: task.ratePerTree,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to update task");
      return;
    }

    alert("Task completed");
    setTasks((prev) => prev.filter((item) => item._id !== task._id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-pill">Today</p>
          <h1 className="mt-3 text-2xl font-semibold text-[color:var(--ink)]">
            My Tasks
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Update your tree counts and mark tasks as complete.
          </p>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/staff/login";
          }}
          className="crm-btn-outline"
        >
          Logout
        </button>
      </div>

      {tasks.length === 0 && (
        <div className="crm-card">
          <p className="text-sm text-[color:var(--muted)]">
            No tasks assigned yet.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {tasks.map((task, index) => (
          <div key={task._id} className="crm-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="crm-label">Customer</p>
                <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                  {task.customerName}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {task.location}
                </p>
              </div>
              <span
                className={
                  task.status === "completed"
                    ? "crm-badge-success"
                    : "crm-badge-warning"
                }
              >
                {task.status === "completed" ? "Completed" : "In progress"}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="crm-label">Trees</span>
                <input
                  type="number"
                  value={task.numberOfTrees}
                  disabled={task.status === "completed"}
                  onChange={(e) => {
                    const updated = [...tasks];
                    updated[index].numberOfTrees = Number(e.target.value);
                    setTasks(updated);
                  }}
                  className="crm-input mt-2"
                />
              </label>

              <label className="block">
                <span className="crm-label">Rate per tree</span>
                <input
                  type="number"
                  value={task.ratePerTree}
                  disabled={task.status === "completed"}
                  onChange={(e) => {
                    const updated = [...tasks];
                    updated[index].ratePerTree = Number(e.target.value);
                    setTasks(updated);
                  }}
                  className="crm-input mt-2"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                Total: Rs. {task.numberOfTrees * task.ratePerTree}
              </p>

              {task.status !== "completed" && (
                <button
                  onClick={() => submitTask(task)}
                  className="crm-btn-primary"
                >
                  Complete Task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
