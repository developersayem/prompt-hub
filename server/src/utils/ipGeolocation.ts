interface GeoLocationData {
  city: string;
  country_name: string;
}

export const getGeoLocationFromIP = async (ip: string): Promise<string> => {
  // Return dummy location for local dev IPs
  if (ip === "::1" || ip === "127.0.0.1") {
    return "Localhost (Dev Machine)";
  }

  // Real API call (optional: use ipapi.co, ipgeolocation.io, or similar)
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json() as { city: string; country_name: string };
    return `${data.city || "Unknown City"}, ${data.country_name || "Unknown Country"}`;
  } catch (error) {
    return "Unknown Location";
  }
};