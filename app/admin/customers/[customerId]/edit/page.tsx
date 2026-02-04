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
        setForm({
          name: customer?.name || "",
          mobile: customer?.mobile || "",
          alternateMobile: customer?.alternateMobile || "",
          profession: customer?.profession || "",
          latitude: customer?.latitude != null ? String(customer.latitude) : "",
          longitude: customer?.longitude != null ? String(customer.longitude) : "",
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
    const latNumber = Number(form.latitude);
    const lngNumber = Number(form.longitude);
    if (!form.latitude || Number.isNaN(latNumber)) {
      nextErrors.latitude = "Valid latitude is required";
    }
    if (!form.longitude || Number.isNaN(lngNumber)) {
      nextErrors.longitude = "Valid longitude is required";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const { lastDateOfService, ...payload } = form;
    const res = await adminFetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">Edit Customer</h1>

      <form onSubmit={submitHandler} className="space-y-3">
        <input
          placeholder="Customer Name"
          className="border p-2 w-full"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {errors.name && (
          <p className="text-red-600 text-sm">{errors.name}</p>
        )}

        <input
          placeholder="Mobile"
          className="border p-2 w-full"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
        />
        {errors.mobile && (
          <p className="text-red-600 text-sm">{errors.mobile}</p>
        )}

        <input
          placeholder="Alternate Number (optional)"
          className="border p-2 w-full"
          value={form.alternateMobile}
          onChange={(e) =>
            setForm({ ...form, alternateMobile: e.target.value })
          }
        />

        <input
          placeholder="Profession (optional)"
          className="border p-2 w-full"
          value={form.profession}
          onChange={(e) => setForm({ ...form, profession: e.target.value })}
        />

        <input
          type="number"
          step="any"
          placeholder="Latitude"
          className="border p-2 w-full"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
        />
        {errors.latitude && (
          <p className="text-red-600 text-sm">{errors.latitude}</p>
        )}

        <input
          type="number"
          step="any"
          placeholder="Longitude"
          className="border p-2 w-full"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
        />
        {errors.longitude && (
          <p className="text-red-600 text-sm">{errors.longitude}</p>
        )}

        <input
          placeholder="Address"
          className="border p-2 w-full"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        {errors.address && (
          <p className="text-red-600 text-sm">{errors.address}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {errors.email && (
          <p className="text-red-600 text-sm">{errors.email}</p>
        )}

        <input
          placeholder="Remark (optional)"
          className="border p-2 w-full"
          value={form.remark}
          onChange={(e) => setForm({ ...form, remark: e.target.value })}
        />

        <div className="rounded border bg-gray-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Last climbed date</span>
            <span className="font-semibold text-gray-900">
              {formatDate(lastClimbedDate)}
            </span>
          </div>
          <div className="mt-1 text-gray-600">
            Due days: {getDueDays(lastClimbedDate)}
          </div>
        </div>

        <select
          className="border p-2 w-full"
          value={form.locationId}
          onChange={(e) => setForm({ ...form, locationId: e.target.value })}
        >
          <option value="">Select Location</option>
          {locations.map((loc) => (
            <option key={loc._id} value={loc._id}>
              {loc.name}
            </option>
          ))}
        </select>
        {errors.locationId && (
          <p className="text-red-600 text-sm">{errors.locationId}</p>
        )}

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Changes
        </button>
      </form>
    </div>
  );
}
