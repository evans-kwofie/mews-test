// === Connector API ===
const MEWS_BASE_URL = process.env.MEWS_BASE_URL || "https://api.mews-demo.com";
const CLIENT_TOKEN = process.env.MEWS_CLIENT_TOKEN || "";
const ACCESS_TOKEN = process.env.MEWS_ACCESS_TOKEN || "";
const CLIENT = process.env.MEWS_CLIENT || "mews-mcp/1.0.0";

export const STAYS_SERVICE_ID =
  process.env.MEWS_STAYS_SERVICE_ID || "764642e9-7ef2-4ccc-8a53-ab3a00b6e42b";

export async function mewsPost(
  endpoint: string,
  body: Record<string, unknown> = {}
) {
  const url = `${MEWS_BASE_URL}/api/connector/v1/${endpoint}`;
  const payload = {
    ClientToken: CLIENT_TOKEN,
    AccessToken: ACCESS_TOKEN,
    Client: CLIENT,
    ...body,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mews API error ${res.status}: ${text}`);
  }

  return res.json();
}

// === Booking Engine (Distributor) API ===
const BE_BASE_URL = MEWS_BASE_URL;
const BE_CLIENT = "My Client 1.0.0";

export const BE_HOTEL_ID = "3edbe1b4-6739-40b7-81b3-d369d9469c48";
export const BE_CONFIGURATION_ID = "93e27b6f-cba7-4e0b-a24a-819e1b7b388a";
export const MEWS_IMAGE_BASE = "https://cdn.mews-demo.com/Media/Image";

export async function bookingEnginePost(
  endpoint: string,
  body: Record<string, unknown> = {}
) {
  const url = `${BE_BASE_URL}/api/distributor/v1/${endpoint}`;
  const payload = {
    Client: BE_CLIENT,
    ...body,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Booking Engine API error ${res.status}: ${text}`);
  }

  return res.json();
}
