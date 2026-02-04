"use client";

import { useEffect, useState } from "react";
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

export default function StaffTaskHistoryPage() {
  const { staffId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    adminFetch(`/api/admin/staff/${staffId}/tasks`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        setTasks(data);
      });
  }, [staffId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staff Task History</h1>

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
            <b>Rate:</b> ₹{task.ratePerTree}
          </p>
          <p>
            <b>Total:</b> ₹{task.totalAmount}
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
        </div>
      ))}
    </div>
  );
}
