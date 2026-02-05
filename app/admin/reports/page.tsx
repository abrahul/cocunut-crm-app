"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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
  lastServiceDate: string;
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
  const today = useMemo(() => new Date(), []);
  const initialFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toLocalInputDate(d);
  }, []);
  const initialTo = useMemo(() => toLocalInputDate(today), [today]);
  const [fromDate, setFromDate] = useState(() => {
    return initialFrom;
  });
  const [toDate, setToDate] = useState(() => initialTo);
  const [days, setDays] = useState<DailyRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalTrees: 0,
    totalRevenue: 0,
  });
  const [staffPerformance, setStaffPerformance] = useState<
    StaffPerformance[]
  >([]);
  const [staffOptions, setStaffOptions] = useState<Option[]>([]);
  const [locationOptions, setLocationOptions] = useState<Option[]>([]);
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [rangePreset, setRangePreset] = useState<
    "today" | "week" | "month" | "custom"
  >("week");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const { adminFetch } = useAdminAuth();

  useEffect(() => {
    let active = true;
    const load = async () => {
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

        const [dailyRes, staffRes] = await Promise.all([
          adminFetch(`/api/admin/reports/daily?${params.toString()}`),
          adminFetch(
            `/api/admin/reports/staff-performance?${params.toString()}`
          ),
        ]);

        if (!dailyRes.ok || !staffRes.ok) {
          throw new Error("Failed to load report");
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
        setStaffPerformance(
          Array.isArray(staffResult) ? staffResult : []
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
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [adminFetch, fromDate, toDate, staffFilter, locationFilter]);

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
        setLocationOptions(
          Array.isArray(locationData) ? locationData : []
        );
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

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-gray-500">
            Daily stats grouped by service date
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
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
                rangePreset === "today"
                  ? "rounded border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  : "rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-white"
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
                rangePreset === "week"
                  ? "rounded border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  : "rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-white"
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
                rangePreset === "month"
                  ? "rounded border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  : "rounded border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-white"
              }
            >
              This Month
            </button>
          </div>

          <label className="text-xs font-semibold text-gray-600">
            From
            <input
              type="date"
              className="mt-1 rounded border px-2 py-1"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setRangePreset("custom");
              }}
            />
          </label>

          <label className="text-xs font-semibold text-gray-600">
            To
            <input
              type="date"
              className="mt-1 rounded border px-2 py-1"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setRangePreset("custom");
              }}
            />
          </label>

          <label className="text-xs font-semibold text-gray-600">
            Staff
            <select
              className="mt-1 rounded border px-2 py-1"
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

          <label className="text-xs font-semibold text-gray-600">
            Location
            <select
              className="mt-1 rounded border px-2 py-1"
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
      </div>

      {notice && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {notice}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading report...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="rounded border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Tasks</p>
              <p className="text-2xl font-bold">{summary.totalTasks}</p>
            </div>
            <div className="rounded border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-700">
                {summary.completedTasks}
              </p>
            </div>
            <div className="rounded border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {summary.pendingTasks}
              </p>
            </div>
            <div className="rounded border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Trees</p>
              <p className="text-2xl font-bold">{summary.totalTrees}</p>
            </div>
            <div className="rounded border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Revenue</p>
              <p className="text-2xl font-bold">Rs. {summary.totalRevenue}</p>
            </div>
          </div>

          {days.length === 0 ? (
            <p className="text-gray-500">No data for this range.</p>
          ) : (
            <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Tasks
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Completed
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Pending
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Trees
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {days.map((row) => (
                    <tr key={row.date}>
                      <td className="px-4 py-3">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{row.totalTasks}</td>
                      <td className="px-4 py-3 text-green-700">
                        {row.completedTasks}
                      </td>
                      <td className="px-4 py-3 text-yellow-700">
                        {row.pendingTasks}
                      </td>
                      <td className="px-4 py-3">{row.totalTrees}</td>
                      <td className="px-4 py-3">
                        Rs. {row.totalRevenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">
              Staff Performance
            </h2>
            {staffPerformance.length === 0 ? (
              <p className="text-gray-500">No staff data for this range.</p>
            ) : (
              <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Staff
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Tasks
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Completed
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Pending
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Trees
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Earnings
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Last Service
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {staffPerformance.map((row) => (
                      <tr key={row.staffId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {row.staffName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.mobile || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">{row.totalTasks}</td>
                        <td className="px-4 py-3 text-green-700">
                          {row.completedTasks}
                        </td>
                        <td className="px-4 py-3 text-yellow-700">
                          {row.pendingTasks}
                        </td>
                        <td className="px-4 py-3">{row.totalTrees}</td>
                        <td className="px-4 py-3">
                          Rs. {row.totalEarnings}
                        </td>
                        <td className="px-4 py-3">
                          {row.lastServiceDate
                            ? new Date(
                                row.lastServiceDate
                              ).toLocaleDateString()
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
