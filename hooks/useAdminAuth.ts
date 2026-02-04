"use client";

import { useCallback } from "react";

type FetchInput = RequestInfo | URL;
type FetchInit = RequestInit | undefined;

export function useAdminAuth() {
  const adminFetch = useCallback(async (input: FetchInput, init?: FetchInit) => {
    const res = await fetch(input, init);

    if (res.status === 401) {
      window.location.href = "/admin/login";
      throw new Error("Unauthorized");
    }

    return res;
  }, []);

  return { adminFetch };
}
