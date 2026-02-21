"use client";

export default function LoginPage() {
  return (
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="crm-card">
          <p className="crm-pill">Access</p>
          <h1 className="mt-4 text-3xl font-semibold text-[color:var(--ink)]">
            Login
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Choose your portal and sign in with your credentials.
          </p>

          <div className="mt-6 space-y-3">
            <a href="/admin/login" className="crm-btn-primary block w-full text-center">
              Admin Login
            </a>
            <a href="/staff/login" className="crm-btn-outline block w-full text-center">
              Staff Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
