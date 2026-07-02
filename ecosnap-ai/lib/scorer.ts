/**
 * lib/scorer.ts
 *
 * Urgency scoring for the new 10-category pollution taxonomy.
 * Rules are evaluated in strict priority order.
 */

import type { PollutionCategory, WasteType, UrgencyLevel } from "@/types/report";

export type { UrgencyLevel };

/** Proximity / sensitivity signals that escalate urgency */
export const PROXIMITY_SIGNALS = [
  "near water",
  "near homes",
  "near school",
  "near hospital",
  "next to",
  "beside",
  "adjacent",
  "residential",
] as const;

/** Keywords that push any category to Critical */
const CRITICAL_SIGNALS = [
  "on fire", "burning", "explosion", "toxic cloud",
  "acid spill", "hazardous spill", "chemical spill", "oil spill",
  "mass fish kill", "dead animals",
] as const;

function hasAny(text: string, signals: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

/**
 * Scores urgency based on pollution category, waste subtype, and description.
 *
 * Priority rules (highest wins):
 *   1. Any critical signal keyword                         → Critical
 *   2. Hazardous waste subtype                             → Critical
 *   3. Electronic or chemical waste                        → High
 *   4. Air / water / soil pollution + proximity signal     → High
 *   5. Air pollution (standalone)                         → High
 *   6. Water pollution (standalone)                       → Medium
 *   7. Soil pollution (standalone)                        → Medium
 *   8. Waste pollution + proximity signal                 → Medium
 *   9. Organic / mixed waste                              → Low
 *  10. Noise / light / visual / thermal / EM / other      → Low
 *  11. Default fallback                                   → Medium
 */
export function score(
  category:  PollutionCategory,
  description: string,
  wasteType?: WasteType | null
): UrgencyLevel {

  // Rule 1 — critical signal keywords override everything
  if (hasAny(description, CRITICAL_SIGNALS)) return "Critical";

  // Rule 2 — hazardous waste is always critical
  if (category === "waste_pollution" && wasteType === "hazardous") return "Critical";

  // Rule 3 — electronic waste or construction near water is high risk
  if (
    category === "waste_pollution" &&
    (wasteType === "electronic" || wasteType === "construction") &&
    hasAny(description, PROXIMITY_SIGNALS)
  ) return "High";

  // Rule 4 — major environmental media contaminated near sensitive area
  if (
    (category === "air_pollution" ||
     category === "water_pollution" ||
     category === "soil_pollution") &&
    hasAny(description, PROXIMITY_SIGNALS)
  ) return "High";

  // Rule 5 — air pollution is inherently high concern
  if (category === "air_pollution") return "High";

  // Rule 6 — water pollution (standalone, no proximity)
  if (category === "water_pollution") return "Medium";

  // Rule 7 — soil pollution (standalone)
  if (category === "soil_pollution") return "Medium";

  // Rule 8 — waste near sensitive areas
  if (category === "waste_pollution" && hasAny(description, PROXIMITY_SIGNALS)) {
    return "Medium";
  }

  // Rule 9 — organic / mixed waste (community nuisance, not immediate danger)
  if (
    category === "waste_pollution" &&
    (wasteType === "organic" || wasteType === "mixed" || wasteType === "paper")
  ) return "Low";

  // Rule 10 — sensory/perceptual pollution types are generally low urgency
  if (
    category === "noise_pollution"          ||
    category === "light_pollution"          ||
    category === "visual_pollution"         ||
    category === "thermal_pollution"        ||
    category === "electromagnetic_pollution"||
    category === "other"
  ) return "Low";

  // Rule 11 — default
  return "Medium";
}
