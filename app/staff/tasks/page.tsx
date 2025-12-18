"use client";

import { useEffect, useState } from "react";

interface Task {
  _id: string;
  customer?: {
    name: string;
  };
  location?: {
    name: string;
  };
  numberOfTrees?: number;
  ratePerTree?: number;
  status: "pending" | "completed";
}

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/tasks")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          console.error("Tasks API error:", data);
          setTasks([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setTasks([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="p-6">Loading tasks...</p>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Tasks</h1>

      {tasks.length === 0 && (
        <p className="text-gray-500">No tasks assigned.</p>
      )}

      {tasks.map((task, index) => (
        <div
          key={task._id}
          className="border p-4 rounded mb-4 bg-white shadow"
        >
          <p>
            <b>Customer:</b> {task.customer?.name || "—"}
          </p>

          <p>
            <b>Location:</b> {task.location?.name || "—"}
          </p>

          {/* Number of Trees */}
          <div className="mt-3">
            <label className="block text-sm font-medium">
              Number of Trees
            </label>
            <input
              type="number"
              disabled={task.status === "completed"}
              className="border p-2 rounded w-full"
              value={task.numberOfTrees ?? ""}
              onChange={e => {
                const value =
                  e.target.value === ""
                    ? undefined
                    : Number(e.target.value);

                setTasks(prev =>
                  prev.map((t, i) =>
                    i === index ? { ...t, numberOfTrees: value } : t
                  )
                );
              }}
            />
          </div>

          {/* Rate */}
          <div className="mt-3">
            <label className="block text-sm font-medium">
              Rate per Tree
            </label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={task.ratePerTree ?? ""}
              disabled={task.status === "completed"}
              onChange={e => {
                const value =
                  e.target.value === ""
                    ? undefined
                    : Number(e.target.value);

                setTasks(prev =>
                  prev.map((t, i) =>
                    i === index ? { ...t, ratePerTree: value } : t
                  )
                );
              }}
            />
          </div>

          {/* Status */}
          <div className="mt-3">
            <p>
              <b>Status:</b>{" "}
              <span
                className={
                  task.status === "completed"
                    ? "text-green-600"
                    : "text-orange-600"
                }
              >
                {task.status}
              </span>
            </p>
          </div>

          {/* Complete Button */}
          {task.status !== "completed" && (
            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={async () => {
                const res = await fetch("/api/staff/complete-task", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ taskId: task._id }),
                });

                const data = await res.json();

                if (data.success) {
                  setTasks(prev =>
                    prev.map(t =>
                      t._id === task._id
                        ? { ...t, status: "completed" }
                        : t
                    )
                  );
                } else {
                  alert(data.error || "Failed to complete task");
                }
              }}
            >
              Mark as Completed
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
