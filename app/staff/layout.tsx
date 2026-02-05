"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/staff/login");

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
