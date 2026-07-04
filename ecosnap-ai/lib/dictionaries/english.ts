import type { PollutionCategory, WasteType } from "@/types/report";

export interface KeywordSignal {
  keyword: string;
  category?: PollutionCategory;
  wasteType?: WasteType;
  weight: number;
}

export const ENGLISH_SIGNALS: KeywordSignal[] = [
  // Water
  { keyword: "river", category: "water_pollution", weight: 3 },
  { keyword: "lake", category: "water_pollution", weight: 3 },
  { keyword: "ocean", category: "water_pollution", weight: 3 },
  { keyword: "sea", category: "water_pollution", weight: 3 },
  { keyword: "water", category: "water_pollution", weight: 2 },

  // Air
  { keyword: "smoke", category: "air_pollution", weight: 3 },
  { keyword: "factory", category: "air_pollution", weight: 2 },
  { keyword: "burning", category: "air_pollution", weight: 3 },

  // Waste
  { keyword: "trash", category: "waste_pollution", weight: 3 },
  { keyword: "garbage", category: "waste_pollution", weight: 3 },
  { keyword: "plastic", wasteType: "plastic", weight: 3 },
  { keyword: "bottle", wasteType: "plastic", weight: 2 },
  { keyword: "organic", wasteType: "organic", weight: 3 },
  { keyword: "vegetable", wasteType: "organic", weight: 2 },
  { keyword: "fruit", wasteType: "organic", weight: 2 },
  { keyword: "battery", wasteType: "hazardous", weight: 3 },
];