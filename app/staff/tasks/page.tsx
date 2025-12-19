"use client";

import { useEffect, useState } from "react";
import { getAuthUser } from "@/lib/authClient";

type Task = {
  _id: string;
  customerName: string;
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: string;
};

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const auth = getAuthUser();

  useEffect(() => {
    fetch("/api/tasks/my")
      .then((res) => res.json())
      .then(setTasks);
  }, []);

  async function updateTask(task: Task) {
    if (!auth) return alert("Not logged in");

    const res = await fetch("/api/tasks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task._id,
        numberOfTrees: task.numberOfTrees,
        ratePerTree: task.ratePerTree,
        userId: auth.userId,
        role: auth.role, // "staff"
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
    } else {
      alert("Task updated");
    }
  }

  return (
    <div>
      <h1>My Tasks</h1>

      {tasks.map((task) => (
        <div key={task._id} style={{ border: "1px solid #ccc", padding: 10 }}>
          <p>{task.customerName}</p>

          <input
            type="number"
            value={task.numberOfTrees}
            onChange={(e) =>
              setTasks((prev) =>
                prev.map((t) =>
                  t._id === task._id
                    ? { ...t, numberOfTrees: +e.target.value }
                    : t
                )
              )
            }
          />

          <input
            type="number"
            value={task.ratePerTree}
            onChange={(e) =>
              setTasks((prev) =>
                prev.map((t) =>
                  t._id === task._id
                    ? { ...t, ratePerTree: +e.target.value }
                    : t
                )
              )
            }
          />

          <button onClick={() => updateTask(task)}>Save</button>
        </div>
      ))}
    </div>
  );
}
