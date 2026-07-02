/**
 * lib/classifier.ts
 *
 * Context-aware pollution classifier — multi-signal scoring approach.
 *
 * Instead of returning the first matching category, every signal in the
 * description is evaluated against ALL categories simultaneously. Each
 * matching signal awards weighted points to its target category.
 * The category with the most points wins.
 *
 * Cross-context rules:
 *   "plastic floating in river"  → water_pollution  (water signals outweigh plastic waste signals)
 *   "burning plastic"            → air_pollution     (burning/smoke signals outweigh plastic waste)
 *   "oil leaking into river"     → water_pollution
 *   "factory smoke"              → air_pollution
 *   "organic vegetables dumped"  → waste_pollution / organic
 *
 * Falls back to "other" only when total evidence is very weak (< LOW_CONFIDENCE_THRESHOLD points).
 *
 * Upgradeable: replace classify() with a real AI call without changing callers.
 */

import type { PollutionCategory, WasteType } from "@/types/report";

export type { PollutionCategory, WasteType };

// ── Classification result ─────────────────────────────────────────────────────
export interface ClassificationResult {
  category:   PollutionCategory;
  waste_type: WasteType | null;  // only set when category === "waste_pollution"
  /** 0–100 confidence derived from the evidence score */
  raw_confidence: number;
}

// ── Scoring signal definitions ────────────────────────────────────────────────

interface Signal {
  /** Keyword or phrase to match (case-insensitive substring) */
  keyword: string;
  /** Target pollution category */
  category: PollutionCategory;
  /** Point weight — higher = stronger evidence */
  weight: number;
}

/**
 * Comprehensive signal table.
 * Signals are NOT mutually exclusive — a description like "burning plastic"
 * will score points for BOTH air_pollution (via "burning") AND waste_pollution
 * (via "plastic"), and the highest-scoring category wins.
 *
 * Weight guide:
 *   3 = definitive indicator (only ever means this category)
 *   2 = strong indicator
 *   1 = supporting context (word is relevant but not conclusive alone)
 */
const SIGNALS: Signal[] = [
  // ── Air pollution ──────────────────────────────────────────────────────────
  { keyword: "smoke",            category: "air_pollution",  weight: 3 },
  { keyword: "smog",             category: "air_pollution",  weight: 3 },
  { keyword: "haze",             category: "air_pollution",  weight: 3 },
  { keyword: "exhaust",          category: "air_pollution",  weight: 3 },
  { keyword: "fume",             category: "air_pollution",  weight: 3 },
  { keyword: "emission",         category: "air_pollution",  weight: 3 },
  { keyword: "air quality",      category: "air_pollution",  weight: 3 },
  { keyword: "toxic air",        category: "air_pollution",  weight: 3 },
  { keyword: "gas leak",         category: "air_pollution",  weight: 3 },
  { keyword: "chemical cloud",   category: "air_pollution",  weight: 3 },
  { keyword: "particulate",      category: "air_pollution",  weight: 2 },
  { keyword: "dust cloud",       category: "air_pollution",  weight: 2 },
  { keyword: "wildfire",         category: "air_pollution",  weight: 2 },
  { keyword: "burning",          category: "air_pollution",  weight: 2 }, // see cross-context note below
  { keyword: "on fire",          category: "air_pollution",  weight: 2 },
  { keyword: "incinerat",        category: "air_pollution",  weight: 2 },
  { keyword: "combustion",       category: "air_pollution",  weight: 2 },
  { keyword: "ash",              category: "air_pollution",  weight: 1 },
  { keyword: "factory",          category: "air_pollution",  weight: 1 }, // factory alone → air
  { keyword: "chimney",          category: "air_pollution",  weight: 1 },
  { keyword: "stack",            category: "air_pollution",  weight: 1 },

  // ── Water pollution ────────────────────────────────────────────────────────
  { keyword: "river",            category: "water_pollution", weight: 3 },
  { keyword: "lake",             category: "water_pollution", weight: 3 },
  { keyword: "ocean",            category: "water_pollution", weight: 3 },
  { keyword: "sea",              category: "water_pollution", weight: 3 },
  { keyword: "stream",           category: "water_pollution", weight: 3 },
  { keyword: "creek",            category: "water_pollution", weight: 3 },
  { keyword: "pond",             category: "water_pollution", weight: 3 },
  { keyword: "waterway",         category: "water_pollution", weight: 3 },
  { keyword: "estuary",          category: "water_pollution", weight: 3 },
  { keyword: "water contamination", category: "water_pollution", weight: 3 },
  { keyword: "oil spill",        category: "water_pollution", weight: 3 },
  { keyword: "algae bloom",      category: "water_pollution", weight: 3 },
  { keyword: "sewage",           category: "water_pollution", weight: 3 },
  { keyword: "wastewater",       category: "water_pollution", weight: 3 },
  { keyword: "effluent",         category: "water_pollution", weight: 3 },
  { keyword: "drain discharge",  category: "water_pollution", weight: 3 },
  { keyword: "groundwater",      category: "water_pollution", weight: 3 },
  { keyword: "water supply",     category: "water_pollution", weight: 2 },
  { keyword: "floating in water",category: "water_pollution", weight: 3 },
  { keyword: "into the water",   category: "water_pollution", weight: 3 },
  { keyword: "leaking into",     category: "water_pollution", weight: 2 },
  { keyword: "water",            category: "water_pollution", weight: 1 }, // generic — low weight

  // ── Soil pollution ─────────────────────────────────────────────────────────
  { keyword: "soil",                    category: "soil_pollution", weight: 3 },
  { keyword: "ground contamination",    category: "soil_pollution", weight: 3 },
  { keyword: "land pollution",          category: "soil_pollution", weight: 3 },
  { keyword: "contaminated soil",       category: "soil_pollution", weight: 3 },
  { keyword: "contaminated land",       category: "soil_pollution", weight: 3 },
  { keyword: "chemical spill on ground",category: "soil_pollution", weight: 3 },
  { keyword: "leachate",                category: "soil_pollution", weight: 3 },
  { keyword: "heavy metal soil",        category: "soil_pollution", weight: 3 },
  { keyword: "pesticide",               category: "soil_pollution", weight: 2 },
  { keyword: "herbicide",               category: "soil_pollution", weight: 2 },
  { keyword: "industrial leak",         category: "soil_pollution", weight: 2 },
  { keyword: "acid soil",               category: "soil_pollution", weight: 2 },
  { keyword: "seeping",                 category: "soil_pollution", weight: 1 },
  { keyword: "underground",             category: "soil_pollution", weight: 1 },

  // ── Noise pollution ────────────────────────────────────────────────────────
  { keyword: "noise",           category: "noise_pollution", weight: 3 },
  { keyword: "sound pollution", category: "noise_pollution", weight: 3 },
  { keyword: "loud",            category: "noise_pollution", weight: 3 },
  { keyword: "industrial noise",category: "noise_pollution", weight: 3 },
  { keyword: "construction noise", category: "noise_pollution", weight: 3 },
  { keyword: "traffic noise",   category: "noise_pollution", weight: 3 },
  { keyword: "machine noise",   category: "noise_pollution", weight: 3 },
  { keyword: "jackhammer",      category: "noise_pollution", weight: 3 },
  { keyword: "generator noise", category: "noise_pollution", weight: 3 },
  { keyword: "blasting",        category: "noise_pollution", weight: 2 },
  { keyword: "vibration",       category: "noise_pollution", weight: 1 },

  // ── Light pollution ────────────────────────────────────────────────────────
  { keyword: "light pollution",     category: "light_pollution", weight: 3 },
  { keyword: "skyglow",             category: "light_pollution", weight: 3 },
  { keyword: "glare",               category: "light_pollution", weight: 3 },
  { keyword: "excessive lighting",  category: "light_pollution", weight: 3 },
  { keyword: "artificial light",    category: "light_pollution", weight: 3 },
  { keyword: "over-illumination",   category: "light_pollution", weight: 3 },
  { keyword: "light trespass",      category: "light_pollution", weight: 3 },

  // ── Thermal pollution ──────────────────────────────────────────────────────
  { keyword: "thermal pollution",   category: "thermal_pollution", weight: 3 },
  { keyword: "heat discharge",      category: "thermal_pollution", weight: 3 },
  { keyword: "warm water discharge",category: "thermal_pollution", weight: 3 },
  { keyword: "cooling water",       category: "thermal_pollution", weight: 3 },
  { keyword: "thermal effluent",    category: "thermal_pollution", weight: 3 },
  { keyword: "heat island",         category: "thermal_pollution", weight: 3 },
  { keyword: "hot water outlet",    category: "thermal_pollution", weight: 3 },

  // ── Electromagnetic pollution ──────────────────────────────────────────────
  { keyword: "electromagnetic",      category: "electromagnetic_pollution", weight: 3 },
  { keyword: "emf",                  category: "electromagnetic_pollution", weight: 3 },
  { keyword: "radio wave",           category: "electromagnetic_pollution", weight: 3 },
  { keyword: "microwave pollution",  category: "electromagnetic_pollution", weight: 3 },
  { keyword: "5g tower",             category: "electromagnetic_pollution", weight: 3 },
  { keyword: "power line radiation", category: "electromagnetic_pollution", weight: 3 },
  { keyword: "wifi pollution",       category: "electromagnetic_pollution", weight: 3 },
  { keyword: "rf emission",          category: "electromagnetic_pollution", weight: 3 },
  { keyword: "radiation",            category: "electromagnetic_pollution", weight: 2 },

  // ── Waste pollution ────────────────────────────────────────────────────────
  { keyword: "trash",         category: "waste_pollution", weight: 3 },
  { keyword: "garbage",       category: "waste_pollution", weight: 3 },
  { keyword: "rubbish",       category: "waste_pollution", weight: 3 },
  { keyword: "litter",        category: "waste_pollution", weight: 3 },
  { keyword: "dumping",       category: "waste_pollution", weight: 3 },
  { keyword: "dumped",        category: "waste_pollution", weight: 3 },
  { keyword: "junk",          category: "waste_pollution", weight: 3 },
  { keyword: "pile of",       category: "waste_pollution", weight: 3 },
  { keyword: "heap of",       category: "waste_pollution", weight: 3 },
  { keyword: "scattered waste", category: "waste_pollution", weight: 3 },
  { keyword: "food waste",    category: "waste_pollution", weight: 3 },
  { keyword: "organic waste", category: "waste_pollution", weight: 3 },
  { keyword: "plastic waste", category: "waste_pollution", weight: 3 },
  { keyword: "toxic waste",   category: "waste_pollution", weight: 3 },
  { keyword: "hazardous waste",category: "waste_pollution", weight: 3 },
  { keyword: "e-waste",       category: "waste_pollution", weight: 3 },
  { keyword: "medical waste", category: "waste_pollution", weight: 3 },
  { keyword: "construction debris", category: "waste_pollution", weight: 3 },
  { keyword: "broken glass",  category: "waste_pollution", weight: 3 },
  { keyword: "debris",        category: "waste_pollution", weight: 2 },
  { keyword: "discard",       category: "waste_pollution", weight: 2 },
  { keyword: "abandon",       category: "waste_pollution", weight: 2 },
  { keyword: "tossed",        category: "waste_pollution", weight: 2 },
  { keyword: "rotting",       category: "waste_pollution", weight: 2 },
  { keyword: "decomposing",   category: "waste_pollution", weight: 2 },
  { keyword: "rotten",        category: "waste_pollution", weight: 2 },
  { keyword: "food scraps",   category: "waste_pollution", weight: 2 },
  { keyword: "spoiled",       category: "waste_pollution", weight: 2 },
  { keyword: "scattered",     category: "waste_pollution", weight: 1 },
  { keyword: "waste",         category: "waste_pollution", weight: 1 }, // generic
  { keyword: "dump",          category: "waste_pollution", weight: 1 },
  // Material-type keywords: low weight so they don't override environmental context
  // but enough to push "plastic bags scattered" into waste_pollution territory
  { keyword: "plastic",       category: "waste_pollution", weight: 2 },
  { keyword: "cardboard",     category: "waste_pollution", weight: 2 },
  { keyword: "mixed waste",   category: "waste_pollution", weight: 3 },
  { keyword: "mixed garbage", category: "waste_pollution", weight: 3 },
  { keyword: "rubble",        category: "waste_pollution", weight: 2 },
  { keyword: "vegetables",    category: "waste_pollution", weight: 1 }, // very low — needs co-signals
];

// Threshold below which we return "other" — requires at least 2 weight points
const LOW_CONFIDENCE_THRESHOLD = 2;

// ── Waste subtype detection ───────────────────────────────────────────────────

interface WasteSignal {
  keyword: string;
  type:    WasteType;
  weight:  number;
}

const WASTE_SIGNALS: WasteSignal[] = [
  // Organic
  { keyword: "organic",        type: "organic", weight: 3 },
  { keyword: "food",           type: "organic", weight: 2 },
  { keyword: "vegetable",      type: "organic", weight: 2 },
  { keyword: "fruit",          type: "organic", weight: 2 },
  { keyword: "rotting",        type: "organic", weight: 2 },
  { keyword: "rotten",         type: "organic", weight: 2 },
  { keyword: "decompos",       type: "organic", weight: 2 },
  { keyword: "compost",        type: "organic", weight: 2 },
  { keyword: "kitchen waste",  type: "organic", weight: 3 },
  { keyword: "biodegradable",  type: "organic", weight: 2 },
  { keyword: "animal waste",   type: "organic", weight: 3 },
  { keyword: "manure",         type: "organic", weight: 3 },
  { keyword: "plant debris",   type: "organic", weight: 2 },
  { keyword: "garden waste",   type: "organic", weight: 3 },
  { keyword: "food scraps",    type: "organic", weight: 3 },
  { keyword: "spoiled",        type: "organic", weight: 2 },
  // Plastic
  { keyword: "plastic",        type: "plastic", weight: 2 },
  { keyword: "polystyrene",    type: "plastic", weight: 3 },
  { keyword: "styrofoam",      type: "plastic", weight: 3 },
  { keyword: "pvc",            type: "plastic", weight: 3 },
  { keyword: "polyethylene",   type: "plastic", weight: 3 },
  { keyword: "nylon",          type: "plastic", weight: 2 },
  { keyword: "packaging",      type: "plastic", weight: 1 },
  // Paper
  { keyword: "paper",          type: "paper",   weight: 2 },
  { keyword: "cardboard",      type: "paper",   weight: 3 },
  { keyword: "newspaper",      type: "paper",   weight: 3 },
  { keyword: "magazine",       type: "paper",   weight: 2 },
  { keyword: "carton",         type: "paper",   weight: 2 },
  { keyword: "tissue",         type: "paper",   weight: 2 },
  // Glass
  { keyword: "glass",          type: "glass",   weight: 2 },
  { keyword: "broken glass",   type: "glass",   weight: 3 },
  { keyword: "bottle glass",   type: "glass",   weight: 3 },
  { keyword: "mirror",         type: "glass",   weight: 2 },
  { keyword: "window glass",   type: "glass",   weight: 3 },
  // Metal
  { keyword: "metal",          type: "metal",   weight: 2 },
  { keyword: "steel",          type: "metal",   weight: 3 },
  { keyword: "iron",           type: "metal",   weight: 2 },
  { keyword: "aluminium",      type: "metal",   weight: 3 },
  { keyword: "aluminum",       type: "metal",   weight: 3 },
  { keyword: "copper",         type: "metal",   weight: 2 },
  { keyword: "scrap metal",    type: "metal",   weight: 3 },
  { keyword: "tin",            type: "metal",   weight: 2 },
  // Electronic
  { keyword: "electronic waste", type: "electronic", weight: 3 },
  { keyword: "e-waste",        type: "electronic", weight: 3 },
  { keyword: "circuit board",  type: "electronic", weight: 3 },
  { keyword: "computer",       type: "electronic", weight: 2 },
  { keyword: "laptop",         type: "electronic", weight: 2 },
  { keyword: "television",     type: "electronic", weight: 2 },
  { keyword: "printer",        type: "electronic", weight: 2 },
  { keyword: "battery",        type: "electronic", weight: 2 },
  // Hazardous
  { keyword: "hazardous",      type: "hazardous", weight: 3 },
  { keyword: "toxic",          type: "hazardous", weight: 3 },
  { keyword: "toxic waste",    type: "hazardous", weight: 3 },
  { keyword: "chemical waste", type: "hazardous", weight: 3 },
  { keyword: "acid",           type: "hazardous", weight: 2 },
  { keyword: "poison",         type: "hazardous", weight: 2 },
  { keyword: "pharmaceutical", type: "hazardous", weight: 2 },
  { keyword: "pesticide waste",type: "hazardous", weight: 3 },
  { keyword: "paint",          type: "hazardous", weight: 2 },
  { keyword: "solvent",        type: "hazardous", weight: 2 },
  { keyword: "flammable",      type: "hazardous", weight: 2 },
  // Construction
  { keyword: "construction",   type: "construction", weight: 2 },
  { keyword: "rubble",         type: "construction", weight: 3 },
  { keyword: "concrete",       type: "construction", weight: 2 },
  { keyword: "brick",          type: "construction", weight: 2 },
  { keyword: "cement",         type: "construction", weight: 2 },
  { keyword: "demolition",     type: "construction", weight: 3 },
  { keyword: "renovation waste", type: "construction", weight: 3 },
  { keyword: "building waste", type: "construction", weight: 3 },
  // Mixed
  { keyword: "mixed waste",    type: "mixed", weight: 3 },
  { keyword: "mixed garbage",  type: "mixed", weight: 3 },
  { keyword: "mixed rubbish",  type: "mixed", weight: 3 },
];

// ── Scoring engine ────────────────────────────────────────────────────────────

function scoreSignals(lower: string): Map<PollutionCategory, number> {
  const scores = new Map<PollutionCategory, number>();
  for (const { keyword, category, weight } of SIGNALS) {
    if (lower.includes(keyword)) {
      scores.set(category, (scores.get(category) ?? 0) + weight);
    }
  }
  return scores;
}

function scoreWasteType(lower: string): WasteType {
  const scores = new Map<WasteType, number>();
  for (const { keyword, type, weight } of WASTE_SIGNALS) {
    if (lower.includes(keyword)) {
      scores.set(type, (scores.get(type) ?? 0) + weight);
    }
  }
  if (scores.size === 0) return "mixed";
  return [...scores.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// ── Main classifier ────────────────────────────────────────────────────────────

/**
 * Classifies pollution using multi-signal scoring.
 * Every keyword in the description contributes weighted evidence to candidate
 * categories. The highest-scoring category wins.
 *
 * @param description - Free-text description from the user
 * @param imageHint   - Optional string derived from image metadata / filename
 *                      (prepended to description for additional context)
 */
export function classify(
  description: string,
  imageHint?: string
): ClassificationResult {
  // Combine description with any image-derived hint
  const combined = [imageHint, description].filter(Boolean).join(" ");
  const lower    = combined.toLowerCase().trim();

  // Score all categories
  const scores = scoreSignals(lower);

  // Find the winning category
  let bestCategory: PollutionCategory = "other";
  let bestScore = 0;
  for (const [category, pts] of scores.entries()) {
    if (pts > bestScore) {
      bestScore    = pts;
      bestCategory = category;
    }
  }

  // Below the confidence threshold → fall back to "other"
  if (bestScore < LOW_CONFIDENCE_THRESHOLD) {
    bestCategory = "other";
  }

  // Determine waste subtype if applicable
  const waste_type =
    bestCategory === "waste_pollution" ? scoreWasteType(lower) : null;

  // Derive confidence: clamp score → 0–100 scale
  // Score of 2 = 50 %, score of 10+ = 98 %
  const raw_confidence = Math.min(98, Math.round(40 + bestScore * 6));

  return { category: bestCategory, waste_type, raw_confidence };
}

/**
 * Convenience: returns only the PollutionCategory.
 * Kept for backward-compatibility with scorer / recommender callers.
 */
export function classifyCategory(description: string): PollutionCategory {
  return classify(description).category;
}
