"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SESSION_TIMEOUT_MS = 600_000;
const REFRESH_THROTTLE_MS = 20_000;

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Staff", href: "/admin/staff" },
  { label: "Tasks", href: "/admin/tasks" },
  { label: "Reports", href: "/admin/reports" },
];

const quickActions = [
  { label: "Add Customer", href: "/admin/add-customer" },
  { label: "Add Staff", href: "/admin/add-staff" },
  { label: "Add Task", href: "/admin/add-task" },
  { label: "Add Location", href: "/admin/add-location" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/admin/login");

  useEffect(() => {
    if (isAuthRoute) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastRefreshAt = 0;

    const logout = async () => {
      try {
        localStorage.removeItem("adminLastActivityAt");
      } catch {}

      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {}

      window.location.href = "/admin/login";
    };

    const scheduleLogout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const lastActivity = Number(localStorage.getItem("adminLastActivityAt"));
      const remaining = SESSION_TIMEOUT_MS - (Date.now() - lastActivity);
      if (remaining <= 0) {
        void logout();
        return;
      }
      timeoutId = setTimeout(() => {
        void logout();
      }, remaining);
    };

    const touchActivity = async () => {
      const now = Date.now();
      try {
        localStorage.setItem("adminLastActivityAt", String(now));
      } catch {}
      scheduleLogout();

      if (now - lastRefreshAt >= REFRESH_THROTTLE_MS) {
        lastRefreshAt = now;
        try {
          await fetch("/api/auth/refresh", { method: "POST" });
        } catch {}
      }
    };

    const existing = Number(localStorage.getItem("adminLastActivityAt"));
    if (!Number.isFinite(existing)) {
      try {
        localStorage.setItem("adminLastActivityAt", String(Date.now()));
      } catch {}
    }

    scheduleLogout();

    const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, touchActivity, { passive: true }));
    document.addEventListener("visibilitychange", touchActivity);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((evt) =>
        window.removeEventListener(evt, touchActivity)
      );
      document.removeEventListener("visibilitychange", touchActivity);
    };
  }, [isAuthRoute]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden w-64 flex-shrink-0 border-r border-[color:var(--border)] bg-white/60 px-6 py-8 lg:flex lg:flex-col">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Coconut CRM
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
              Admin Suite
            </h1>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-[color:var(--brand)] text-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.8)]"
                      : "text-[color:var(--ink)] hover:bg-white/80"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
              Quick Actions
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {quickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-xs font-semibold text-[color:var(--ink)] transition hover:border-transparent hover:bg-[color:var(--brand)] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-white/70 backdrop-blur">
            <div className="crm-shell flex items-center justify-between px-5 py-4 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Coconut CRM
                </p>
                <p className="text-lg font-semibold text-[color:var(--ink)]">
                  Administration
                </p>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                {quickActions.slice(0, 2).map((item) => (
                  <Link key={item.href} href={item.href} className="crm-btn-outline">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:hidden">
              <div className="crm-shell flex gap-2 overflow-x-auto px-5 pb-4 sm:px-8">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                        active
                          ? "bg-[color:var(--brand)] text-white"
                          : "border border-[color:var(--border)] bg-white/80 text-[color:var(--ink)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="crm-page">
            <div className="crm-shell">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
