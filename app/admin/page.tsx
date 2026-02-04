"use client";

import Link from "next/link";

export default function AdminDashboard() {
  const cards = [
    { title: "Add Location", href: "/admin/add-location" },
    { title: "Add Customer", href: "/admin/add-customer" },
    { title: "Manage Customers", href: "/admin/customers" },
    { title: "Add Staff", href: "/admin/add-staff" },
    { title: "Add Task", href: "/admin/add-task" },
    { title: "Manage Tasks", href: "/admin/tasks" },
    { title: "Reports", href: "#" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(card => (
          <Link
            key={card.title}
            href={card.href}
            className="border rounded-lg p-6 bg-white shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{card.title}</h2>
            <p className="text-gray-500 mt-2">Manage {card.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
