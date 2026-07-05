/**
 * lib/recommender.ts
 *
 * Context-aware action recommendation engine.
 *
 * Actions depend on the full (category, waste_type, urgency) triple — not
 * static lists. The engine:
 *   1. Adds urgency-mandated actions first (always included for Critical/High/Low)
 *   2. Adds category + subtype specific actions tailored to the actual situation
 *   3. Fills remaining slots with general category actions
 *   4. De-duplicates and clamps to 1–4 results
 */

import type { PollutionCategory, WasteType, UrgencyLevel } from "@/types/report";

export type { PollutionCategory, WasteType, UrgencyLevel };

// ── Action pool ───────────────────────────────────────────────────────────────
export const ACTION_POOL = [
  // General
  "Document the location with additional photos",
  "Notify local authorities",
  "Avoid direct contact with the pollutant",
  "Organize a community cleanup",
  "Escalate to environmental emergency services",
  "Contact the local environmental agency",
  "Report to the nearest health authority",
  "Dispose through certified hazardous waste facilities",
  "Contain the affected area immediately",
  "Promote recycling and reuse initiatives",
  // Category-specific
  "Install noise barriers or request noise assessment",
  "Reduce outdoor lighting or shield fixtures downward",
  "Avoid the area until assessed by authorities",
  "Test local water supply for contamination",
  "Request soil remediation assessment",
  "Wear respiratory protection near the area",
  "Seal windows and stay indoors",
  "Request e-waste collection service",
  "Schedule a chemical waste pickup",
  "Restrict public access to the affected zone",
] as const;

export type RecommendedAction = (typeof ACTION_POOL)[number];

// ── Urgency-mandated actions (always included) ────────────────────────────────
const URGENCY_MANDATORY: Record<UrgencyLevel, RecommendedAction[]> = {
  Critical: [
    "Notify local authorities",
    "Escalate to environmental emergency services",
  ],
  High: [
    "Notify local authorities",
  ],
  Medium: [],
  Low: [
    "Organize a community cleanup",
  ],
};

// ── Category base actions ─────────────────────────────────────────────────────
// Used when no subtype is present, or to fill remaining slots after subtypes.
const CATEGORY_BASE: Record<PollutionCategory, RecommendedAction[]> = {
  air_pollution: [
    "Avoid the area until assessed by authorities",
    "Wear respiratory protection near the area",
    "Seal windows and stay indoors",
    "Contact the local environmental agency",
  ],
  water_pollution: [
    "Avoid direct contact with the pollutant",
    "Test local water supply for contamination",
    "Restrict public access to the affected zone",
    "Contact the local environmental agency",
  ],
  soil_pollution: [
    "Avoid direct contact with the pollutant",
    "Request soil remediation assessment",
    "Restrict public access to the affected zone",
    "Contact the local environmental agency",
  ],
  noise_pollution: [
    "Install noise barriers or request noise assessment",
    "Report to the nearest health authority",
    "Document the location with additional photos",
  ],
  light_pollution: [
    "Reduce outdoor lighting or shield fixtures downward",
    "Document the location with additional photos",
    "Notify local authorities",
  ],
  visual_pollution: [
    "Document the location with additional photos",
    "Organize a community cleanup",
    "Notify local authorities",
  ],
  thermal_pollution: [
    "Avoid direct contact with the pollutant",
    "Contact the local environmental agency",
    "Document the location with additional photos",
  ],
  electromagnetic_pollution: [
    "Contact the local environmental agency",
    "Report to the nearest health authority",
    "Document the location with additional photos",
  ],
  waste_pollution: [
    "Document the location with additional photos",
    "Organize a community cleanup",
    "Notify local authorities",
  ],
  other: [
    "Document the location with additional photos",
    "Notify local authorities",
    "Contact the local environmental agency",
  ],
};

// ── Subtype-specific action overrides ─────────────────────────────────────────
// Selected when category === "waste_pollution" AND waste_type is known.
// These replace (not append to) the category base, then fall back to base for fill.
const WASTE_TYPE_ACTIONS: Record<WasteType, RecommendedAction[]> = {
  organic: [
    "Organize a community cleanup",
    "Document the location with additional photos",
    "Notify local authorities",
  ],
  plastic: [
    "Organize a community cleanup",
    "Document the location with additional photos",
    "Notify local authorities",
    "Contact the local environmental agency",
  ],
  paper: [
    "Organize a community cleanup",
    "Document the location with additional photos",
  ],
  glass: [
    "Avoid direct contact with the pollutant",
    "Restrict public access to the affected zone",
    "Document the location with additional photos",
    "Notify local authorities",
  ],
  metal: [
    "Avoid direct contact with the pollutant",
    "Document the location with additional photos",
    "Notify local authorities",
    "Contact the local environmental agency",
  ],
  electronic: [
    "Request e-waste collection service",
    "Avoid direct contact with the pollutant",
    "Contact the local environmental agency",
    "Notify local authorities",
  ],
  chemical: [
    "Avoid direct contact with the pollutant",
    "Restrict public access to the affected zone",
    "Schedule a chemical waste pickup",
    "Escalate to environmental emergency services",
  ],
  construction: [
    "Restrict public access to the affected zone",
    "Document the location with additional photos",
    "Notify local authorities",
    "Contact the local environmental agency",
  ],
  mixed: [
    "Organize a community cleanup",
    "Document the location with additional photos",
    "Notify local authorities",
  ],
  medical: [
  "Notify local authorities",
  "Restrict public access to the affected zone",
  "Contact the local environmental agency",
],

battery: [
  "Notify local authorities",
  "Contact the local environmental agency",
  "Dispose through certified hazardous waste facilities",
],

oil: [
  "Restrict public access to the affected zone",
  "Notify local authorities",
  "Contain the affected area immediately",
],

textile: [
  "Organize a community cleanup",
  "Promote recycling and reuse initiatives",
  "Document the location with additional photos",
],

rubber: [
  "Organize a community cleanup",
  "Notify local authorities",
  "Promote recycling and reuse initiatives",
],
  other: [
    "Document the location with additional photos",
    "Notify local authorities",
    "Contact the local environmental agency",
  ],
};

// ── Urgency amplifiers ────────────────────────────────────────────────────────
// Extra actions prepended for severe situations beyond the mandatory ones.
const URGENCY_AMPLIFIERS: Partial<Record<UrgencyLevel, Partial<Record<PollutionCategory, RecommendedAction[]>>>> = {
  Critical: {
    air_pollution:   ["Wear respiratory protection near the area", "Seal windows and stay indoors"],
    water_pollution: ["Avoid direct contact with the pollutant",   "Restrict public access to the affected zone"],
    soil_pollution:  ["Avoid direct contact with the pollutant",   "Restrict public access to the affected zone"],
  },
  High: {
    air_pollution:   ["Avoid the area until assessed by authorities"],
    water_pollution: ["Avoid direct contact with the pollutant"],
    soil_pollution:  ["Avoid direct contact with the pollutant"],
  },
};

// ── Utility ───────────────────────────────────────────────────────────────────

function pushUnique(
  list:   RecommendedAction[],
  action: RecommendedAction,
  max:    number
): void {
  if (list.length < max && !list.includes(action)) list.push(action);
}

function fillFrom(
  list:       RecommendedAction[],
  candidates: readonly RecommendedAction[],
  max:        number
): void {
  for (const action of candidates) {
    if (list.length >= max) break;
    pushUnique(list, action, max);
  }
}

// ── Main recommend function ───────────────────────────────────────────────────

/**
 * Returns 1–4 de-duplicated recommended actions tailored to the
 * (category, waste_type, urgency) context.
 */
export function recommend(
  category:  PollutionCategory,
  urgency:   UrgencyLevel,
  wasteType?: WasteType | null
): string[] {
  const MAX = 4;
  const result: RecommendedAction[] = [];

  // Step 1: urgency-mandated inclusions (always come first)
  fillFrom(result, URGENCY_MANDATORY[urgency], MAX);

  // Step 2: urgency amplifiers for this category (Critical/High specific extras)
  const amplifiers = URGENCY_AMPLIFIERS[urgency]?.[category] ?? [];
  fillFrom(result, amplifiers, MAX);

  // Step 3: subtype-specific actions (if waste_pollution + known subtype)
  if (category === "waste_pollution" && wasteType) {
    fillFrom(result, WASTE_TYPE_ACTIONS[wasteType], MAX);
  }

  // Step 4: category base fill
  fillFrom(result, CATEGORY_BASE[category] ?? CATEGORY_BASE.other, MAX);

  // Step 5: lower-bound guard — always return at least 1 action
  if (result.length === 0) {
    result.push("Document the location with additional photos");
  }

  return result;
}
