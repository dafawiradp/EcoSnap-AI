import type { PollutionCategory, WasteType } from "@/types/report";

export interface KeywordSignal {
  keyword: string;
  category?: PollutionCategory;
  wasteType?: WasteType;
  weight: number;
}

export const INDONESIAN_SIGNALS: KeywordSignal[] = [
  { keyword: "sungai", category: "water_pollution", weight: 3 },
  { keyword: "laut", category: "water_pollution", weight: 3 },
  { keyword: "danau", category: "water_pollution", weight: 3 },
  { keyword: "selokan", category: "water_pollution", weight: 2 },

  { keyword: "asap", category: "air_pollution", weight: 3 },
  { keyword: "pabrik", category: "air_pollution", weight: 2 },
  { keyword: "pembakaran", category: "air_pollution", weight: 3 },

  { keyword: "sampah", category: "waste_pollution", weight: 3 },
  { keyword: "plastik", wasteType: "plastic", weight: 3 },
  { keyword: "botol", wasteType: "plastic", weight: 2 },
  { keyword: "organik", wasteType: "organic", weight: 3 },
  { keyword: "sayur", wasteType: "organic", weight: 2 },
  { keyword: "buah", wasteType: "organic", weight: 2 },
  { keyword: "baterai", wasteType: "battery", weight: 3 },
];