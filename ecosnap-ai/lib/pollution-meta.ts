/**
 * lib/pollution-meta.ts
 *
 * Single source of truth for all display metadata about pollution categories
 * and waste subtypes. Import from here instead of duplicating lookup tables
 * across components.
 */

import type { PollutionCategory, WasteType } from "@/types/report";

// ── Category icons ────────────────────────────────────────────────────────────
export const CATEGORY_ICON: Record<PollutionCategory, string> = {
  air_pollution:              "🌫️",
  water_pollution:            "💧",
  soil_pollution:             "🌱",
  noise_pollution:            "🔊",
  light_pollution:            "💡",
  visual_pollution:           "👁️",
  thermal_pollution:          "🌡️",
  electromagnetic_pollution:  "📡",
  waste_pollution:            "🗑️",
  other:                      "⚠️",
};

// ── Category thumbnail gradients (used as placeholder when no photo) ──────────
export const CATEGORY_GRADIENT: Record<PollutionCategory, string> = {
  air_pollution:              "from-slate-200  to-slate-100",
  water_pollution:            "from-cyan-200   to-cyan-50",
  soil_pollution:             "from-amber-200  to-amber-50",
  noise_pollution:            "from-purple-200 to-purple-50",
  light_pollution:            "from-yellow-200 to-yellow-50",
  visual_pollution:           "from-pink-200   to-pink-50",
  thermal_pollution:          "from-orange-200 to-orange-50",
  electromagnetic_pollution:  "from-indigo-200 to-indigo-50",
  waste_pollution:            "from-gray-200   to-gray-100",
  other:                      "from-zinc-200   to-zinc-100",
};

// ── Human-readable category labels ───────────────────────────────────────────
export const CATEGORY_LABEL: Record<PollutionCategory, string> = {
  air_pollution:              "Air Pollution",
  water_pollution:            "Water Pollution",
  soil_pollution:             "Soil Pollution",
  noise_pollution:            "Noise Pollution",
  light_pollution:            "Light Pollution",
  visual_pollution:           "Visual Pollution",
  thermal_pollution:          "Thermal Pollution",
  electromagnetic_pollution:  "Electromagnetic Pollution",
  waste_pollution:            "Waste Pollution",
  other:                      "Other Pollution",
};

// ── Waste subtype icons ───────────────────────────────────────────────────────
export const WASTE_TYPE_ICON: Record<WasteType, string> = {
  organic: "🌿",
  plastic: "🧴",
  paper: "📄",
  glass: "🍾",
  metal: "🥫",
  electronic: "💻",

  chemical: "🧪",
  medical: "💉",
  battery: "🔋",
  oil: "🛢️",

  construction: "🧱",
  textile: "👕",
  rubber: "🛞",

  mixed: "🗑️",
  other: "❓",
};

// ── Human-readable waste subtype labels ──────────────────────────────────────
export const WASTE_TYPE_LABEL: Record<WasteType, string> = {
  organic: "Organic",
  plastic: "Plastic",
  paper: "Paper",
  glass: "Glass",
  metal: "Metal",
  electronic: "Electronic",

  chemical: "Chemical",
  medical: "Medical",
  battery: "Battery",
  oil: "Oil",

  construction: "Construction",
  textile: "Textile",
  rubber: "Rubber",

  mixed: "Mixed",
  other: "Other",
};

// ── Helper: combined display label for a report ───────────────────────────────
/**
 * Returns a two-part label for a pollution report.
 *   primary:   e.g. "Waste Pollution"
 *   secondary: e.g. "Organic Waste"  (only present for waste_pollution)
 */
export function getPollutionLabel(
  category: PollutionCategory,
  wasteType?: WasteType | null
): { primary: string; secondary: string | null } {
  return {
    primary:   CATEGORY_LABEL[category] ?? formatCategoryFallback(category),
    secondary: category === "waste_pollution" && wasteType
      ? (WASTE_TYPE_LABEL[wasteType] ?? null)
      : null,
  };
}

/** Fallback formatter for unknown/future category values */
function formatCategoryFallback(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
