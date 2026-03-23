"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatPhone } from "@/lib/formatPhone";

type DailyRow = {
  date: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTrees: number;
  totalRevenue: number;
};

type Summary = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTrees: number;
  totalRevenue: number;
};

type AdminSessionRow = {
  id: string;
  sessionName: string;
  adminName: string;
  date: string | null;
  loginAt: string | null;
  logoutAt: string | null;
  logoutReason: "manual" | "timeout" | null;
};

type Option = {
  _id: string;
  name: string;
};

type StaffPerformance = {
  staffId: string;
  staffName: string;
  mobile: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTrees: number;
  totalEarnings: number;
  lastCompletedDate: string;
};

const toLocalInputDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [days, setDays] = useState<DailyRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalTrees: 0,
    totalRevenue: 0,
  });
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>(
    []
  );
  const [adminSessions, setAdminSessions] = useState<AdminSessionRow[]>([]);
  const [staffOptions, setStaffOptions] = useState<Option[]>([]);
  const [locationOptions, setLocationOptions] = useState<Option[]>([]);
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [reportTab, setReportTab] = useState<"main" | "side">("main");
  const [rangePreset, setRangePreset] = useState<
    "today" | "week" | "month" | "custom"
  >("week");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [reportUnlocked, setReportUnlocked] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [submittingAccess, setSubmittingAccess] = useState(false);
  const [reportPassword, setReportPassword] = useState("");
  const [accessError, setAccessError] = useState<string | null>(null);
  const [lockingReports, setLockingReports] = useState(false);
  const { adminFetch } = useAdminAuth();

  const readErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {
    try {
      const data = await response.json();
      if (typeof data?.error === "string" && data.error.trim()) {
        return data.error;
      }
    } catch {
      // Ignore parse errors and use fallback.
    }
    return fallback;
  };

  useEffect(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    setFromDate(toLocalInputDate(weekStart));
    setToDate(toLocalInputDate(now));
  }, []);

  useEffect(() => {
    let active = true;
    const checkAccess = async () => {
      setCheckingAccess(true);
      try {
        const res = await adminFetch("/api/admin/reports/unlock");
        const data = await res.json();
        if (!active) return;
        setReportUnlocked(!!data?.unlocked);
      } catch {
        if (!active) return;
        setReportUnlocked(false);
      } finally {
        if (active) setCheckingAccess(false);
      }
    };

    checkAccess();
    return () => {
      active = false;
    };
  }, [adminFetch]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (checkingAccess || !reportUnlocked || !fromDate || !toDate) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotice(null);
      try {
        const params = new URLSearchParams();
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);
        if (staffFilter !== "all") params.set("staffId", staffFilter);
        if (locationFilter !== "all") {
          params.set("locationId", locationFilter);
        }
        params.set("taskType", reportTab);

        const [dailyRes, staffRes] = await Promise.all([
          adminFetch(`/api/admin/reports/daily?${params.toString()}`),
          adminFetch(
            `/api/admin/reports/staff-performance?${params.toString()}`
          ),
        ]);

        if (!dailyRes.ok || !staffRes.ok) {
          const firstFailed = !dailyRes.ok ? dailyRes : staffRes;
          if (firstFailed.status === 403) {
            setReportUnlocked(false);
            setAccessError("Reports access expired. Enter password again.");
            return;
          }
          if (firstFailed.status === 401) {
            throw new Error("Admin session expired. Please log in again.");
          }
          const message = await readErrorMessage(
            firstFailed,
            "Failed to load report"
          );
          throw new Error(message);
        }

        const [dailyResult, staffResult] = await Promise.all([
          dailyRes.json(),
          staffRes.json(),
        ]);

        if (!active) return;
        setDays(Array.isArray(dailyResult?.days) ? dailyResult.days : []);
        setSummary(
          dailyResult?.summary || {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            totalTrees: 0,
            totalRevenue: 0,
          }
        );
        setStaffPerformance(Array.isArray(staffResult) ? staffResult : []);
        setAdminSessions(
          Array.isArray(dailyResult?.adminSessions)
            ? dailyResult.adminSessions
            : []
        );
      } catch (err: any) {
        if (!active) return;
        setNotice(err?.message || "Report load failed.");
        setDays([]);
        setSummary({
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          totalTrees: 0,
          totalRevenue: 0,
        });
        setStaffPerformance([]);
        setAdminSessions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [
    adminFetch,
    checkingAccess,
    reportUnlocked,
    fromDate,
    toDate,
    staffFilter,
    locationFilter,
    reportTab,
  ]);

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const [staffRes, locationsRes] = await Promise.all([
          adminFetch("/api/admin/staff"),
          adminFetch("/api/admin/locations"),
        ]);
        const [staffData, locationData] = await Promise.all([
          staffRes.json(),
          locationsRes.json(),
        ]);
        if (!active) return;
        setStaffOptions(Array.isArray(staffData) ? staffData : []);
        setLocationOptions(Array.isArray(locationData) ? locationData : []);
      } catch (err) {
        if (!active) return;
        setStaffOptions([]);
        setLocationOptions([]);
      }
    };

    loadOptions();
    return () => {
      active = false;
    };
  }, [adminFetch]);

  const intro = (
    <div>
      <p className="crm-pill">Insights</p>
      <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
        Reports
      </h1>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        {reportTab === "side"
          ? "Side task analytics grouped by completed date"
          : "Daily stats grouped by completed date"}
      </p>
    </div>
  );

  if (checkingAccess) {
    return (
      <div className="space-y-6">
        {intro}
        <p className="text-sm text-[color:var(--muted)]">
          Checking report access...
        </p>
      </div>
    );
  }

  if (!reportUnlocked) {
    return (
      <div className="space-y-6">
        {intro}
        <div className="crm-card max-w-xl">
          <h2 className="text-lg font-semibold text-[color:var(--ink)]">
            Reports Password Required
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Enter the reports password to view analytics.
          </p>
          <form
            className="mt-5 space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setAccessError(null);
              setSubmittingAccess(true);
              try {
                const res = await adminFetch("/api/admin/reports/unlock", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password: reportPassword }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data?.error || "Invalid password");
                }
                setReportUnlocked(true);
                setReportPassword("");
              } catch (err: any) {
                setAccessError(err?.message || "Unlock failed");
              } finally {
                setSubmittingAccess(false);
              }
            }}
          >
            <label className="block">
              <span className="crm-label crm-label-required">Reports Password</span>
              <input
                type="password"
                className="crm-input mt-2"
                value={reportPassword}
                autoComplete="current-password"
                onChange={(event) => setReportPassword(event.target.value)}
                placeholder="Enter reports password"
                required
              />
            </label>
            {accessError && (
              <p className="text-sm text-red-600">{accessError}</p>
            )}
            <button
              type="submit"
              className="crm-btn-primary"
              disabled={submittingAccess}
            >
              {submittingAccess ? "Unlocking..." : "Unlock Reports"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {intro}

        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            className="crm-btn-outline"
            disabled={lockingReports}
            onClick={async () => {
              setLockingReports(true);
              try {
                const res = await adminFetch("/api/admin/reports/unlock", {
                  method: "DELETE",
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data?.error || "Failed to lock reports");
                }
                setReportUnlocked(false);
              } catch (err: any) {
                setNotice(err?.message || "Failed to lock reports");
              } finally {
                setLockingReports(false);
              }
            }}
          >
            {lockingReports ? "Locking..." : "Lock Reports"}
          </button>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const date = toLocalInputDate(now);
                setFromDate(date);
                setToDate(date);
                setRangePreset("today");
              }}
              className={
                rangePreset === "today" ? "crm-btn-primary" : "crm-btn-outline"
              }
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setFromDate(toLocalInputDate(startOfWeek(now)));
                setToDate(toLocalInputDate(now));
                setRangePreset("week");
              }}
              className={
                rangePreset === "week" ? "crm-btn-primary" : "crm-btn-outline"
              }
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setFromDate(toLocalInputDate(startOfMonth(now)));
                setToDate(toLocalInputDate(now));
                setRangePreset("month");
              }}
              className={
                rangePreset === "month" ? "crm-btn-primary" : "crm-btn-outline"
              }
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setReportTab("main")}
          className={reportTab === "main" ? "crm-btn-primary" : "crm-btn-outline"}
        >
          Main Tasks
        </button>
        <button
          type="button"
          onClick={() => setReportTab("side")}
          className={reportTab === "side" ? "crm-btn-primary" : "crm-btn-outline"}
        >
          Side Tasks
        </button>
      </div>

      <div className="crm-toolbar">
        <label className="block">
          <span className="crm-label">From</span>
          <input
            type="date"
            className="crm-input mt-2"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setRangePreset("custom");
            }}
          />
        </label>

        <label className="block">
          <span className="crm-label">To</span>
          <input
            type="date"
            className="crm-input mt-2"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setRangePreset("custom");
            }}
          />
        </label>

        <label className="block">
          <span className="crm-label">Staff</span>
          <select
            className="crm-select mt-2"
            value={staffFilter}
            onChange={(event) => setStaffFilter(event.target.value)}
          >
            <option value="all">All</option>
            {staffOptions.map((staff) => (
              <option key={staff._id} value={staff._id}>
                {staff.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="crm-label">Location</span>
          <select
            className="crm-select mt-2"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
          >
            <option value="all">All</option>
            {locationOptions.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {notice}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[color:var(--muted)]">Loading report...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: "Tasks", value: summary.totalTasks },
              { label: "Completed", value: summary.completedTasks },
              { label: "Pending", value: summary.pendingTasks },
              { label: "Trees", value: summary.totalTrees },
              { label: "Revenue", value: `Rs. ${summary.totalRevenue}` },
            ].map((item) => (
              <div key={item.label} className="crm-card-soft">
                <p className="crm-label">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {days.length === 0 ? (
            <div className="crm-card">
              <p className="text-sm text-[color:var(--muted)]">
                No data for this range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
              <table className="crm-table">
                <thead className="bg-white/70">
                  <tr>
                    <th className="crm-th">Date</th>
                    <th className="crm-th">Tasks</th>
                    <th className="crm-th">Completed</th>
                    <th className="crm-th">Pending</th>
                    <th className="crm-th">Trees</th>
                    <th className="crm-th">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {days.map((row) => (
                    <tr key={row.date} className="hover:bg-white/70">
                      <td className="crm-td">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="crm-td">{row.totalTasks}</td>
                      <td className="crm-td text-emerald-700">
                        {row.completedTasks}
                      </td>
                      <td className="crm-td text-amber-700">
                        {row.pendingTasks}
                      </td>
                      <td className="crm-td">{row.totalTrees}</td>
                      <td className="crm-td">Rs. {row.totalRevenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportTab === "main" && (
            <div className="mt-8 space-y-4">
              <div>
                <p className="crm-pill">Sessions</p>
                <h2 className="mt-3 text-2xl font-semibold text-[color:var(--ink)]">
                  Admin Login Sessions
                </h2>
              </div>

              {adminSessions.length === 0 ? (
                <div className="crm-card">
                  <p className="text-sm text-[color:var(--muted)]">
                    No admin sessions for this range.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
                  <table className="crm-table">
                    <thead className="bg-white/70">
                      <tr>
                        <th className="crm-th">Date</th>
                        <th className="crm-th">Admin</th>
                        <th className="crm-th">Session Name</th>
                        <th className="crm-th">Login</th>
                        <th className="crm-th">Logout</th>
                        <th className="crm-th">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border)]">
                      {adminSessions.map((row) => (
                        <tr key={row.id} className="hover:bg-white/70">
                          <td className="crm-td">
                            {row.date ? new Date(row.date).toLocaleDateString() : "-"}
                          </td>
                          <td className="crm-td">{row.adminName || "-"}</td>
                          <td className="crm-td">{row.sessionName || "-"}</td>
                          <td className="crm-td">
                            {row.loginAt
                              ? new Date(row.loginAt).toLocaleString()
                              : "-"}
                          </td>
                          <td className="crm-td">
                            {row.logoutAt
                              ? new Date(row.logoutAt).toLocaleString()
                              : "Active"}
                          </td>
                          <td className="crm-td">
                            {row.logoutReason === "timeout"
                              ? "Timeout"
                              : row.logoutReason === "manual"
                              ? "Manual"
                              : "Active"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div>
              <p className="crm-pill">Performance</p>
              <h2 className="mt-3 text-2xl font-semibold text-[color:var(--ink)]">
                Staff Performance
              </h2>
            </div>

            {staffPerformance.length === 0 ? (
              <div className="crm-card">
                <p className="text-sm text-[color:var(--muted)]">
                  No staff data for this range.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-white/90">
                <table className="crm-table">
                  <thead className="bg-white/70">
                    <tr>
                      <th className="crm-th">Staff</th>
                      <th className="crm-th">Tasks</th>
                      <th className="crm-th">Completed</th>
                      <th className="crm-th">Pending</th>
                      <th className="crm-th">Trees</th>
                      <th className="crm-th">Earnings</th>
                      <th className="crm-th">Last Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {staffPerformance.map((row) => (
                      <tr key={row.staffId} className="hover:bg-white/70">
                        <td className="crm-td">
                          <div className="font-semibold text-[color:var(--ink)]">
                            {row.staffName}
                          </div>
                          <div className="text-xs text-[color:var(--muted)]">
                            {formatPhone(row.mobile)}
                          </div>
                        </td>
                        <td className="crm-td">{row.totalTasks}</td>
                        <td className="crm-td text-emerald-700">
                          {row.completedTasks}
                        </td>
                        <td className="crm-td text-amber-700">
                          {row.pendingTasks}
                        </td>
                        <td className="crm-td">{row.totalTrees}</td>
                        <td className="crm-td">Rs. {row.totalEarnings}</td>
                        <td className="crm-td">
                          {row.lastCompletedDate
                            ? new Date(row.lastCompletedDate).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
