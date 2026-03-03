"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Location = {
  _id: string;
  name: string;
};

type FormState = {
  name: string;
  mobile: string;
  alternateMobile: string;
  profession: string;
  latitude: string;
  longitude: string;
  address: string;
  email: string;
  remark: string;
  lastDateOfService: string;
  locationId: string;
};

const emptyForm: FormState = {
  name: "",
  mobile: "",
  alternateMobile: "",
  profession: "",
  latitude: "",
  longitude: "",
  address: "",
  email: "",
  remark: "",
  lastDateOfService: "",
  locationId: "",
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const getDueDays = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff < 0 ? "0" : String(diff);
};

export default function EditCustomerPage() {
  const params = useParams();
  const customerId = params.customerId as string;
  const router = useRouter();
  const { adminFetch } = useAdminAuth();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [latitudeDirection, setLatitudeDirection] = useState("N");
  const [longitudeDirection, setLongitudeDirection] = useState("E");
  const [locations, setLocations] = useState<Location[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [lastClimbedDate, setLastClimbedDate] = useState<string>("");

  useEffect(() => {
    if (!customerId) return;
    let active = true;

    const loadData = async () => {
      try {
        const [customerRes, locationsRes] = await Promise.all([
          adminFetch(`/api/admin/customers/${customerId}`),
          adminFetch("/api/admin/locations"),
        ]);

        if (!customerRes.ok) {
          const data = await customerRes.json();
          throw new Error(data?.error || "Failed to fetch customer");
        }

        const customer = await customerRes.json();
        const locationsData = await locationsRes.json();

        if (!active) return;

        setLocations(Array.isArray(locationsData) ? locationsData : []);
        const rawLatitude = Number(customer?.latitude);
        const rawLongitude = Number(customer?.longitude);
        const hasLatitude = Number.isFinite(rawLatitude);
        const hasLongitude = Number.isFinite(rawLongitude);

        setLatitudeDirection(
          hasLatitude && rawLatitude < 0 ? "S" : "N"
        );
        setLongitudeDirection(
          hasLongitude && rawLongitude < 0 ? "W" : "E"
        );

        setForm({
          name: customer?.name || "",
          mobile: customer?.mobile || "",
          alternateMobile: customer?.alternateMobile || "",
          profession: customer?.profession || "",
          latitude: hasLatitude ? String(Math.abs(rawLatitude)) : "",
          longitude: hasLongitude
            ? String(Math.abs(rawLongitude))
            : "",
          address: customer?.address || "",
          email: customer?.email || "",
          remark: customer?.remark || "",
          lastDateOfService: "",
          locationId: customer?.location?._id || "",
        });
        setLastClimbedDate(customer?.lastDateOfService || "");
      } catch (err: any) {
        alert(err.message || "Failed to load customer");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [adminFetch, customerId]);

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      nextErrors.name = "Name is required";
    }
    if (!form.mobile.trim()) {
      nextErrors.mobile = "Mobile is required";
    }
    if (!form.address.trim()) {
      nextErrors.address = "Address is required";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    }
    if (!form.locationId) {
      nextErrors.locationId = "Location is required";
    }
    const latInput = Number(form.latitude);
    const lngInput = Number(form.longitude);
    const latNumber =
      latitudeDirection === "S" ? -Math.abs(latInput) : Math.abs(latInput);
    const lngNumber =
      longitudeDirection === "W" ? -Math.abs(lngInput) : Math.abs(lngInput);

    if (!form.latitude || Number.isNaN(latInput)) {
      nextErrors.latitude = "Valid latitude is required";
    } else if (Math.abs(latInput) > 90) {
      nextErrors.latitude = "Latitude must be between 0 and 90";
    }
    if (!form.longitude || Number.isNaN(lngInput)) {
      nextErrors.longitude = "Valid longitude is required";
    } else if (Math.abs(lngInput) > 180) {
      nextErrors.longitude = "Longitude must be between 0 and 180";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const { lastDateOfService, ...payload } = form;
    const res = await adminFetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        latitude: latNumber,
        longitude: lngNumber,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Update failed");
      return;
    }

    alert("Customer updated successfully");
    router.push("/admin/customers");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="crm-pill">Customer Profile</p>
        <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
          Edit Customer
        </h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Update contact details, service timing, and location assignments.
        </p>
      </div>

      <form onSubmit={submitHandler} className="crm-card space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Customer name</span>
            <input
              placeholder="Customer Name"
              className="crm-input mt-2"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.name}
              </p>
            )}
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Mobile</span>
            <input
              placeholder="Mobile"
              className="crm-input mt-2"
              required
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
            {errors.mobile && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.mobile}
              </p>
            )}
          </label>

          <label className="block">
            <span className="crm-label">Alternate number</span>
            <input
              placeholder="Alternate Number (optional)"
              className="crm-input mt-2"
              value={form.alternateMobile}
              onChange={(e) =>
                setForm({ ...form, alternateMobile: e.target.value })
              }
            />
          </label>

          <label className="block">
            <span className="crm-label">Profession</span>
            <input
              placeholder="Profession (optional)"
              className="crm-input mt-2"
              value={form.profession}
              onChange={(e) =>
                setForm({ ...form, profession: e.target.value })
              }
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Latitude</span>
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <input
                type="number"
                step="any"
                min="0"
                max="90"
                placeholder="Latitude"
                className="crm-input"
                required
                value={form.latitude}
                onChange={(e) =>
                  setForm({ ...form, latitude: e.target.value })
                }
              />
              <select
                className="crm-select"
                value={latitudeDirection}
                onChange={(e) => setLatitudeDirection(e.target.value)}
              >
                <option value="N">North</option>
                <option value="S">South</option>
              </select>
            </div>
            {errors.latitude && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.latitude}
              </p>
            )}
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Longitude</span>
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <input
                type="number"
                step="any"
                min="0"
                max="180"
                placeholder="Longitude"
                className="crm-input"
                required
                value={form.longitude}
                onChange={(e) =>
                  setForm({ ...form, longitude: e.target.value })
                }
              />
              <select
                className="crm-select"
                value={longitudeDirection}
                onChange={(e) => setLongitudeDirection(e.target.value)}
              >
                <option value="E">East</option>
                <option value="W">West</option>
              </select>
            </div>
            {errors.longitude && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.longitude}
              </p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="crm-label crm-label-required">Address</span>
          <input
            placeholder="Address"
            className="crm-input mt-2"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          {errors.address && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {errors.address}
            </p>
          )}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="crm-label crm-label-required">Email</span>
            <input
              type="email"
              placeholder="Email"
              className="crm-input mt-2"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.email}
              </p>
            )}
          </label>

          <label className="block">
            <span className="crm-label crm-label-required">Location</span>
            <select
              className="crm-select mt-2"
              required
              value={form.locationId}
              onChange={(e) =>
                setForm({ ...form, locationId: e.target.value })
              }
            >
              <option value="">Select Location</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {errors.locationId && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.locationId}
              </p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="crm-label">Remark</span>
          <input
            placeholder="Remark (optional)"
            className="crm-input mt-2"
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
          />
        </label>

        <div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--muted)]">
              Last climbed date
            </span>
            <span className="font-semibold text-[color:var(--ink)]">
              {formatDate(lastClimbedDate)}
            </span>
          </div>
          <div className="mt-1 text-[color:var(--muted)]">
            Due days: {getDueDays(lastClimbedDate)}
          </div>
        </div>

        <button className="crm-btn-primary">Save Changes</button>
      </form>
    </div>
  );
}
