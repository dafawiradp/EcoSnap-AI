/**
 * lib/geocoding.ts
 *
 * Reverse geocoding via OpenStreetMap Nominatim.
 * Free, no API key required. Rate limit: 1 req/s — acceptable for this MVP.
 * Returns null fields gracefully on any failure.
 */

import type { GeocodedLocation } from "@/types/report";

// ── Nominatim response shape (only the fields we use) ────────────────────────
interface NominatimResponse {
  address?: {
    village?:        string;
    suburb?:         string;
    neighbourhood?:  string;
    quarter?:        string;
    hamlet?:         string;
    city?:           string;
    town?:           string;
    county?:         string;
    municipality?:   string;
    state?:          string;
    region?:         string;
    country?:        string;
  };
  display_name?: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT    = "EcoSnapAI/1.0 (hackathon project)";
const TIMEOUT_MS    = 6_000;

/**
 * Reverse-geocodes a coordinate pair using Nominatim.
 * Always resolves (never throws) — returns null fields on any error.
 */
export async function reverseGeocode(
  latitude:  number,
  longitude: number
): Promise<GeocodedLocation> {
  const empty: GeocodedLocation = {
    address:  null,
    city:     null,
    province: null,
    country:  null,
  };

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("lat",            String(latitude));
    url.searchParams.set("lon",            String(longitude));
    url.searchParams.set("format",         "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom",           "14"); // neighbourhood level

    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal:  controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[geocoding] Nominatim returned ${res.status}`);
      }
      return empty;
    }

    const json = (await res.json()) as NominatimResponse;
    const addr = json.address ?? {};

    // Pick the most specific available sub-locality name
    const localName =
      addr.village      ??
      addr.suburb       ??
      addr.neighbourhood??
      addr.quarter      ??
      addr.hamlet       ??
      null;

    // City: prefer city > town > county > municipality
    const cityName =
      addr.city        ??
      addr.town        ??
      addr.county      ??
      addr.municipality??
      null;

    // Province / state
    const provinceName = addr.state ?? addr.region ?? null;

    return {
      address:  localName,
      city:     cityName,
      province: provinceName,
      country:  addr.country ?? null,
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[geocoding] reverseGeocode failed:", msg);
    }
    return empty;
  }
}

/**
 * Formats a GeocodedLocation into a short, human-readable string.
 * e.g. "Babakan, Cirebon" or "West Java, Indonesia"
 */
export function formatGeocodedLocation(geo: GeocodedLocation): string | null {
  const parts: string[] = [];
  if (geo.address)  parts.push(geo.address);
  if (geo.city)     parts.push(geo.city);
  if (parts.length > 0) return parts.join(", ");
  if (geo.province) return geo.province;
  if (geo.country)  return geo.country;
  return null;
}
