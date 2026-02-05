export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="crm-page">
        <div className="crm-shell">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="crm-card">
              <p className="crm-pill">Operations Command Center</p>
              <h1 className="mt-6 text-4xl font-semibold text-[color:var(--ink)] sm:text-5xl">
                Coconut CRM
              </h1>
              <p className="mt-4 text-lg text-[color:var(--muted)]">
                Keep customers, staff, and field tasks aligned with a calm,
                focused workspace designed for daily dispatch and service
                reviews.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/admin/login" className="crm-btn-primary">
                  Admin Login
                </a>
                <a href="/staff/login" className="crm-btn-outline">
                  Staff Login
                </a>
              </div>
            </div>

            <div className="crm-card-soft">
              <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
                Today&apos;s Focus
              </h2>
              <div className="mt-5 space-y-4 text-sm text-[color:var(--muted)]">
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Customers
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--ink)]">
                    Review new signups and confirm addresses
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Tasks
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--ink)]">
                    Track upcoming service routes
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Staff
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--ink)]">
                    Celebrate top performers this week
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
