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
      title: "Manage Locations",
      href: "/admin/locations",
      description: "Edit and maintain service areas",
    },
    {
      title: "Reports",
      href: "/admin/reports",
      description: "View summaries and insights",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="crm-pill">Overview</p>
          <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Jump back into daily operations with the essentials below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/add-task" className="crm-btn-primary">
            Create Task
          </Link>
          <Link href="/admin/reports" className="crm-btn-outline">
            View Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="crm-card transition hover:-translate-y-1 hover:shadow-[0_30px_70px_-45px_rgba(15,23,42,0.6)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Shortcut
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[color:var(--ink)]">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
