"use client";

import { useEffect, useState } from "react";

type Task = {
  _id: string;
  customer: { name: string };
  location: { name: string };
  numberOfTrees: number;
  ratePerTree: number;
  status: string;
};

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // TEMP — until OTP auth is ready
  const STAFF_ID = "6943aecda0c1ebef23e82f72";

  useEffect(() => {
    fetch(`/api/staff/tasks?staffId=${STAFF_ID}`)
      .then(res => res.json())
      .then(data => setTasks(Array.isArray(data) ? data : []));
  }, []);

  async function markCompleted(task: Task) {
    if (task.status === "completed") {
      alert("Already completed. Contact admin.");
      return;
    }

    const res = await fetch("/api/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task._id,
        numberOfTrees: task.numberOfTrees,
        ratePerTree: task.ratePerTree,
        role: "staff"
      }),
    });

    const data = await res.json();
    if (!res.ok) alert(data.error);
    else alert("Task completed");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Tasks</h1>

      {tasks.map(task => (
        <div key={task._id} className="border p-4 mb-4 rounded">
          <p><b>Customer:</b> {task.customer.name}</p>
          <p><b>Location:</b> {task.location.name}</p>

          <label>Trees</label>
          <input
            type="number"
            value={task.numberOfTrees ?? 0}
            className="border block mb-2"
            onChange={e =>
              setTasks(prev =>
                prev.map(t =>
                  t._id === task._id
                    ? { ...t, numberOfTrees: +e.target.value }
                    : t
                )
              )
            }
          />

          <label>Rate</label>
          <input
            type="number"
            value={task.ratePerTree ?? 0}
            className="border block mb-2"
            onChange={e =>
              setTasks(prev =>
                prev.map(t =>
                  t._id === task._id
                    ? { ...t, ratePerTree: +e.target.value }
                    : t
                )
              )
            }
          />

          <button
            onClick={() => markCompleted(task)}
            className="bg-green-600 text-white px-4 py-1 rounded"
          >
            Mark Completed
          </button>
        </div>
      ))}
    </div>
  );
}
