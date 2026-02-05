"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SESSION_TIMEOUT_MS = 600_000;
const REFRESH_THROTTLE_MS = 20_000;

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/staff/login");

  useEffect(() => {
    if (isLogin) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastRefreshAt = 0;

    const logout = async () => {
      try {
        localStorage.removeItem("staffLastActivityAt");
      } catch {}

      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {}

      window.location.href = "/staff/login";
    };

    const scheduleLogout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      const lastActivity = Number(localStorage.getItem("staffLastActivityAt"));
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
        localStorage.setItem("staffLastActivityAt", String(now));
      } catch {}
      scheduleLogout();

      if (now - lastRefreshAt >= REFRESH_THROTTLE_MS) {
        lastRefreshAt = now;
        try {
          await fetch("/api/auth/refresh", { method: "POST" });
        } catch {}
      }
    };

    const existing = Number(localStorage.getItem("staffLastActivityAt"));
    if (!Number.isFinite(existing)) {
      try {
        localStorage.setItem("staffLastActivityAt", String(Date.now()));
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
  }, [isLogin]);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--border)] bg-white/70 backdrop-blur">
        <div className="crm-shell flex items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Coconut CRM
            </p>
            <h1 className="text-xl font-semibold text-[color:var(--ink)]">
              Field Staff
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/staff/tasks" className="crm-btn-outline">
              My Tasks
            </Link>
          </div>
        </div>
      </header>

      <main className="crm-page">
        <div className="crm-shell">{children}</div>
      </main>
    </div>
  );
}
