"use client";

import { useEffect, useState } from "react";
import { getAuthUser } from "@/lib/authClient";

type Task = {
  _id: string;
  customerName: string;
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: "pending" | "completed";
};

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const auth = getAuthUser();

  useEffect(() => {
    fetch("/api/staff/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch(() => alert("Failed to load tasks"));
  }, []);

  async function updateTask(task: Task, complete = false) {
    if (!auth) {
      alert("Not logged in");
      return;
    }

    if (task.status === "completed") {
      alert("Task already completed. Contact admin for changes.");
      return;
    }

    const res = await fetch("/api/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task._id,
        numberOfTrees: task.numberOfTrees,
        ratePerTree: task.ratePerTree,
        complete,
        userId: auth.userId,
        role: auth.role, // "staff"
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert(complete ? "Task completed" : "Task saved");

    setTasks((prev) =>
      prev.map((t) =>
        t._id === task._id
          ? {
              ...t,
              status: complete ? "completed" : t.status,
            }
          : t
      )
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>

      {tasks.length === 0 && (
        <p className="text-gray-500">No tasks assigned</p>
      )}

      {tasks.map((task) => (
        <div
          key={task._id}
          className="border rounded p-4 mb-4 shadow-sm"
        >
          <p className="font-semibold mb-2">
            Customer: {task.customerName}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm">Trees</label>
              <input
                type="number"
                disabled={task.status === "completed"}
                value={task.numberOfTrees ?? 0}
                onChange={(e) =>
                  setTasks((prev) =>
                    prev.map((t) =>
                      t._id === task._id
                        ? { ...t, numberOfTrees: +e.target.value }
                        : t
                    )
                  )
                }
                className="border px-2 py-1 w-full"
              />
            </div>

            <div>
              <label className="block text-sm">Rate</label>
              <input
                type="number"
                disabled={task.status === "completed"}
                value={task.ratePerTree ?? 0}
                onChange={(e) =>
                  setTasks((prev) =>
                    prev.map((t) =>
                      t._id === task._id
                        ? { ...t, ratePerTree: +e.target.value }
                        : t
                    )
                  )
                }
                className="border px-2 py-1 w-full"
              />
            </div>
          </div>

          {task.status === "completed" ? (
            <p className="text-green-600 font-semibold">
              ✅ Completed
            </p>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => updateTask(task)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>

              <button
                onClick={() => {
                  if (
                    confirm(
                      "Mark this task as completed? You won't be able to edit it."
                    )
                  ) {
                    updateTask(task, true);
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Complete Task
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
