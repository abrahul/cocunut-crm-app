"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StaffPerformance = {
  staffId: string;
  staffName: string;
  phone: string;
  totalTasks: number;
  totalTrees: number;
  totalEarnings: number;
  lastTaskDate: string;
};

export default function StaffPerformancePage() {
  const [data, setData] = useState<StaffPerformance[]>([]);

  useEffect(() => {
    fetch("/api/admin/staff-performance")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return null;
        }
        return res.json();
      })
      .then((result) => {
        if (!result) return;
        if (Array.isArray(result)) {
          setData(result);
        } else {
          setData([]);
        }
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Staff Performance Dashboard
      </h1>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Staff</th>
            <th className="border p-2">Tasks</th>
            <th className="border p-2">Trees</th>
            <th className="border p-2">Earnings (₹)</th>
            <th className="border p-2">Last Task</th>
          </tr>
        </thead>

        <tbody>
          {data.map((s) => (
            <tr key={s.staffId}>
              <td className="border p-2">
                <Link href={`/admin/staff/${s.staffId}`}>
                  <span className="text-blue-600 underline cursor-pointer">
                    {s.staffName}
                  </span>
                </Link>
                <br />
                <span className="text-sm text-gray-500">{s.phone}</span>
              </td>

              <td className="border p-2 text-center">{s.totalTasks}</td>

              <td className="border p-2 text-center">{s.totalTrees}</td>

              <td className="border p-2 text-center">₹{s.totalEarnings}</td>

              <td className="border p-2 text-center">
                {s.lastTaskDate
                  ? new Date(s.lastTaskDate).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
