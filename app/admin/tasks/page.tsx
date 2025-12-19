"use client";

import { useEffect, useState } from "react";

type Task = {
  _id: string;
  customer: { name: string };
  location: { name: string };
  staff: { name: string };
  numberOfTrees: number;
  ratePerTree: number;
  totalAmount: number;
  status: string;
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/tasks")
      .then(res => res.json())
      .then(data => {
        console.log("ADMIN TASKS:", data); // 🔍 DEBUG
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          setTasks([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Admin tasks fetch error", err);
        setTasks([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Tasks</h1>

      {tasks.length === 0 && (
        <p className="text-gray-500">No tasks found</p>
      )}

      {tasks.map(task => (
        <div
          key={task._id}
          className="border p-4 rounded mb-4 bg-white shadow"
        >
          <p><b>Customer:</b> {task.customer?.name}</p>
          <p><b>Location:</b> {task.location?.name}</p>
          <p><b>Staff:</b> {task.staff?.name}</p>
          <p><b>Trees:</b> {task.numberOfTrees}</p>
          <p><b>Rate:</b> ₹{task.ratePerTree}</p>
          <p><b>Total:</b> ₹{task.totalAmount}</p>
          <p>
            <b>Status:</b>{" "}
            <span className={task.status === "completed" ? "text-green-600" : "text-yellow-600"}>
              {task.status}
            </span>
          </p>

          {/* Admin can always edit */}
          <button className="mt-2 text-blue-600 underline">
            Edit Task
          </button>
        </div>
      ))}
    </div>
  );
}
