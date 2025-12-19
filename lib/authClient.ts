// lib/authClient.ts

export function getAuthUser() {
  if (typeof window === "undefined") return null;

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role"); // "admin" | "staff"

  if (!userId || !role) return null;

  return { userId, role };
}
