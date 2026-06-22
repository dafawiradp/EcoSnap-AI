import type { PollutionCategory } from "@/types/report";

// Re-export the type for use elsewhere
export type { PollutionCategory };

const KEYWORD_MAP: { keywords: string[]; category: PollutionCategory }[] = [
  { keywords: ["burn", "fire", "smoke", "ash"], category: "burning_waste" },
  { keywords: ["dump", "illegal", "discard", "abandon"], category: "illegal_dumping" },
  { keywords: ["water", "river", "lake", "ocean", "stream"], category: "water_pollution" },
  { keywords: ["air", "smog", "fume", "exhaust", "haze"], category: "air_pollution" },
  { keywords: ["plastic", "bottle", "bag", "wrapper"], category: "plastic_waste" },
];

/**
 * Classifies pollution from a description string using keyword matching.
 * Returns "plastic_waste" as the default when no keywords match.
 *
 * @param description - Free-text description of the pollution
 * @returns The matched PollutionCategory
 */
export function classify(description: string): PollutionCategory {
  const lower = description.toLowerCase();
  for (const { keywords, category } of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "plastic_waste"; // default
}
