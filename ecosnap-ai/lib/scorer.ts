import type { PollutionCategory, UrgencyLevel } from "@/types/report";

export type { UrgencyLevel };

/** Proximity signal strings that escalate urgency to High */
export const PROXIMITY_SIGNALS = [
  "near water",
  "near homes",
  "next to",
  "beside",
  "adjacent",
] as const;

/**
 * Returns true if the description contains any proximity signal (case-insensitive).
 */
function hasProximitySignal(description: string): boolean {
  const lower = description.toLowerCase();
  return PROXIMITY_SIGNALS.some((signal) => lower.includes(signal));
}

/**
 * Scores the urgency of a pollution report based on category and description.
 * Rules are evaluated in priority order.
 */
export function score(
  category: PollutionCategory,
  description: string
): UrgencyLevel {
  // Rule 1: burning_waste is always Critical
  if (category === "burning_waste") return "Critical";

  // Rule 2: illegal_dumping or water_pollution near sensitive areas → High
  if (
    (category === "illegal_dumping" || category === "water_pollution") &&
    hasProximitySignal(description)
  ) {
    return "High";
  }

  // Rule 3: air_pollution defaults to Medium
  if (category === "air_pollution") return "Medium";

  // Rule 4: plastic_waste defaults to Low
  if (category === "plastic_waste") return "Low";

  // Rule 5: all other combinations → Medium
  return "Medium";
}
