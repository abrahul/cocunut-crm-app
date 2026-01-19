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
        role: "staff",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to update task");
      return;
    }

    alert("Task completed");
    location.reload();
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">My Tasks</h1>

      {tasks.length === 0 && (
        <p className="text-gray-500">No tasks assigned</p>
      )}

      {tasks.map((task, index) => (
        <div
          key={task._id}
          className="border p-4 mb-4 rounded"
        >
          <p><b>Customer:</b> {task.customerName}</p>
          <p><b>Location:</b> {task.location}</p>

          <label className="block mt-2">Trees</label>
          <input
            type="number"
            value={task.numberOfTrees}
            disabled={task.status === "completed"}
            onChange={(e) => {
              const updated = [...tasks];
              updated[index].numberOfTrees = Number(e.target.value);
              setTasks(updated);
            }}
            className="border p-1 w-full"
          />

          <label className="block mt-2">Rate per tree</label>
          <input
            type="number"
            value={task.ratePerTree}
            disabled={task.status === "completed"}
            onChange={(e) => {
              const updated = [...tasks];
              updated[index].ratePerTree = Number(e.target.value);
              setTasks(updated);
            }}
            className="border p-1 w-full"
          />

          <p className="mt-2">
            <b>Total:</b> ₹
            {task.numberOfTrees * task.ratePerTree}
          </p>

          {task.status !== "completed" && (
            <button
              onClick={() => submitTask(task)}
              className="mt-3 bg-black text-white px-4 py-2"
            >
              Complete Task
            </button>
          )}

          {task.status === "completed" && (
            <p className="mt-2 text-green-600 font-semibold">
              Completed
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
