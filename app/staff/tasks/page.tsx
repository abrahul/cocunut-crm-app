"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone, formatPhoneInput, normalizePhoneDigits } from "@/lib/formatPhone";

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

type SideTaskInput = {
  enabled: boolean;
  customerPhone: string;
  numberOfTrees: string;
  ratePerTree: string;
};

const formatCoordinate = (
  value: number,
  positiveLabel: "N" | "E",
  negativeLabel: "S" | "W"
) => {
  const direction = value < 0 ? negativeLabel : positiveLabel;
  return `${Math.abs(value)} ${direction}`;
};

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sideTaskInputs, setSideTaskInputs] = useState<
    Record<string, SideTaskInput>
  >({});
  const [drafts, setDrafts] = useState<
    Record<
      string,
      { numberOfTrees: string; ratePerTree: string; dirty: boolean }
    >
  >({});
  const router = useRouter();

  const loadTasks = useCallback(async () => {
    const res = await fetch("/api/staff/tasks", { cache: "no-store" });

    if (res.status === 401) {
      router.push("/staff/login");
      return;
    }

    const data = await res.json();
    const nextTasks = Array.isArray(data) ? data : [];
    setTasks(nextTasks);
    setDrafts((prev) => {
      const next: Record<
        string,
        { numberOfTrees: string; ratePerTree: string; dirty: boolean }
      > = {};
      nextTasks.forEach((task) => {
        const prevDraft = prev[task._id];
        const shouldUseServer =
          task.status === "completed" || !prevDraft?.dirty;
        if (shouldUseServer) {
          next[task._id] = {
            numberOfTrees: String(task.numberOfTrees ?? ""),
            ratePerTree: String(task.ratePerTree ?? ""),
            dirty: false,
          };
        } else {
          next[task._id] = prevDraft;
        }
      });
      return next;
    });
    setSideTaskInputs((prev) => {
      const next: Record<string, SideTaskInput> = {};
      nextTasks.forEach((task) => {
        next[task._id] = prev[task._id] || {
          enabled: false,
          customerPhone: "",
          numberOfTrees: "",
          ratePerTree: "",
        };
      });
      return next;
    });
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
    const sideInput = sideTaskInputs[task._id];
    let sideTaskPayload:
      | {
          customerPhone?: string;
          numberOfTrees: number;
          ratePerTree: number;
        }
      | undefined;

    const draft = drafts[task._id];
    const treesValue =
      draft?.numberOfTrees !== undefined ? draft.numberOfTrees : String(task.numberOfTrees);
    const rateValue =
      draft?.ratePerTree !== undefined ? draft.ratePerTree : String(task.ratePerTree);
    const numberOfTrees = Number(treesValue);
    const ratePerTree = Number(rateValue);

    if (sideInput?.enabled) {
      const sideTrees = Number(sideInput.numberOfTrees);
      const sideRate = Number(sideInput.ratePerTree);
      if (
        !Number.isFinite(sideTrees) ||
        !Number.isFinite(sideRate) ||
        sideTrees < 0 ||
        sideRate < 0
      ) {
        alert("Please enter valid side task trees and rate");
        return;
      }

      sideTaskPayload = {
        numberOfTrees: sideTrees,
        ratePerTree: sideRate,
      };

      const normalizedSidePhone = normalizePhoneDigits(sideInput.customerPhone);
      if (normalizedSidePhone) {
        sideTaskPayload.customerPhone = normalizedSidePhone;
      }
    }

    const res = await fetch("/api/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task._id,
        numberOfTrees,
        ratePerTree,
        sideTask: sideTaskPayload,
        action: "complete",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to update task");
      return;
    }

    alert("Task completed");
    setDrafts((prev) => ({
      ...prev,
      [task._id]: {
        numberOfTrees: String(numberOfTrees),
        ratePerTree: String(ratePerTree),
        dirty: false,
      },
    }));
    setSideTaskInputs((prev) => ({
      ...prev,
      [task._id]: {
        enabled: false,
        customerPhone: "",
        numberOfTrees: "",
        ratePerTree: "",
      },
    }));
    await loadTasks();
  }

  async function markNotCompleted(task: Task) {
    const res = await fetch("/api/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task._id,
        action: "not_completed",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to update task");
      return;
    }

    alert("Are you sure you want to mark this task as incomplete");
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
        {tasks.map((task) => {
          const draft = drafts[task._id];
          const treesValue =
            draft?.numberOfTrees ?? String(task.numberOfTrees ?? "");
          const rateValue =
            draft?.ratePerTree ?? String(task.ratePerTree ?? "");
          const total = (Number(treesValue) || 0) * (Number(rateValue) || 0);
          return (
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
                  Phone: {formatPhone(task.customerMobile)}
                </p>
                {task.customerAlternateMobile && (
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Alt Phone: {formatPhone(task.customerAlternateMobile)}
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
                      {formatCoordinate(task.latitude, "N", "S")},{" "}
                      {formatCoordinate(task.longitude, "E", "W")}
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
                  value={treesValue}
                  disabled={task.status === "completed"}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setDrafts((prev) => ({
                      ...prev,
                      [task._id]: {
                        numberOfTrees: nextValue,
                        ratePerTree:
                          prev[task._id]?.ratePerTree ??
                          String(task.ratePerTree ?? ""),
                        dirty: true,
                      },
                    }));
                  }}
                  className="crm-input mt-2"
                />
              </label>

              <label className="block">
                <span className="crm-label crm-label-required">Rate per tree</span>
                <input
                  type="number"
                  required
                  value={rateValue}
                  disabled={task.status === "completed"}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setDrafts((prev) => ({
                      ...prev,
                      [task._id]: {
                        numberOfTrees:
                          prev[task._id]?.numberOfTrees ??
                          String(task.numberOfTrees ?? ""),
                        ratePerTree: nextValue,
                        dirty: true,
                      },
                    }));
                  }}
                  className="crm-input mt-2"
                />
              </label>
            </div>

            {task.status !== "completed" && (
              <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-white/70 p-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!sideTaskInputs[task._id]?.enabled}
                    onChange={(event) =>
                      setSideTaskInputs((prev) => ({
                        ...prev,
                        [task._id]: {
                          ...(prev[task._id] || {
                            customerPhone: "",
                            numberOfTrees: "",
                            ratePerTree: "",
                          }),
                          enabled: event.target.checked,
                        } as SideTaskInput,
                      }))
                    }
                  />
                  <span className="crm-label">Add Side Task (Optional)</span>
                </label>

                {sideTaskInputs[task._id]?.enabled && (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="crm-label">Customer Phone (Optional)</span>
                      <input
                        type="text"
                        value={sideTaskInputs[task._id]?.customerPhone || ""}
                        onChange={(event) =>
                          setSideTaskInputs((prev) => ({
                            ...prev,
                            [task._id]: {
                              ...(prev[task._id] || {
                                enabled: true,
                                customerPhone: "",
                                numberOfTrees: "",
                                ratePerTree: "",
                              }),
                              customerPhone: formatPhoneInput(event.target.value),
                            },
                          }))
                        }
                        className="crm-input mt-2"
                      />
                    </label>

                    <label className="block">
                      <span className="crm-label crm-label-required">Side Trees</span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={sideTaskInputs[task._id]?.numberOfTrees || ""}
                        onChange={(event) =>
                          setSideTaskInputs((prev) => ({
                            ...prev,
                            [task._id]: {
                              ...(prev[task._id] || {
                                enabled: true,
                                customerPhone: "",
                                numberOfTrees: "",
                                ratePerTree: "",
                              }),
                              numberOfTrees: event.target.value,
                            },
                          }))
                        }
                        className="crm-input mt-2"
                      />
                    </label>

                    <label className="block">
                      <span className="crm-label crm-label-required">Side Rate</span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={sideTaskInputs[task._id]?.ratePerTree || ""}
                        onChange={(event) =>
                          setSideTaskInputs((prev) => ({
                            ...prev,
                            [task._id]: {
                              ...(prev[task._id] || {
                                enabled: true,
                                customerPhone: "",
                                numberOfTrees: "",
                                ratePerTree: "",
                              }),
                              ratePerTree: event.target.value,
                            },
                          }))
                        }
                        className="crm-input mt-2"
                      />
                    </label>
                  </div>
                )}

                {sideTaskInputs[task._id]?.enabled && (
                  <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">
                    Side Total: Rs.{" "}
                    {(Number(sideTaskInputs[task._id]?.numberOfTrees || 0) || 0) *
                      (Number(sideTaskInputs[task._id]?.ratePerTree || 0) || 0)}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                Total: Rs. {total}
              </p>

              {task.status !== "completed" && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => submitTask(task)}
                    className="crm-btn-primary"
                  >
                    Complete Task
                  </button>
                  <button
                    onClick={() => markNotCompleted(task)}
                    className="crm-btn-outline"
                  >
                    Not Completed
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
