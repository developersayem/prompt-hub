// utils/fetcher.ts
export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send cookies (accessToken)
  });

  if (res.status === 401) {
    // Token expired or invalid – auto logout
    localStorage.removeItem("user");
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    throw new Error("Unauthorized – logging out");
  }

  if (!res.ok) {
    // Other error (403, 500, etc.)
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Failed to fetch");
  }

  const json = await res.json();

  // Check if json.data.data exists and is an array
  if (json?.data?.data && Array.isArray(json.data.data)) {
    return json.data.data; // Return actual data array
  }

  // Fallback: return empty array
  return [];
};
