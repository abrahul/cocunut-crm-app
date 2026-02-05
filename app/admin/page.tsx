"use client";

import Link from "next/link";

export default function AdminDashboard() {
  const cards = [
    {
      title: "Add Customer",
      href: "/admin/add-customer",
      description: "Create a new customer",
    },
    {
      title: "Manage Customers",
      href: "/admin/customers",
      description: "View and edit customers",
    },
    {
      title: "Add Staff",
      href: "/admin/add-staff",
      description: "Create a new staff member",
    },
    {
      title: "Manage Staff",
      href: "/admin/staff",
      description: "View and edit staff",
    },
    {
      title: "Add Task",
      href: "/admin/add-task",
      description: "Create a new task",
    },
    {
      title: "Manage Tasks",
      href: "/admin/tasks",
      description: "View and edit tasks",
    },
    {
      title: "Add Location",
      href: "/admin/add-location",
      description: "Create a new location",
    },
    {
      title: "Reports",
      href: "/admin/reports",
      description: "View summaries and insights",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="border rounded-lg p-6 bg-white shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{card.title}</h2>
            <p className="text-gray-500 mt-2">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
