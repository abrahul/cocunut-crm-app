"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Task = {
  _id: string;
  customerName: string;
  customerMobile: string;
  customerAlternateMobile?: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  location: string;
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: string;
};

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();

  const loadTasks = useCallback(async () => {
    const res = await fetch("/api/staff/tasks", { cache: "no-store" });

    if (res.status === 401) {
      router.push("/staff/login");
      return;
    }

    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  }, [router]);

  useEffect(() => {
    const initialLoadTimeout = window.setTimeout(() => {
      void loadTasks();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadTasks();
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadTasks();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(initialLoadTimeout);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadTasks]);

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
    await loadTasks();
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
            localStorage.removeItem("staffName");
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
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Phone: {task.customerMobile || "-"}
                </p>
                {task.customerAlternateMobile && (
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Alt Phone: {task.customerAlternateMobile}
                  </p>
                )}
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Address: {task.address || "-"}
                </p>
                {typeof task.latitude === "number" &&
                  typeof task.longitude === "number" && (
                    <a
                      href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-blue-600 underline"
                    >
                      {task.latitude}, {task.longitude}
                    </a>
                  )}
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
                <span className="crm-label crm-label-required">Trees</span>
                <input
                  type="number"
                  required
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
                <span className="crm-label crm-label-required">Rate per tree</span>
                <input
                  type="number"
                  required
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
