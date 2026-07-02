import { describe, it, expect } from "vitest";
import { score, PROXIMITY_SIGNALS } from "./scorer";
import type { PollutionCategory } from "@/types/report";

describe("score — new taxonomy", () => {

  // ── Rule 1: critical signal keywords override everything ──────────────────
  describe("Rule 1: critical keyword → Critical (any category)", () => {
    it("returns Critical when description contains 'on fire'", () => {
      expect(score("waste_pollution", "debris on fire near the road")).toBe("Critical");
    });
    it("returns Critical for 'chemical spill' with any category", () => {
      expect(score("soil_pollution", "chemical spill on the ground")).toBe("Critical");
    });
    it("returns Critical for 'oil spill'", () => {
      expect(score("water_pollution", "oil spill in the river")).toBe("Critical");
    });
    it("returns Critical for 'toxic cloud'", () => {
      expect(score("air_pollution", "toxic cloud from the factory")).toBe("Critical");
    });
  });

  // ── Rule 2: hazardous waste subtype → Critical ────────────────────────────
  describe("Rule 2: waste_pollution + hazardous → Critical", () => {
    it("returns Critical for waste_pollution with hazardous waste type", () => {
      expect(score("waste_pollution", "some waste", "hazardous")).toBe("Critical");
    });
    it("does NOT return Critical for non-hazardous waste", () => {
      expect(score("waste_pollution", "plastic bottles", "plastic")).not.toBe("Critical");
    });
  });

  // ── Rule 4: major media + proximity signal → High ─────────────────────────
  describe("Rule 4: major media + proximity → High", () => {
    it("air_pollution + 'near homes' → High", () => {
      expect(score("air_pollution", "thick smog near homes")).toBe("High");
    });
    it("water_pollution + 'next to' → High", () => {
      expect(score("water_pollution", "foam next to the village")).toBe("High");
    });
    it("soil_pollution + 'beside' → High", () => {
      expect(score("soil_pollution", "contaminated soil beside the school")).toBe("High");
    });
    it("water_pollution + 'adjacent' → High", () => {
      expect(score("water_pollution", "discharge adjacent to farmland")).toBe("High");
    });
    it("air_pollution + 'near water' → High", () => {
      expect(score("air_pollution", "fumes near water supply")).toBe("High");
    });
  });

  // ── Rule 5: air_pollution standalone → High ───────────────────────────────
  describe("Rule 5: air_pollution standalone → High", () => {
    it("returns High for air_pollution with empty description", () => {
      expect(score("air_pollution", "")).toBe("High");
    });
    it("returns High for air_pollution with plain description", () => {
      expect(score("air_pollution", "thick smog in the morning")).toBe("High");
    });
  });

  // ── Rule 6: water_pollution standalone → Medium ───────────────────────────
  describe("Rule 6: water_pollution standalone → Medium", () => {
    it("returns Medium for water_pollution without proximity", () => {
      expect(score("water_pollution", "river looks murky")).toBe("Medium");
    });
    it("returns Medium for water_pollution with empty description", () => {
      expect(score("water_pollution", "")).toBe("Medium");
    });
  });

  // ── Rule 7: soil_pollution standalone → Medium ────────────────────────────
  describe("Rule 7: soil_pollution standalone → Medium", () => {
    it("returns Medium for soil_pollution with empty description", () => {
      expect(score("soil_pollution", "")).toBe("Medium");
    });
    it("returns Medium for soil_pollution with plain description", () => {
      expect(score("soil_pollution", "brown contaminated earth")).toBe("Medium");
    });
  });

  // ── Rule 8: waste_pollution + proximity → Medium ──────────────────────────
  describe("Rule 8: waste_pollution + proximity → Medium", () => {
    it("returns Medium for waste_pollution near homes", () => {
      expect(score("waste_pollution", "trash dump near homes", "mixed")).toBe("Medium");
    });
    it("returns Medium for waste_pollution next to school", () => {
      expect(score("waste_pollution", "garbage next to the school", "plastic")).toBe("Medium");
    });
  });

  // ── Rule 9: organic / mixed waste → Low ──────────────────────────────────
  describe("Rule 9: organic/mixed/paper waste → Low", () => {
    it("returns Low for waste_pollution + organic", () => {
      expect(score("waste_pollution", "food scraps on roadside", "organic")).toBe("Low");
    });
    it("returns Low for waste_pollution + mixed (no proximity)", () => {
      expect(score("waste_pollution", "scattered litter", "mixed")).toBe("Low");
    });
    it("returns Low for waste_pollution + paper", () => {
      expect(score("waste_pollution", "old newspapers", "paper")).toBe("Low");
    });
  });

  // ── Rule 10: sensory/perceptual categories → Low ─────────────────────────
  describe("Rule 10: low-impact categories → Low", () => {
    const lowCategories: PollutionCategory[] = [
      "noise_pollution", "light_pollution", "visual_pollution",
      "thermal_pollution", "electromagnetic_pollution", "other",
    ];
    for (const cat of lowCategories) {
      it(`returns Low for ${cat}`, () => {
        expect(score(cat, "")).toBe("Low");
      });
    }
  });

  // ── Case-insensitive proximity detection ─────────────────────────────────
  describe("case-insensitive proximity signal detection", () => {
    it("detects 'NEAR WATER' uppercase for water_pollution", () => {
      expect(score("water_pollution", "Spill NEAR WATER")).toBe("High");
    });
    it("detects 'Next To' mixed case for soil_pollution", () => {
      expect(score("soil_pollution", "Contamination Next To the building")).toBe("High");
    });
    it("detects 'ADJACENT' for air_pollution", () => {
      expect(score("air_pollution", "Fumes ADJACENT to the school")).toBe("High");
    });
  });

  // ── PROXIMITY_SIGNALS export ─────────────────────────────────────────────
  describe("PROXIMITY_SIGNALS constant", () => {
    it("includes 'near water'", () => expect(PROXIMITY_SIGNALS).toContain("near water"));
    it("includes 'near homes'", () => expect(PROXIMITY_SIGNALS).toContain("near homes"));
    it("includes 'next to'",    () => expect(PROXIMITY_SIGNALS).toContain("next to"));
    it("includes 'beside'",     () => expect(PROXIMITY_SIGNALS).toContain("beside"));
    it("includes 'adjacent'",   () => expect(PROXIMITY_SIGNALS).toContain("adjacent"));
  });
});
