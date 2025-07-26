// utils/fetchSinglePromptFetcher.ts

export const fetchSinglePromptFetcher = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Send cookies for session
  });

  // Handle 401 without forcing reload/redirect
  if (res.status === 401) {
    localStorage.removeItem("user");
    // Do NOT redirect here to prevent reload loop
    throw new Error("Unauthorized – logging out");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Failed to fetch");
  }

  const json = await res.json();

  return json;
};
