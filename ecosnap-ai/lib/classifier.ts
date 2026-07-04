/**
 * =============================================================================
 * EcoSnap AI
 * Smart Pollution Classifier V3
 * =============================================================================
 *
 * Features
 * --------
 * ✅ English + Indonesian
 * ✅ Weighted keyword scoring
 * ✅ Context-aware classification
 * ✅ Waste subtype detection
 * ✅ Confidence score
 * ✅ Negative sentence detection
 * ✅ Easy to replace with Gemini Vision later
 * =============================================================================
 */

import type {
  PollutionCategory,
  WasteType,
} from "@/types/report";

export type {
  PollutionCategory,
  WasteType,
};

/* ============================================================================
 * Classification Result
 * ==========================================================================*/

export interface ClassificationResult {
  category: PollutionCategory;
  waste_type: WasteType | null;
  raw_confidence: number;
  matchedSignals: string[];
}

/* ============================================================================
 * Internal Types
 * ==========================================================================*/

interface CategorySignal {
  keyword: string;
  category: PollutionCategory;
  weight: number;
}

interface WasteSignal {
  keyword: string;
  type: WasteType;
  weight: number;
}

/* ============================================================================
 * Category Signals
 *
 * Higher weight = stronger evidence.
 * ==========================================================================*/

const CATEGORY_SIGNALS: CategorySignal[] = [

  // --------------------------------------------------------------------------
  // AIR POLLUTION
  // --------------------------------------------------------------------------

  { keyword: "smoke", category: "air_pollution", weight: 6 },
  { keyword: "asap", category: "air_pollution", weight: 6 },

  { keyword: "smog", category: "air_pollution", weight: 7 },
  { keyword: "kabut asap", category: "air_pollution", weight: 7 },

  { keyword: "burning", category: "air_pollution", weight: 6 },
  { keyword: "burn", category: "air_pollution", weight: 5 },
  { keyword: "dibakar", category: "air_pollution", weight: 6 },
  { keyword: "pembakaran", category: "air_pollution", weight: 6 },

  { keyword: "factory smoke", category: "air_pollution", weight: 8 },
  { keyword: "industrial smoke", category: "air_pollution", weight: 8 },

  { keyword: "chimney", category: "air_pollution", weight: 5 },
  { keyword: "cerobong", category: "air_pollution", weight: 5 },

  { keyword: "gas leak", category: "air_pollution", weight: 7 },
  { keyword: "emission", category: "air_pollution", weight: 6 },
  { keyword: "exhaust", category: "air_pollution", weight: 6 },

  { keyword: "vehicle smoke", category: "air_pollution", weight: 7 },

  { keyword: "air pollution", category: "air_pollution", weight: 9 },
  { keyword: "polusi udara", category: "air_pollution", weight: 9 },



  // --------------------------------------------------------------------------
  // WATER POLLUTION
  // --------------------------------------------------------------------------

  { keyword: "river", category: "water_pollution", weight: 6 },
  { keyword: "sungai", category: "water_pollution", weight: 6 },

  { keyword: "lake", category: "water_pollution", weight: 6 },
  { keyword: "danau", category: "water_pollution", weight: 6 },

  { keyword: "sea", category: "water_pollution", weight: 6 },
  { keyword: "laut", category: "water_pollution", weight: 6 },

  { keyword: "ocean", category: "water_pollution", weight: 6 },

  { keyword: "water", category: "water_pollution", weight: 2 },
  { keyword: "air", category: "water_pollution", weight: 2 },

  { keyword: "drain", category: "water_pollution", weight: 4 },
  { keyword: "ditch", category: "water_pollution", weight: 4 },
  { keyword: "selokan", category: "water_pollution", weight: 4 },
  { keyword: "parit", category: "water_pollution", weight: 4 },

  { keyword: "oil spill", category: "water_pollution", weight: 8 },

  { keyword: "wastewater", category: "water_pollution", weight: 8 },
  { keyword: "limbah cair", category: "water_pollution", weight: 8 },

  { keyword: "floating", category: "water_pollution", weight: 3 },
  { keyword: "mengapung", category: "water_pollution", weight: 3 },



  // --------------------------------------------------------------------------
  // SOIL POLLUTION
  // --------------------------------------------------------------------------

  { keyword: "soil", category: "soil_pollution", weight: 7 },
  { keyword: "ground", category: "soil_pollution", weight: 5 },
  { keyword: "tanah", category: "soil_pollution", weight: 7 },

  { keyword: "contaminated soil", category: "soil_pollution", weight: 8 },

  { keyword: "land pollution", category: "soil_pollution", weight: 8 },

  { keyword: "chemical spill", category: "soil_pollution", weight: 7 },

  { keyword: "pesticide", category: "soil_pollution", weight: 7 },

  { keyword: "herbicide", category: "soil_pollution", weight: 7 },



  // --------------------------------------------------------------------------
  // NOISE POLLUTION
  // --------------------------------------------------------------------------

  { keyword: "noise", category: "noise_pollution", weight: 8 },
  { keyword: "sound pollution", category: "noise_pollution", weight: 8 },

  { keyword: "bising", category: "noise_pollution", weight: 8 },

  { keyword: "construction noise", category: "noise_pollution", weight: 8 },

  { keyword: "traffic noise", category: "noise_pollution", weight: 8 },



  // --------------------------------------------------------------------------
  // LIGHT POLLUTION
  // --------------------------------------------------------------------------

  { keyword: "light pollution", category: "light_pollution", weight: 8 },

  { keyword: "skyglow", category: "light_pollution", weight: 8 },

  { keyword: "glare", category: "light_pollution", weight: 6 },



  // --------------------------------------------------------------------------
  // THERMAL POLLUTION
  // --------------------------------------------------------------------------

  { keyword: "thermal pollution", category: "thermal_pollution", weight: 9 },

  { keyword: "heat discharge", category: "thermal_pollution", weight: 8 },



  // --------------------------------------------------------------------------
  // ELECTROMAGNETIC POLLUTION
  // --------------------------------------------------------------------------

  { keyword: "electromagnetic", category: "electromagnetic_pollution", weight: 9 },

  { keyword: "electromagnetic radiation", category: "electromagnetic_pollution", weight: 9 },

  { keyword: "emf", category: "electromagnetic_pollution", weight: 8 },

  { keyword: "5g tower", category: "electromagnetic_pollution", weight: 7 },



  // --------------------------------------------------------------------------
  // WASTE POLLUTION
  // --------------------------------------------------------------------------

  { keyword: "trash", category: "waste_pollution", weight: 6 },

  { keyword: "garbage", category: "waste_pollution", weight: 6 },

  { keyword: "rubbish", category: "waste_pollution", weight: 6 },

  { keyword: "waste", category: "waste_pollution", weight: 5 },

  { keyword: "sampah", category: "waste_pollution", weight: 6 },

  { keyword: "limbah", category: "waste_pollution", weight: 5 },

  { keyword: "plastic", category: "waste_pollution", weight: 4 },

  { keyword: "plastik", category: "waste_pollution", weight: 4 },

  { keyword: "bottle", category: "waste_pollution", weight: 3 },

  { keyword: "botol", category: "waste_pollution", weight: 3 },

  { keyword: "bag", category: "waste_pollution", weight: 2 },

  { keyword: "kantong", category: "waste_pollution", weight: 2 },

  { keyword: "illegal dumping", category: "waste_pollution", weight: 9 },

  { keyword: "dumping", category: "waste_pollution", weight: 7 },

  { keyword: "pile of trash", category: "waste_pollution", weight: 8 },

  { keyword: "tumpukan sampah", category: "waste_pollution", weight: 8 },

];

/* ============================================================================
 * Waste Type Signals
 * ==========================================================================*/

const WASTE_SIGNALS: WasteSignal[] = [

  // --------------------------------------------------------------------------
  // ORGANIC
  // --------------------------------------------------------------------------

  { keyword: "organic", type: "organic", weight: 6 },
  { keyword: "food", type: "organic", weight: 5 },
  { keyword: "food waste", type: "organic", weight: 7 },
  { keyword: "fruit", type: "organic", weight: 5 },
  { keyword: "vegetable", type: "organic", weight: 5 },
  { keyword: "compost", type: "organic", weight: 6 },

  { keyword: "organik", type: "organic", weight: 6 },
  { keyword: "makanan", type: "organic", weight: 5 },
  { keyword: "buah", type: "organic", weight: 5 },
  { keyword: "sayur", type: "organic", weight: 5 },



  // --------------------------------------------------------------------------
  // PLASTIC
  // --------------------------------------------------------------------------

  { keyword: "plastic", type: "plastic", weight: 7 },
  { keyword: "plastik", type: "plastic", weight: 7 },
  { keyword: "styrofoam", type: "plastic", weight: 7 },
  { keyword: "polybag", type: "plastic", weight: 6 },
  { keyword: "plastic bag", type: "plastic", weight: 7 },



  // --------------------------------------------------------------------------
  // PAPER
  // --------------------------------------------------------------------------

  { keyword: "paper", type: "paper", weight: 6 },
  { keyword: "cardboard", type: "paper", weight: 7 },
  { keyword: "newspaper", type: "paper", weight: 6 },
  { keyword: "kertas", type: "paper", weight: 6 },
  { keyword: "koran", type: "paper", weight: 6 },



  // --------------------------------------------------------------------------
  // GLASS
  // --------------------------------------------------------------------------

  { keyword: "glass", type: "glass", weight: 6 },
  { keyword: "broken glass", type: "glass", weight: 8 },
  { keyword: "glass bottle", type: "glass", weight: 7 },
  { keyword: "kaca", type: "glass", weight: 6 },



  // --------------------------------------------------------------------------
  // METAL
  // --------------------------------------------------------------------------

  { keyword: "metal", type: "metal", weight: 6 },
  { keyword: "iron", type: "metal", weight: 6 },
  { keyword: "steel", type: "metal", weight: 7 },
  { keyword: "aluminium", type: "metal", weight: 7 },
  { keyword: "besi", type: "metal", weight: 6 },



  // --------------------------------------------------------------------------
  // ELECTRONIC
  // --------------------------------------------------------------------------

  { keyword: "electronic", type: "electronic", weight: 6 },
  { keyword: "electronics", type: "electronic", weight: 6 },
  { keyword: "computer", type: "electronic", weight: 6 },
  { keyword: "laptop", type: "electronic", weight: 6 },
  { keyword: "television", type: "electronic", weight: 6 },
  { keyword: "tv", type: "electronic", weight: 5 },
  { keyword: "printer", type: "electronic", weight: 5 },
  { keyword: "e-waste", type: "electronic", weight: 8 },



  // --------------------------------------------------------------------------
  // HAZARDOUS
  // --------------------------------------------------------------------------

  { keyword: "chemical", type: "hazardous", weight: 7 },
  { keyword: "chemical waste", type: "hazardous", weight: 8 },
  { keyword: "battery", type: "hazardous", weight: 7 },
  { keyword: "acid", type: "hazardous", weight: 6 },
  { keyword: "toxic", type: "hazardous", weight: 8 },

  { keyword: "kimia", type: "hazardous", weight: 7 },
  { keyword: "baterai", type: "hazardous", weight: 7 },
  { keyword: "beracun", type: "hazardous", weight: 8 },



  // --------------------------------------------------------------------------
  // CONSTRUCTION
  // --------------------------------------------------------------------------

  { keyword: "construction", type: "construction", weight: 7 },
  { keyword: "brick", type: "construction", weight: 6 },
  { keyword: "cement", type: "construction", weight: 6 },
  { keyword: "concrete", type: "construction", weight: 6 },

  { keyword: "bangunan", type: "construction", weight: 7 },
  { keyword: "beton", type: "construction", weight: 6 },
  { keyword: "semen", type: "construction", weight: 6 },



  // --------------------------------------------------------------------------
  // MIXED
  // --------------------------------------------------------------------------

  { keyword: "mixed", type: "mixed", weight: 5 },
  { keyword: "mixed waste", type: "mixed", weight: 7 },

  { keyword: "campuran", type: "mixed", weight: 5 },
  { keyword: "sampah campuran", type: "mixed", weight: 7 },

];

/* ============================================================================
 * Configuration
 * ==========================================================================*/

const LOW_CONFIDENCE_THRESHOLD = 6;

/* ============================================================================
 * Negative Keywords
 *
 * Used to detect descriptions that explicitly indicate there is no pollution.
 * ==========================================================================*/

const NEGATIVE_KEYWORDS = [

  "clean",
  "clear",
  "beautiful",
  "healthy",

  "no pollution",
  "not polluted",

  "bersih",
  "rapi",
  "indah",
  "sehat",

  "tidak ada sampah",
  "tidak ada limbah",
  "tidak ada polusi",

];

/* ============================================================================
 * Helpers
 * ==========================================================================*/

function normalizeText(text: string): string {

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

function containsNegativeKeyword(text: string): boolean {

  return NEGATIVE_KEYWORDS.some(keyword =>
    text.includes(keyword)
  );

}

function scoreCategory(text: string) {

  const scores = new Map<PollutionCategory, number>();

  const matchedSignals: string[] = [];

  for (const signal of CATEGORY_SIGNALS) {

    if (text.includes(signal.keyword)) {

      matchedSignals.push(signal.keyword);

      scores.set(
        signal.category,
        (scores.get(signal.category) ?? 0) + signal.weight
      );

    }

  }

  return {

    scores,

    matchedSignals,

  };

}

function scoreWasteType(text: string): WasteType {

  const scores = new Map<WasteType, number>();

  for (const signal of WASTE_SIGNALS) {

    if (text.includes(signal.keyword)) {

      scores.set(
        signal.type,
        (scores.get(signal.type) ?? 0) + signal.weight
      );

    }

  }

  if (scores.size === 0) {

    return "mixed";

  }

  let winner: WasteType = "mixed";

  let highest = -1;

  for (const [type, score] of scores.entries()) {

    if (score > highest) {

      highest = score;

      winner = type;

    }

  }

  return winner;

}

/* ============================================================================
 * Context Rules
 *
 * Context rules are applied AFTER keyword scoring.
 * They boost the most likely category based on combinations
 * of signals rather than individual words.
 * ==========================================================================*/

function applyContextRules(
  text: string,
  scores: Map<PollutionCategory, number>
): void {

  const hasWater =
    /(river|lake|ocean|sea|water|stream|pond|sungai|laut|danau|selokan|parit)/.test(text);

  const hasPlastic =
    /(plastic|plastik|bottle|botol|bag|kantong|styrofoam|polybag)/.test(text);

  const hasTrash =
    /(trash|garbage|waste|rubbish|sampah|limbah)/.test(text);

  const hasSmoke =
    /(smoke|asap|smog|kabut asap)/.test(text);

  const hasBurning =
    /(burn|burning|dibakar|pembakaran|fire|api)/.test(text);

  const hasFactory =
    /(factory|industrial|industry|pabrik)/.test(text);

  const hasChemical =
    /(chemical|kimia|acid|toxic|beracun)/.test(text);

  const hasSoil =
    /(soil|ground|tanah)/.test(text);

  const hasFood =
    /(food|fruit|vegetable|makanan|buah|sayur)/.test(text);

  const hasOil =
    /(oil|oli|minyak)/.test(text);



  // ============================================================
  // Plastic inside river
  // ============================================================

  if (hasPlastic && hasWater) {

    scores.set(
      "water_pollution",
      (scores.get("water_pollution") ?? 0) + 10
    );

  }



  // ============================================================
  // Trash floating on water
  // ============================================================

  if (
    hasTrash &&
    hasWater &&
    /(floating|mengapung)/.test(text)
  ) {

    scores.set(
      "water_pollution",
      (scores.get("water_pollution") ?? 0) + 12
    );

  }



  // ============================================================
  // Burning garbage
  // ============================================================

  if (
    hasBurning &&
    (hasTrash || hasPlastic)
  ) {

    scores.set(
      "air_pollution",
      (scores.get("air_pollution") ?? 0) + 12
    );

  }



  // ============================================================
  // Smoke + Factory
  // ============================================================

  if (
    hasSmoke &&
    hasFactory
  ) {

    scores.set(
      "air_pollution",
      (scores.get("air_pollution") ?? 0) + 10
    );

  }



  // ============================================================
  // Factory wastewater
  // ============================================================

  if (
    hasFactory &&
    hasWater &&
    /(wastewater|limbah cair|dumping|discharge)/.test(text)
  ) {

    scores.set(
      "water_pollution",
      (scores.get("water_pollution") ?? 0) + 12
    );

  }



  // ============================================================
  // Oil spill
  // ============================================================

  if (
    hasOil &&
    hasWater
  ) {

    scores.set(
      "water_pollution",
      (scores.get("water_pollution") ?? 0) + 12
    );

  }



  // ============================================================
  // Chemical contamination on soil
  // ============================================================

  if (
    hasChemical &&
    hasSoil
  ) {

    scores.set(
      "soil_pollution",
      (scores.get("soil_pollution") ?? 0) + 12
    );

  }



  // ============================================================
  // Food waste
  // ============================================================

  if (
    hasFood &&
    hasTrash
  ) {

    scores.set(
      "waste_pollution",
      (scores.get("waste_pollution") ?? 0) + 8
    );

  }



  // ============================================================
  // Noise from construction
  // ============================================================

  if (
    /(construction|bangunan)/.test(text) &&
    /(noise|bising)/.test(text)
  ) {

    scores.set(
      "noise_pollution",
      (scores.get("noise_pollution") ?? 0) + 10
    );

  }



  // ============================================================
  // Thermal discharge
  // ============================================================

  if (
    /(heat|thermal|panas)/.test(text) &&
    hasWater
  ) {

    scores.set(
      "thermal_pollution",
      (scores.get("thermal_pollution") ?? 0) + 10
    );

  }



  // ============================================================
  // Electromagnetic
  // ============================================================

  if (
    /(tower|antenna|5g|wifi|emf|radio)/.test(text)
  ) {

    scores.set(
      "electromagnetic_pollution",
      (scores.get("electromagnetic_pollution") ?? 0) + 8
    );

  }

}

/* ============================================================================
 * Winner Selection
 * ==========================================================================*/

function chooseCategory(
  scores: Map<PollutionCategory, number>
) {

  let bestCategory: PollutionCategory = "other";

  let bestScore = 0;

  for (const [category, score] of scores.entries()) {

    if (score > bestScore) {

      bestScore = score;

      bestCategory = category;

    }

  }

  if (bestScore < LOW_CONFIDENCE_THRESHOLD) {

    return {

      category: "other" as PollutionCategory,

      score: bestScore,

    };

  }

  return {

    category: bestCategory,

    score: bestScore,

  };

}

/* ============================================================================
 * Confidence Calculation
 * ==========================================================================*/

function calculateConfidence(
  score: number,
  matchedSignals: number
): number {

  let confidence = 35;

  confidence += score * 6;

  confidence += matchedSignals * 3;

  if (confidence > 99) confidence = 99;

  if (confidence < 30) confidence = 30;

  return Math.round(confidence);

}

/* ============================================================================
 * MAIN CLASSIFIER
 * ==========================================================================*/

export function classify(
  description: string,
  imageHint?: string
): ClassificationResult {

  //--------------------------------------------------
  // Normalize
  //--------------------------------------------------

  const text = normalizeText(
    [imageHint, description]
      .filter(Boolean)
      .join(" ")
  );

  //--------------------------------------------------
  // Negative sentences
  //--------------------------------------------------

  const negativeKeywords = [
    "clean",
    "beautiful",
    "healthy",
    "no pollution",
    "tidak ada sampah",
    "bersih",
    "rapi",
    "indah",
    "sehat",
  ];

  for (const keyword of negativeKeywords) {

    if (text.includes(keyword)) {

      return {
        category: "other",
        waste_type: null,
        raw_confidence: 25,
        matchedSignals: [],
      };

    }

  }

  //--------------------------------------------------
  // Base score
  //--------------------------------------------------

  const {
    scores,
    matchedSignals,
  } = scoreCategory(text);

  //--------------------------------------------------
  // Context rules
  //--------------------------------------------------

  applyContextRules(text, scores);

  //--------------------------------------------------
  // Winner
  //--------------------------------------------------

  const {
    category,
    score,
  } = chooseCategory(scores);

  //--------------------------------------------------
  // Waste subtype
  //--------------------------------------------------

  let waste_type: WasteType | null = null;

  if (category === "waste_pollution") {

    waste_type = scoreWasteType(text);

  }

  //--------------------------------------------------
  // Confidence
  //--------------------------------------------------

  const raw_confidence = calculateConfidence(
    score,
    matchedSignals.length
  );

  //--------------------------------------------------
  // Result
  //--------------------------------------------------

  return {

    category,

    waste_type,

    raw_confidence,

    matchedSignals,

  };

}

/* ============================================================================
 * Backward Compatibility
 * ==========================================================================*/

export function classifyCategory(
  description: string
): PollutionCategory {

  return classify(description).category;

}