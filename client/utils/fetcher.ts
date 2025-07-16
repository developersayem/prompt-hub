// utils/fetcher.ts
export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (res.status === 401) {
    localStorage.removeItem("user");
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    throw new Error("Unauthorized – logging out");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Failed to fetch");
  }

  const json = await res.json();

  // 🧠 Handle both nested and flat "data"
  if (Array.isArray(json?.data)) {
    return json.data;
  } else if (Array.isArray(json?.data?.data)) {
    return json.data.data;
  }

  return [];
};
