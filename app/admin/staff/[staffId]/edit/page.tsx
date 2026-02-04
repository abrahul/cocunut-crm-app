"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function EditStaffPage() {
  const params = useParams();
  const staffId = params.staffId as string;
  const router = useRouter();
  const { adminFetch } = useAdminAuth();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffId) return;

    adminFetch(`/api/admin/staff/${staffId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch staff");
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setName(data.name);
        setMobile(data.mobile);
      })
      .catch((err) => {
        alert(err.message);
      })
      .finally(() => setLoading(false));
  }, [staffId]);

  async function handleUpdate() {
    const res = await adminFetch(`/api/admin/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("Staff updated successfully");
    router.push("/admin/staff");
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold mb-4">Edit Staff</h1>

      <input
        className="border p-2 w-full mb-3"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-3"
        placeholder="Mobile"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <button
        onClick={handleUpdate}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save Changes
      </button>
    </div>
  );
}
