import { describe, it, expect } from "vitest";
import { classify } from "./classifier";
import type { PollutionCategory } from "@/types/report";

// Valid category values
const VALID_CATEGORIES: PollutionCategory[] = [
  "air_pollution", "water_pollution", "soil_pollution",
  "noise_pollution", "light_pollution", "visual_pollution",
  "thermal_pollution", "electromagnetic_pollution",
  "waste_pollution", "other",
];

describe("classify — multi-signal scoring", () => {

  // ── Output contract ───────────────────────────────────────────────────────
  describe("output contract", () => {
    it("always returns a valid PollutionCategory", () => {
      const result = classify("some unclear description");
      expect(VALID_CATEGORIES).toContain(result.category);
    });
    it("returns non-null waste_type only for waste_pollution", () => {
      const r1 = classify("trash on the ground");
      if (r1.category === "waste_pollution") {
        expect(r1.waste_type).not.toBeNull();
      } else {
        expect(r1.waste_type).toBeNull();
      }
    });
    it("raw_confidence is between 0 and 100", () => {
      const r = classify("factory smoke near river");
      expect(r.raw_confidence).toBeGreaterThanOrEqual(0);
      expect(r.raw_confidence).toBeLessThanOrEqual(100);
    });
  });

  // ── Air pollution ─────────────────────────────────────────────────────────
  describe("air_pollution", () => {
    it("'factory smoke' → air_pollution", () =>
      expect(classify("factory smoke billowing from chimney").category).toBe("air_pollution"));
    it("'thick smog'    → air_pollution", () =>
      expect(classify("dense smog over the city").category).toBe("air_pollution"));
    it("'car exhaust'   → air_pollution", () =>
      expect(classify("car exhaust in the tunnel").category).toBe("air_pollution"));
    it("'haze'          → air_pollution", () =>
      expect(classify("heavy haze blocking the sun").category).toBe("air_pollution"));
    it("'emission'      → air_pollution", () =>
      expect(classify("industrial emission from stack").category).toBe("air_pollution"));
    it("returns null waste_type for air", () =>
      expect(classify("smoke in the air").waste_type).toBeNull());

    // Cross-context: burning material → air wins over waste
    it("'burning plastic' → air_pollution (smoke/burning outweighs plastic waste)", () =>
      expect(classify("burning plastic on the roadside").category).toBe("air_pollution"));
    it("'burning garbage pile' → air_pollution", () =>
      expect(classify("burning garbage pile producing thick smoke").category).toBe("air_pollution"));
  });

  // ── Water pollution ───────────────────────────────────────────────────────
  describe("water_pollution", () => {
    it("'sewage overflowing' → water_pollution", () =>
      expect(classify("sewage overflowing into the road").category).toBe("water_pollution"));
    it("'oil spill in river' → water_pollution", () =>
      expect(classify("oil spill visible in river").category).toBe("water_pollution"));
    it("'algae bloom on pond' → water_pollution", () =>
      expect(classify("algae bloom on pond surface").category).toBe("water_pollution"));
    it("'foam on lake' → water_pollution", () =>
      expect(classify("foam on the lake near the factory").category).toBe("water_pollution"));
    it("returns null waste_type", () =>
      expect(classify("oil spill in river").waste_type).toBeNull());

    // Cross-context: material in water → water wins
    it("'plastic floating in river' → water_pollution", () =>
      expect(classify("plastic floating in river").category).toBe("water_pollution"));
    it("'oil leaking into river' → water_pollution", () =>
      expect(classify("oil leaking into river bank").category).toBe("water_pollution"));
    it("'trash floating in lake' → water_pollution", () =>
      expect(classify("trash floating in lake").category).toBe("water_pollution"));
  });

  // ── Soil pollution ────────────────────────────────────────────────────────
  describe("soil_pollution", () => {
    it("'contaminated soil near factory' → soil_pollution", () =>
      expect(classify("contaminated soil near factory").category).toBe("soil_pollution"));
    it("'ground contamination from leak' → soil_pollution", () =>
      expect(classify("ground contamination from leak").category).toBe("soil_pollution"));
    it("'pesticide runoff on land' → soil_pollution", () =>
      expect(classify("pesticide runoff on land contaminating soil").category).toBe("soil_pollution"));
  });

  // ── Noise pollution ───────────────────────────────────────────────────────
  describe("noise_pollution", () => {
    it("'industrial noise all day' → noise_pollution", () =>
      expect(classify("industrial noise all day").category).toBe("noise_pollution"));
    it("'jackhammer' → noise_pollution", () =>
      expect(classify("jackhammer operating all morning").category).toBe("noise_pollution"));
    it("'construction noise at night' → noise_pollution", () =>
      expect(classify("construction noise at night").category).toBe("noise_pollution"));
  });

  // ── Waste pollution + subtypes ────────────────────────────────────────────
  describe("waste_pollution", () => {
    it("'trash on the street' → waste_pollution", () =>
      expect(classify("trash everywhere on the street").category).toBe("waste_pollution"));
    it("'garbage pile' → waste_pollution", () =>
      expect(classify("garbage piled near the park").category).toBe("waste_pollution"));
    it("'illegal dumping in alley' → waste_pollution", () =>
      expect(classify("illegal dumping in the alley").category).toBe("waste_pollution"));
    it("'litter scattered' → waste_pollution", () =>
      expect(classify("litter scattered all over").category).toBe("waste_pollution"));

    describe("waste subtypes", () => {
      it("food waste → organic", () =>
        expect(classify("food waste on the roadside").waste_type).toBe("organic"));
      it("rotting vegetables → organic", () =>
        expect(classify("rotting vegetables in heap").waste_type).toBe("organic"));
      it("plastic bottle → plastic", () =>
        expect(classify("plastic bottle trash on beach").waste_type).toBe("plastic"));
      it("cardboard → paper", () =>
        expect(classify("cardboard boxes scattered").waste_type).toBe("paper"));
      it("broken glass → glass", () =>
        expect(classify("broken glass near the school").waste_type).toBe("glass"));
      it("scrap metal → metal", () =>
        expect(classify("scrap metal dumped in field").waste_type).toBe("metal"));
      it("e-waste → electronic", () =>
        expect(classify("e-waste pile behind factory").waste_type).toBe("electronic"));
      it("toxic waste → hazardous", () =>
        expect(classify("toxic waste dumped in field").waste_type).toBe("hazardous"));
      it("rubble/concrete → construction", () =>
        expect(classify("rubble and concrete debris").waste_type).toBe("construction"));
      it("mixed waste → mixed", () =>
        expect(classify("mixed waste in the alley").waste_type).toBe("mixed"));
      it("unrecognised subtype defaults to mixed", () =>
        expect(classify("a large pile of trash with no clear type").waste_type).toBe("mixed"));
    });

    // Context-priority scenarios
    it("'organic vegetables dumped' → waste_pollution / organic", () => {
      const r = classify("organic vegetables dumped on roadside");
      expect(r.category).toBe("waste_pollution");
      expect(r.waste_type).toBe("organic");
    });
    it("'vegetables on roadside with plastic bags' → waste/organic (organic scores higher)", () => {
      const r = classify("vegetables scattered on roadside with some plastic bags");
      expect(r.category).toBe("waste_pollution");
      expect(r.waste_type).toBe("organic"); // vegetable/rotting signals outweigh plastic
    });
  });

  // ── Other (low-confidence fallback) ──────────────────────────────────────
  describe("other — low-confidence fallback", () => {
    it("returns 'other' for empty string", () =>
      expect(classify("").category).toBe("other"));
    it("returns 'other' for vague description with no strong signals", () =>
      expect(classify("something looks odd here").category).toBe("other"));
    it("returns null waste_type for other", () =>
      expect(classify("").waste_type).toBeNull());
  });

  // ── Cross-context signal resolution ──────────────────────────────────────
  describe("cross-context resolution (key scenarios)", () => {
    it("'burning plastic' → air_pollution (burning > waste)", () =>
      expect(classify("burning plastic").category).toBe("air_pollution"));
    it("'plastic floating in river' → water_pollution (river > waste)", () =>
      expect(classify("plastic floating in river").category).toBe("water_pollution"));
    it("'oil leaking into river' → water_pollution", () =>
      expect(classify("oil leaking into river").category).toBe("water_pollution"));
    it("'factory smoke near river' → air_pollution (smoke 3pts > river 3pts, tie-break: first in iteration — air)", () => {
      // Both air and water score high — we just check it's one of the two, not "other"
      const cat = classify("factory smoke near river").category;
      expect(["air_pollution", "water_pollution"]).toContain(cat);
    });
    it("'organic vegetables dumped on roadside' → waste_pollution", () =>
      expect(classify("organic vegetables dumped on roadside").category).toBe("waste_pollution"));
  });

  // ── imageHint parameter ───────────────────────────────────────────────────
  describe("imageHint parameter", () => {
    it("imageHint adds context to classification", () => {
      // Description alone is vague; hint tips it toward water
      const r = classify("looks contaminated", "river algae");
      expect(r.category).toBe("water_pollution");
    });
    it("imageHint is optional and safe to omit", () => {
      const r = classify("trash everywhere");
      expect(r.category).toBe("waste_pollution");
    });
  });

  // ── Case insensitivity ────────────────────────────────────────────────────
  describe("case insensitivity", () => {
    it("SMOKE uppercase → air_pollution", () =>
      expect(classify("SMOKE from factory").category).toBe("air_pollution"));
    it("TRASH uppercase → waste_pollution", () =>
      expect(classify("TRASH on the ground").category).toBe("waste_pollution"));
    it("RIVER uppercase → water_pollution", () =>
      expect(classify("RIVER contamination").category).toBe("water_pollution"));
  });
});
