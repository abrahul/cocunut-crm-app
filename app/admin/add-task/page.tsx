"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Customer = {
  _id: string;
  name: string;
  mobile?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  remark?: string;
  location?: {
    name: string;
    defaultRate?: number;
  };
  lastTask?: {
    numberOfTrees?: number;
    ratePerTree?: number;
  };
};

type Staff = {
  _id: string;
  name: string;
  isActive?: boolean;
};

function AddTaskPageContent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const { adminFetch } = useAdminAuth();
  const searchParams = useSearchParams();
  const prefillCustomerId = searchParams.get("customerId") || "";
  const prefillAppliedRef = useRef(false);

  const [form, setForm] = useState({
    customerId: "",
    staffId: "",
    treesCount: "",
    rate: "",
    latitude: "",
    longitude: "",
    serviceDate: "",
    serviceTime: "",
    medicine: "",
    exactAddress: "",
    remark: "",
  });
  const [previousRemark, setPreviousRemark] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [updatingRemark, setUpdatingRemark] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadLists = async () => {
      const [customersResult, staffResult] = await Promise.allSettled([
        adminFetch("/api/admin/customers", { signal: controller.signal })
          .then((res) => res.json()),
        adminFetch("/api/admin/staff", { signal: controller.signal })
          .then((res) => res.json()),
      ]);

      if (cancelled) return;

      if (customersResult.status === "fulfilled" && Array.isArray(customersResult.value)) {
        setCustomers(customersResult.value);
      } else if (customersResult.status === "fulfilled") {
        console.error("Customer API error:", customersResult.value);
        setCustomers([]);
      } else {
        setCustomers([]);
      }

      if (staffResult.status === "fulfilled" && Array.isArray(staffResult.value)) {
        setStaff(staffResult.value.filter((s) => s.isActive !== false));
      } else if (staffResult.status === "fulfilled") {
        console.error("Staff API error:", staffResult.value);
        setStaff([]);
      } else {
        setStaff([]);
      }
    };

    loadLists().catch(() => {
      if (!cancelled) {
        setCustomers([]);
        setStaff([]);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [adminFetch]);

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !form.customerId ||
      !form.staffId ||
      !form.treesCount ||
      !form.rate ||
      !form.latitude ||
      !form.longitude ||
      !form.serviceDate ||
      !form.medicine ||
      !form.exactAddress
    ) {
      alert("All fields are required");
      return;
    }

    setLoading(true);

    const res = await adminFetch("/api/admin/add-task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: form.customerId,
        staffId: form.staffId,
        treesCount: Number(form.treesCount),
        rate: Number(form.rate),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        serviceDate: form.serviceDate,
        serviceTime: form.serviceTime,
        medicine: form.medicine === "yes",
        exactAddress: form.exactAddress,
        remark: form.remark,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert("Task created successfully");
      setForm({
        customerId: "",
        staffId: "",
        treesCount: "",
        rate: "",
        latitude: "",
        longitude: "",
        serviceDate: "",
        serviceTime: "",
        medicine: "",
        exactAddress: "",
        remark: "",
      });
      setPreviousRemark("");
    } else {
      alert(data.error || "Something went wrong");
    }
  };

  const updateRemarkHandler = async () => {
    if (!form.customerId) {
      alert("Please select a customer first");
      return;
    }
    if (!form.remark.trim()) {
      alert("Please enter a remark");
      return;
    }

    setUpdatingRemark(true);
    const res = await adminFetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: form.customerId,
        remark: form.remark.trim(),
      }),
    });
    const data = await res.json();
    setUpdatingRemark(false);

    if (res.ok) {
      setPreviousRemark(data?.remark || "");
      setCustomers((prev) =>
        prev.map((c) =>
          c._id === form.customerId
            ? { ...c, remark: data?.remark || "" }
            : c
        )
      );
      setForm((prev) => ({
        ...prev,
        remark: "",
      }));
      alert("Remark updated");
    } else {
      alert(data?.error || "Failed to update remark");
    }
  };

  const handleCustomerSelect = useCallback((customerId: string) => {
    const selected = customers.find((c) => c._id === customerId);
    const defaultRate = selected?.location?.defaultRate;
    const nextPreviousRemark = selected?.remark || "";
    const nextExactAddress = selected?.address || "";
    setForm((prev) => ({
      ...prev,
      customerId,
      treesCount: "",
      rate:
        typeof defaultRate === "number"
          ? String(defaultRate)
          : "",
      latitude:
        typeof selected?.latitude === "number"
          ? String(selected.latitude)
          : "",
      longitude:
        typeof selected?.longitude === "number"
          ? String(selected.longitude)
          : "",
      exactAddress: nextExactAddress,
      remark: "",
    }));
    setPreviousRemark(nextPreviousRemark);

    if (customerId) {
      adminFetch(`/api/admin/customers/${customerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data || data?.error) return;
          setPreviousRemark(
            typeof data.remark === "string" ? data.remark : ""
          );
          setForm((prev) => ({
            ...prev,
            exactAddress:
              typeof data.address === "string"
                ? data.address
                : prev.exactAddress,
            rate:
              typeof data?.lastTask?.ratePerTree === "number"
                ? String(data.lastTask.ratePerTree)
                : typeof data?.location?.defaultRate === "number"
                  ? String(data.location.defaultRate)
                  : prev.rate,
            treesCount:
              typeof data?.lastTask?.numberOfTrees === "number"
                ? String(data.lastTask.numberOfTrees)
                : prev.treesCount,
            latitude:
              typeof data?.latitude === "number"
                ? String(data.latitude)
                : prev.latitude,
            longitude:
              typeof data?.longitude === "number"
                ? String(data.longitude)
                : prev.longitude,
          }));
        })
        .catch(() => {});
    }
  }, [adminFetch, customers]);

  useEffect(() => {
    if (!prefillCustomerId) return;
    if (!customers.length) return;
    if (prefillAppliedRef.current) return;
    const exists = customers.some((c) => c._id === prefillCustomerId);
    if (!exists) return;
    handleCustomerSelect(prefillCustomerId);
    prefillAppliedRef.current = true;
  }, [customers, handleCustomerSelect, prefillCustomerId]);

  const clearSelectedCustomer = () => {
    setForm((prev) => ({
      ...prev,
      customerId: "",
      treesCount: "",
      rate: "",
      latitude: "",
      longitude: "",
      exactAddress: "",
      remark: "",
    }));
    setPreviousRemark("");
  };

  const normalizedCustomerSearch = customerSearch.trim().toLowerCase();
  const searchDigits = customerSearch.replace(/\D/g, "");

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!normalizedCustomerSearch && !searchDigits) return true;
      const nameMatch = customer.name
        .toLowerCase()
        .includes(normalizedCustomerSearch);
      const mobileMatch = searchDigits
        ? (customer.mobile || "").replace(/\D/g, "").includes(searchDigits)
        : false;
      return nameMatch || mobileMatch;
    });
  }, [customers, normalizedCustomerSearch, searchDigits]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer._id === form.customerId),
    [customers, form.customerId]
  );

  const visibleCustomers = useMemo(() => {
    return normalizedCustomerSearch || searchDigits
      ? filteredCustomers
      : customers.slice(0, 8);
  }, [customers, filteredCustomers, normalizedCustomerSearch, searchDigits]);

  return (
    <div className="space-y-6">
      <div>
        <p className="crm-pill">Task Creation</p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
          Add Task
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Assign a customer, staff member, and service details in one flow.
        </p>
      </div>

      <form onSubmit={submitHandler} className="crm-card space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Customer</span>
            <input type="hidden" value={form.customerId} required readOnly />
            <div className="mt-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  className="crm-input flex-1"
                  placeholder="Search by name or mobile number"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                {customerSearch && (
                  <button
                    type="button"
                    className="crm-btn-outline"
                    onClick={() => setCustomerSearch("")}
                  >
                    Clear search
                  </button>
                )}
              </div>

              {selectedCustomer ? (
                <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-3 text-sm text-[color:var(--ink)]">
                  <div className="font-semibold">
                    {selectedCustomer.name}
                  </div>
                  <div className="text-[color:var(--muted)]">
                    {selectedCustomer.mobile || "No mobile"} -{" "}
                    {selectedCustomer.location?.name || "No location"}
                  </div>
                  <button
                    type="button"
                    className="crm-btn-outline mt-3"
                    onClick={clearSelectedCustomer}
                  >
                    Change customer
                  </button>
                </div>
              ) : (
                <div className="text-xs text-[color:var(--muted)]">
                  Start typing to find a customer, then click the correct
                  match.
                </div>
              )}

              {!selectedCustomer && (
                <div className="max-h-56 overflow-auto rounded-2xl border border-[color:var(--border)] bg-white/70">
                  {visibleCustomers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[color:var(--muted)]">
                      No customers match this search.
                    </div>
                  ) : (
                    visibleCustomers.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-[color:var(--soft)]"
                        onClick={() => handleCustomerSelect(c._id)}
                      >
                        <span className="font-semibold text-[color:var(--ink)]">
                          {c.name}
                        </span>
                        <span className="text-xs text-[color:var(--muted)]">
                          {c.mobile || "No mobile"} -{" "}
                          {c.location?.name || "No location"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Staff</span>
            <select
              className="crm-select mt-2"
              required
              value={form.staffId}
              onChange={(e) =>
                setForm({
                  ...form,
                  staffId: e.target.value,
                })
              }
            >
              <option value="">Select Staff</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Number of trees</span>
            <input
              type="number"
              className="crm-input mt-2"
              required
              value={form.treesCount}
              onChange={(e) =>
                setForm({
                  ...form,
                  treesCount: e.target.value,
                })
              }
            />
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Rate per tree</span>
            <input
              type="number"
              className="crm-input mt-2"
              required
              value={form.rate}
              onChange={(e) =>
                setForm({
                  ...form,
                  rate: e.target.value,
                })
              }
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Latitude</span>
            <input
              type="number"
              step="any"
              className="crm-input mt-2"
              required
              value={form.latitude}
              onChange={(e) =>
                setForm({
                  ...form,
                  latitude: e.target.value,
                })
              }
            />
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Longitude</span>
            <input
              type="number"
              step="any"
              className="crm-input mt-2"
              required
              value={form.longitude}
              onChange={(e) =>
                setForm({
                  ...form,
                  longitude: e.target.value,
                })
              }
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Date of service</span>
            <input
              type="date"
              className="crm-input mt-2"
              required
              value={form.serviceDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  serviceDate: e.target.value,
                })
              }
            />
          </label>

          <label className="block">
            <span className="crm-label">Time of service</span>
            <input
              type="time"
              className="crm-input mt-2"
              value={form.serviceTime}
              onChange={(e) =>
                setForm({
                  ...form,
                  serviceTime: e.target.value,
                })
              }
            />
          </label>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4">
          <p className="crm-label crm-label-required">Medicine required?</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[color:var(--ink)]">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="medicine"
                value="yes"
                required
                checked={form.medicine === "yes"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    medicine: e.target.value,
                  })
                }
              />
              Yes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="medicine"
                value="no"
                required
                checked={form.medicine === "no"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    medicine: e.target.value,
                  })
                }
              />
              No
            </label>
          </div>
        </div>

        <label className="block">
          <span className="crm-label crm-label-required">Exact address</span>
          <input
            type="text"
            className="crm-input mt-2"
            required
            value={form.exactAddress}
            onChange={(e) =>
              setForm({
                ...form,
                exactAddress: e.target.value,
              })
            }
          />
        </label>

        <label className="block">
          <span className="crm-label">Remark</span>
          <textarea
            className="crm-textarea mt-2"
            rows={3}
            value={form.remark}
            onChange={(e) =>
              setForm({
                ...form,
                remark: e.target.value,
              })
            }
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={updateRemarkHandler}
            disabled={updatingRemark}
            className="crm-btn-outline disabled:opacity-50"
          >
            {updatingRemark ? "Updating..." : "Update Remark"}
          </button>
          <div className="flex-1 text-sm text-[color:var(--muted)]">
            Save remarks to keep notes available for future tasks.
          </div>
        </div>

        <label className="block">
          <span className="crm-label">Previous remark</span>
          <textarea
            className="crm-textarea mt-2 bg-white/60"
            rows={3}
            value={previousRemark}
            readOnly
          />
        </label>

        <button
          disabled={loading}
          className="crm-btn-primary disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </div>
  );
}

export default function AddTaskPage() {
  return (
    <Suspense fallback={<div className="space-y-6">Loading...</div>}>
      <AddTaskPageContent />
    </Suspense>
  );
}
