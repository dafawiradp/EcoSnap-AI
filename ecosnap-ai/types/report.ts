// types/report.ts

// ── Pollution taxonomy ────────────────────────────────────────────────────────
export type PollutionCategory =
  | "air_pollution"
  | "water_pollution"
  | "soil_pollution"
  | "noise_pollution"
  | "light_pollution"
  | "visual_pollution"
  | "thermal_pollution"
  | "electromagnetic_pollution"
  | "waste_pollution"
  | "other";

// ── Waste subtype (only populated when pollution_category === "waste_pollution")
export type WasteType =
  | "organic"
  | "plastic"
  | "paper"
  | "glass"
  | "metal"
  | "electronic"
  | "hazardous"
  | "construction"
  | "mixed"
  | "other";

export type UrgencyLevel = "Low" | "Medium" | "High" | "Critical";

// ── Geocoding result ──────────────────────────────────────────────────────────
export interface GeocodedLocation {
  address:  string | null;   // e.g. "Babakan"
  city:     string | null;   // e.g. "Cirebon"
  province: string | null;   // e.g. "West Java"
  country:  string | null;   // e.g. "Indonesia"
}

// ── Main report shape ─────────────────────────────────────────────────────────
export interface Report {
  id:                  string;           // UUID, assigned by Supabase
  photo_url:           string;           // Public URL from Supabase Storage (or placeholder)
  location:            string;           // Human-readable location fallback
  description:         string;           // Free-text description from user
  pollution_category:  PollutionCategory;
  waste_type:          WasteType | null; // Only set when category === "waste_pollution"
  urgency_level:       UrgencyLevel;
  recommended_actions: string[];         // 1–4 strings from the action pool
  confidence:          number;           // 0–100 mock confidence percentage
  latitude:            number | null;    // GPS latitude, nullable
  longitude:           number | null;    // GPS longitude, nullable
  // Geocoded fields — nullable for backward-compat with older rows
  geo_address:         string | null;
  geo_city:            string | null;
  geo_province:        string | null;
  geo_country:         string | null;
  created_at:          string;           // ISO 8601 timestamp, set by Supabase
}

/** Shape of the row we INSERT — id and created_at are DB-generated */
export type NewReport = Omit<Report, "id" | "created_at">;

// ── Display helpers ───────────────────────────────────────────────────────────

/** Build the best available human-readable location string for display. */
export function displayLocation(report: Pick<Report,
  "geo_address" | "geo_city" | "geo_province" | "geo_country" |
  "latitude" | "longitude" | "location"
>): string {
  const parts: string[] = [];
  if (report.geo_address)  parts.push(report.geo_address);
  if (report.geo_city)     parts.push(report.geo_city);
  if (parts.length > 0) return parts.join(", ");
  if (report.geo_province) return report.geo_province;
  if (report.latitude != null && report.longitude != null) {
    return `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
  }
  return report.location || "Unknown location";
}
