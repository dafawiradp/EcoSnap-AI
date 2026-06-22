// types/report.ts
export type PollutionCategory =
  | "plastic_waste"
  | "illegal_dumping"
  | "water_pollution"
  | "air_pollution"
  | "burning_waste";

export type UrgencyLevel = "Low" | "Medium" | "High" | "Critical";

export interface Report {
  id: string;                      // UUID, assigned by Supabase
  photo_url: string;               // Public URL from Supabase Storage
  location: string;                // Free-text location from user
  description: string;             // Free-text description from user
  pollution_category: PollutionCategory;
  urgency_level: UrgencyLevel;
  recommended_actions: string[];   // 1–4 strings from the action pool
  created_at: string;              // ISO 8601 timestamp, set by Supabase
}
