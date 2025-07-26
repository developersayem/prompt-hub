// utils/fetcher.ts

export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  // Handle 401 Unauthorized response
  if (res.status === 401) {
    localStorage.removeItem("user");

    // Optional: set a flag so components can redirect if needed
    // Avoid direct redirect here to prevent infinite reload loop
    throw new Error("Unauthorized – logging out");
  }

  // Handle other error responses
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Failed to fetch");
  }

  // Parse JSON safely
  const json = await res.json();

  // Return data based on structure
  if (Array.isArray(json?.data)) {
    return json.data;
  } else if (Array.isArray(json?.data?.data)) {
    return json.data.data;
  }

  // If no data found, return empty array
  return [];
};
