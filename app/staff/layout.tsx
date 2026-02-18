"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function subscribeToStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/staff/login");
  const staffName = useSyncExternalStore(
    subscribeToStorage,
    () => localStorage.getItem("staffName") || "",
    () => ""
  );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("Service worker registration failed", error));
  }, []);

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
            {staffName && (
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {staffName}
              </p>
            )}
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
