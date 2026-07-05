/**
 * ============================================================================
 * EcoSnap AI
 * Classifier V4 Ultimate
 * ----------------------------------------------------------------------------
 * Features
 * ----------------------------------------------------------------------------
 * ✔ English + Indonesian
 * ✔ Synonym Engine
 * ✔ Phrase Matching
 * ✔ Regex Matching
 * ✔ Weighted Category Scoring
 * ✔ Waste Type Detection
 * ✔ Severity Detection
 * ✔ Confidence Engine
 * ✔ Context Rules
 * ✔ Anti False Positive
 * ✔ Easily replaceable by Gemini Vision
 *
 * Compatible:
 * Next.js 15
 * React 19
 * TypeScript 5+
 * ============================================================================
 */

export type PollutionCategory =
  | "air_pollution"
  | "water_pollution"
  | "soil_pollution"
  | "waste_pollution"
  | "noise_pollution"
  | "light_pollution"
  | "thermal_pollution"
  | "electromagnetic_pollution"
  | "visual_pollution"
  | "other";

export type WasteType =
  | "plastic"
  | "organic"
  | "paper"
  | "metal"
  | "glass"
  | "electronic"
  | "chemical"
  | "medical"
  | "construction"
  | "mixed"
  | "other";

export interface ClassificationResult {
  category: PollutionCategory;
  waste_type: WasteType;
  raw_confidence: number;
  matchedSignals: string[];
}

interface MatchResult {
  score: number;
  signals: string[];
}
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "at",
  "with",
  "for",
  "yang",
  "dan",
  "di",
  "ke",
  "dari",
  "itu",
  "ini",
  "ada",
  "sangat",
]);
export function tokenize(text: string): string[] {
  return canonicalize(
    normalize(text).split(/\s+/)
  )
    .filter((t) => t.length > 1)
    .filter((t) => !STOP_WORDS.has(t));
}
const SYNONYMS: Record<string, string[]> = {
  smoke: [
    "smoke",
    "fumes",
    "emission",
    "emissions",
    "asap",
    "kepulan asap",
    "black smoke",
    "thick smoke",
    "dark smoke",
    "gas buang",
  ],

  river: [
    "river",
    "stream",
    "lake",
    "canal",
    "drain",
    "sungai",
    "selokan",
    "parit",
    "danau",
  ],

  plastic: [
    "plastic",
    "plastik",
    "bottle",
    "botol",
    "cup",
    "gelas plastik",
    "plastic bag",
    "kantong plastik",
    "styrofoam",
    "straw",
    "sedotan",
  ],

  garbage: [
    "garbage",
    "trash",
    "waste",
    "rubbish",
    "litter",
    "sampah",
    "limbah",
    "buangan",
  ],

  burning: [
    "burning",
    "burn",
    "dibakar",
    "membakar",
    "terbakar",
  ],

  dirty: [
    "dirty",
    "polluted",
    "contaminated",
    "kotor",
    "tercemar",
    "bau",
    "berbau",
  ],

  factory: [
    "factory",
    "industry",
    "industrial",
    "pabrik",
    "industri",
  ],

  loud: [
    "loud",
    "noise",
    "noisy",
    "berisik",
    "bising",
    "keras",
  ],

  light: [
    "bright",
    "lamp",
    "lighting",
    "light",
    "lampu",
    "cahaya",
    "silau",
  ],

  electronic: [
    "battery",
    "computer",
    "phone",
    "tv",
    "monitor",
    "electronic",
    "e waste",
    "e-waste",
    "elektronik",
    "baterai",
  ],
};
const SYNONYM_LOOKUP: Record<string, string> = {};

for (const [canonical, words] of Object.entries(SYNONYMS)) {
  for (const word of words) {
    SYNONYM_LOOKUP[word] = canonical;
  }
}
function canonicalize(tokens: string[]): string[] {
  return tokens.map((t) => SYNONYM_LOOKUP[t] ?? t);
}
function containsPhrase(
  text: string,
  phrases: string[]
): string[] {
  const found: string[] = [];

  for (const phrase of phrases) {
    if (text.includes(phrase)) {
      found.push(phrase);
    }
  }

  return found;
}
function keywordScore(
  text: string,
  keywords: string[],
  weight = 1
): MatchResult {

  const normalized = normalize(text);

  let score = 0;

  const signals: string[] = [];

  for (const keyword of keywords) {
    if (normalized.includes(keyword)) {
      score += weight;
      signals.push(keyword);
    }
  }

  return {
    score,
    signals,
  };
}
function regexScore(
  text: string,
  patterns: RegExp[],
  weight = 2
): MatchResult {

  let score = 0;

  const signals: string[] = [];

  for (const pattern of patterns) {
    const matches = text.match(pattern);

    if (matches) {
      score += weight * matches.length;
      signals.push(pattern.source);
    }
  }

  return {
    score,
    signals,
  };
}
/* ============================================================================
 * CATEGORY KNOWLEDGE BASE
 * ==========================================================================*/

interface CategoryRule {
  keywords: string[];
  phrases: string[];
  regex: RegExp[];
  weight: number;
}

const CATEGORY_RULES: Record<PollutionCategory, CategoryRule> = {

  air_pollution: {

    weight: 5,

    keywords: [

      "smoke",
      "asap",
      "emission",
      "gas",
      "fumes",
      "chimney",
      "factory",
      "dust",
      "vehicle",
      "diesel",
      "burn",
      "burning",
      "fire",
      "coal",
      "carbon",
      "soot",
      "odor",
      "bau",
      "industrial",
      "air"

    ],

    phrases: [

      "black smoke",

      "thick smoke",

      "burning trash",

      "burning plastic",

      "factory smoke",

      "vehicle emission",

      "toxic gas",

      "air pollution"

    ],

    regex: [

      /smok(e|ing)/gi,

      /emission(s)?/gi,

      /burn(ing)?/gi

    ]

  },

  water_pollution: {

    weight: 5,

    keywords: [

      "river",

      "lake",

      "canal",

      "drain",

      "stream",

      "water",

      "oil",

      "foam",

      "chemical",

      "wastewater",

      "sewage",

      "floating",

      "fish",

      "dead fish",

      "spill",

      "sungai",

      "air",

      "selokan",

      "parit",

      "limbah"

    ],

    phrases: [

      "oil spill",

      "dead fish",

      "dirty river",

      "floating trash",

      "chemical waste",

      "river pollution",

      "plastic floating"

    ],

    regex: [

      /river/gi,

      /water/gi,

      /spill/gi

    ]

  },

  soil_pollution: {

    weight: 4,

    keywords: [

      "soil",

      "ground",

      "land",

      "earth",

      "contaminated",

      "fertilizer",

      "pesticide",

      "dump",

      "illegal dumping",

      "landfill",

      "tanah",

      "lahan"

    ],

    phrases: [

      "contaminated soil",

      "illegal dumping",

      "chemical soil"

    ],

    regex: [

      /soil/gi,

      /ground/gi

    ]

  },

  waste_pollution: {

    weight: 6,

    keywords: [

      "garbage",

      "trash",

      "waste",

      "plastic",

      "bottle",

      "bag",

      "styrofoam",

      "paper",

      "glass",

      "can",

      "organic",

      "rubbish",

      "litter",

      "sampah",

      "plastik",

      "limbah",

      "botol"

    ],

    phrases: [

      "plastic bottle",

      "plastic waste",

      "garbage pile",

      "illegal waste",

      "overflowing trash",

      "mixed waste"

    ],

    regex: [

      /trash/gi,

      /garbage/gi,

      /plastic/gi

    ]

  },

  noise_pollution: {

    weight: 4,

    keywords: [

      "noise",

      "loud",

      "speaker",

      "horn",

      "music",

      "machine",

      "generator",

      "construction",

      "berisik",

      "bising"

    ],

    phrases: [

      "construction noise",

      "loud music",

      "vehicle horn"

    ],

    regex: [

      /noise/gi,

      /loud/gi

    ]

  },

  light_pollution: {

    weight: 3,

    keywords: [

      "light",

      "lamp",

      "lighting",

      "bright",

      "spotlight",

      "led",

      "billboard",

      "cahaya",

      "lampu",

      "silau"

    ],

    phrases: [

      "too bright",

      "street light",

      "light pollution"

    ],

    regex: [

      /bright/gi

    ]

  },

  thermal_pollution: {

    weight: 4,

    keywords: [

      "hot water",

      "warm water",

      "thermal",

      "heat",

      "steam",

      "cooling",

      "boiler"

    ],

    phrases: [

      "hot wastewater",

      "thermal pollution"

    ],

    regex: [

      /thermal/gi

    ]

  },

  electromagnetic_pollution: {

    weight: 2,

    keywords: [

      "tower",

      "antenna",

      "cell tower",

      "wifi",

      "radiation",

      "signal",

      "electromagnetic"

    ],

    phrases: [

      "cell tower"

    ],

    regex: [

      /antenna/gi

    ]

  },

  visual_pollution: {

    weight: 2,

    keywords: [

      "billboard",

      "poster",

      "banner",

      "messy",

      "visual",

      "graffiti",

      "advertisement"

    ],

    phrases: [

      "too many billboards"

    ],

    regex: [

      /billboard/gi

    ]

  },

  other: {

    weight: 1,

    keywords: [],

    phrases: [],

    regex: []

  }

};
/* ============================================================================
 * CATEGORY SCORING ENGINE
 * ==========================================================================*/

function scoreCategory(
  text: string,
  category: PollutionCategory
): MatchResult {

  const rule = CATEGORY_RULES[category];

  let total = 0;

  const signals: string[] = [];

  const kw = keywordScore(
    text,
    rule.keywords,
    rule.weight
  );

  total += kw.score;

  signals.push(...kw.signals);

  const rg = regexScore(
    text,
    rule.regex,
    rule.weight
  );

  total += rg.score;

  signals.push(...rg.signals);

  const ph = containsPhrase(
    normalize(text),
    rule.phrases
  );

  total += ph.length * rule.weight * 3;

  signals.push(...ph);

  return {

    score: total,

    signals

  };

}
/* ============================================================================
 * FIND BEST CATEGORY
 * ==========================================================================*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  function detectCategory(text: string): {

  category: PollutionCategory;

  score: number;

  signals: string[];

} {

  let bestCategory: PollutionCategory = "other";

  let highestScore = 0;

  let matchedSignals: string[] = [];

  const categories = Object.keys(
    CATEGORY_RULES
  ) as PollutionCategory[];

  for (const category of categories) {

    if (category === "other") continue;

    const result = scoreCategory(
      text,
      category
    );

    if (result.score > highestScore) {

      highestScore = result.score;

      bestCategory = category;

      matchedSignals = result.signals;

    }

  }

  return {

    category: bestCategory,

    score: highestScore,

    signals: matchedSignals

  };

}
/* ============================================================================
 * WASTE TYPE ENGINE
 * ==========================================================================*/

interface WasteRule {
  keywords: string[];
}

const WASTE_RULES: Record<WasteType, WasteRule> = {

  plastic: {
    keywords: [
      "plastic",
      "plastik",
      "bottle",
      "botol",
      "cup",
      "gelas",
      "straw",
      "sedotan",
      "bag",
      "kantong",
      "styrofoam",
      "wrapper",
      "packaging"
    ]
  },

  organic: {
    keywords: [
      "leaf",
      "leaves",
      "wood",
      "tree",
      "food",
      "fruit",
      "vegetable",
      "organic",
      "daun",
      "buah",
      "ranting",
      "makanan"
    ]
  },

  paper: {
    keywords: [
      "paper",
      "cardboard",
      "newspaper",
      "book",
      "paper bag",
      "kertas",
      "koran"
    ]
  },

  glass: {
    keywords: [
      "glass",
      "bottle glass",
      "jar",
      "broken glass",
      "kaca"
    ]
  },

  metal: {
    keywords: [
      "metal",
      "iron",
      "steel",
      "aluminium",
      "can",
      "kaleng",
      "besi"
    ]
  },

  electronic: {
    keywords: [
      "battery",
      "computer",
      "monitor",
      "phone",
      "television",
      "tv",
      "printer",
      "keyboard",
      "laptop",
      "electronic",
      "e waste",
      "e-waste",
      "baterai"
    ]
  },

  chemical: {
    keywords: [
      "chemical",
      "acid",
      "oil",
      "fuel",
      "diesel",
      "gasoline",
      "paint",
      "mercury",
      "oli",
      "bahan kimia"
    ]
  },

  medical: {
    keywords: [
      "hospital",
      "mask",
      "needle",
      "syringe",
      "bandage",
      "medicine",
      "medical",
      "jarum",
      "masker"
    ]
  },

  construction: {
    keywords: [
      "cement",
      "brick",
      "concrete",
      "sand",
      "construction",
      "bangunan",
      "beton",
      "batu bata"
    ]
  },

  mixed: {
    keywords: []
  },

  other: {
    keywords: []
  }

};
function detectWasteType(text: string): WasteType {

  const normalized = normalize(text);

  let highest = 0;

  let best: WasteType = "other";

  for (const [type, rule] of Object.entries(WASTE_RULES)) {

    let score = 0;

    for (const keyword of rule.keywords) {

      if (normalized.includes(keyword)) {

        score++;

      }

    }

    if (score > highest) {

      highest = score;

      best = type as WasteType;

    }

  }

  return best;

}
/* ============================================================================
 * SEVERITY ENGINE
 * ==========================================================================*/

const SEVERITY_KEYWORDS = [

  "huge",
  "massive",
  "large",
  "many",
  "thousands",
  "overflowing",
  "overflow",
  "everywhere",
  "serious",
  "critical",
  "extreme",
  "very",

  "besar",
  "parah",
  "sangat",
  "menumpuk",
  "meluap",
  "banyak",
  "luas"

];
function severityScore(text: string): number {

  const normalized = normalize(text);

  let score = 0;

  for (const word of SEVERITY_KEYWORDS) {

    if (normalized.includes(word)) {

      score += 5;

    }

  }

  return score;

}
/* ============================================================================
 * CONTEXT ENGINE
 * ==========================================================================*/

interface ContextRule {

  trigger: string[];

  boost: PollutionCategory;

  score: number;

}

const CONTEXT_RULES: ContextRule[] = [

  {

    trigger: [

      "burning",

      "plastic"

    ],

    boost: "air_pollution",

    score: 20

  },

  {

    trigger: [

      "river",

      "plastic"

    ],

    boost: "water_pollution",

    score: 18

  },

  {

    trigger: [

      "factory",

      "smoke"

    ],

    boost: "air_pollution",

    score: 25

  },

  {

    trigger: [

      "chemical",

      "river"

    ],

    boost: "water_pollution",

    score: 25

  },

  {

    trigger: [

      "battery",

      "dump"

    ],

    boost: "waste_pollution",

    score: 20

  },

  {

    trigger: [

      "hospital",

      "needle"

    ],

    boost: "waste_pollution",

    score: 18

  }

];
function contextBoost(

  text: string,

  category: PollutionCategory

): number {

  const normalized = normalize(text);

  let boost = 0;

  for (const rule of CONTEXT_RULES) {

    if (rule.boost !== category) continue;

    const matched = rule.trigger.every(

      keyword => normalized.includes(keyword)

    );

    if (matched) {

      boost += rule.score;

    }

  }

  return boost;

}
interface RankedCategory {

  category: PollutionCategory;

  score: number;

}

function rankCategories(text: string): RankedCategory[] {

  const list: RankedCategory[] = [];

  const categories = Object.keys(

    CATEGORY_RULES

  ) as PollutionCategory[];

  for (const category of categories) {

    if (category === "other") continue;

    const result = scoreCategory(

      text,

      category

    );

    const finalScore =

      result.score +

      contextBoost(text, category);

    list.push({

      category,

      score: finalScore

    });

  }

  list.sort(

    (a, b) => b.score - a.score

  );

  return list;

}
/* ============================================================================
 * CONFIDENCE ENGINE
 * ==========================================================================*/

const NEGATIVE_KEYWORDS = [
  "not",
  "no",
  "none",
  "nothing",
  "clean",
  "safe",
  "clear",
  "tidak",
  "bukan",
  "bersih",
  "aman"
];

function negativePenalty(text: string): number {

  const normalized = normalize(text);

  let penalty = 0;

  for (const word of NEGATIVE_KEYWORDS) {

    if (normalized.includes(word)) {

      penalty += 10;

    }

  }

  return penalty;

}

function normalizeConfidence(score: number): number {

  const confidence =

    100 * (1 - Math.exp(-score / 45));

  return Math.max(
    35,
    Math.min(
      99,
      Math.round(confidence)
    )
  );

}
/* ============================================================================
 * FINAL CLASSIFIER
 * ==========================================================================*/

export function classify(
  description: string
): ClassificationResult {

  const normalized = normalize(description);

const tokens = canonicalize(
  normalized.split(/\s+/)
);

const text = tokens.join(" ");

  if (!text.trim()) {

    return {

      category: "other",

      waste_type: "other",

      raw_confidence: 35,

      matchedSignals: []

    };

  }

  //----------------------------------
  // Category Ranking
  //----------------------------------

  const ranked = rankCategories(text);

  const best = ranked[0];

  //----------------------------------
  // Waste Type
  //----------------------------------

  const waste = detectWasteType(text);

  //----------------------------------
  // Severity
  //----------------------------------

  const severity = severityScore(text);

  //----------------------------------
  // Negative penalty
  //----------------------------------

  const penalty = negativePenalty(text);

  //----------------------------------
  // Final Score
  //----------------------------------

  const finalScore =

    best.score +

    severity -

    penalty;

  //----------------------------------
  // Confidence
  //----------------------------------

  const confidence = normalizeConfidence(
    finalScore
  );

  //----------------------------------
  // Signals
  //----------------------------------

  const signals = scoreCategory(

    text,

    best.category

  ).signals;

  return {

    category: best.category,

    waste_type: waste,

    raw_confidence: confidence,

    matchedSignals: [...new Set(signals)]

  };

}
/* ============================================================================
 * OPTIONAL ANALYSIS
 * ==========================================================================*/

export function analyzeDescription(
  description: string
) {

  const ranked = rankCategories(description);

  const waste = detectWasteType(description);

  const severity = severityScore(description);

  return {

    rankedCategories: ranked,

    wasteType: waste,

    severity

  };

}
