export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch");
  }

  const json = await res.json();


  // Check if json.data.data exists and is array
  if (json.data && Array.isArray(json.data.data)) {
    return json.data.data; // return array of prompts
  }

  // fallback: return empty array if structure unexpected
  return [];
};
