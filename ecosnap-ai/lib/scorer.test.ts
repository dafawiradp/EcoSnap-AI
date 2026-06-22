import { describe, it, expect } from "vitest";
import { score, PROXIMITY_SIGNALS } from "./scorer";

describe("score", () => {
  // Rule 1: burning_waste → Critical regardless of description
  describe("Rule 1: burning_waste → Critical", () => {
    it("returns Critical for burning_waste with empty description", () => {
      expect(score("burning_waste", "")).toBe("Critical");
    });

    it("returns Critical for burning_waste with a plain description", () => {
      expect(score("burning_waste", "Large fire near the park")).toBe("Critical");
    });

    it("returns Critical for burning_waste even with a proximity signal", () => {
      // Rule 1 takes priority over Rule 2
      expect(score("burning_waste", "burning waste beside the lake")).toBe("Critical");
    });

    it("returns Critical for burning_waste with any description", () => {
      expect(score("burning_waste", "NEAR WATER and beside homes")).toBe("Critical");
    });
  });

  // Rule 2: illegal_dumping + proximity signal → High
  describe("Rule 2: illegal_dumping + proximity signal → High", () => {
    it('returns High for illegal_dumping with "near water"', () => {
      expect(score("illegal_dumping", "Trash dumped near water")).toBe("High");
    });

    it('returns High for illegal_dumping with "near homes"', () => {
      expect(score("illegal_dumping", "Illegal dumping near homes")).toBe("High");
    });

    it('returns High for illegal_dumping with "next to"', () => {
      expect(score("illegal_dumping", "Waste left next to the school")).toBe("High");
    });

    it('returns High for illegal_dumping with "beside"', () => {
      expect(score("illegal_dumping", "Rubbish beside the road")).toBe("High");
    });

    it('returns High for illegal_dumping with "adjacent"', () => {
      expect(score("illegal_dumping", "Dumping adjacent to residential area")).toBe("High");
    });
  });

  // Rule 2: water_pollution + proximity signal → High
  describe("Rule 2: water_pollution + proximity signal → High", () => {
    it('returns High for water_pollution with "near water"', () => {
      expect(score("water_pollution", "Oil spill near water supply")).toBe("High");
    });

    it('returns High for water_pollution with "near homes"', () => {
      expect(score("water_pollution", "Contamination near homes")).toBe("High");
    });

    it('returns High for water_pollution with "next to"', () => {
      expect(score("water_pollution", "Pollution next to the village")).toBe("High");
    });

    it('returns High for water_pollution with "beside"', () => {
      expect(score("water_pollution", "Foam beside the river bank")).toBe("High");
    });

    it('returns High for water_pollution with "adjacent"', () => {
      expect(score("water_pollution", "Discharge adjacent to farmland")).toBe("High");
    });
  });

  // Rule 2: illegal_dumping WITHOUT proximity signal → Medium (not High)
  describe("Rule 2 absent: illegal_dumping without proximity signal → Medium", () => {
    it("returns Medium for illegal_dumping with empty description", () => {
      expect(score("illegal_dumping", "")).toBe("Medium");
    });

    it("returns Medium for illegal_dumping with unrelated description", () => {
      expect(score("illegal_dumping", "Trash in the alley")).toBe("Medium");
    });

    it("does not return High for illegal_dumping with no proximity signal", () => {
      expect(score("illegal_dumping", "Waste scattered on the ground")).not.toBe("High");
    });
  });

  // Rule 2: water_pollution WITHOUT proximity signal → Medium (not High)
  describe("Rule 2 absent: water_pollution without proximity signal → Medium", () => {
    it("returns Medium for water_pollution with empty description", () => {
      expect(score("water_pollution", "")).toBe("Medium");
    });

    it("returns Medium for water_pollution with unrelated description", () => {
      expect(score("water_pollution", "River looks murky")).toBe("Medium");
    });

    it("does not return High for water_pollution with no proximity signal", () => {
      expect(score("water_pollution", "Lake is discoloured")).not.toBe("High");
    });
  });

  // Rule 3: air_pollution → Medium
  describe("Rule 3: air_pollution → Medium", () => {
    it("returns Medium for air_pollution with empty description", () => {
      expect(score("air_pollution", "")).toBe("Medium");
    });

    it("returns Medium for air_pollution with a plain description", () => {
      expect(score("air_pollution", "Thick smog in the morning")).toBe("Medium");
    });

    it("returns Medium for air_pollution even with a proximity signal (rule 2 does not apply)", () => {
      // Rule 2 only applies to illegal_dumping / water_pollution
      expect(score("air_pollution", "Fumes next to the school")).toBe("Medium");
    });
  });

  // Rule 4: plastic_waste → Low
  describe("Rule 4: plastic_waste → Low", () => {
    it("returns Low for plastic_waste with empty description", () => {
      expect(score("plastic_waste", "")).toBe("Low");
    });

    it("returns Low for plastic_waste with a plain description", () => {
      expect(score("plastic_waste", "Bottles scattered on the beach")).toBe("Low");
    });

    it("returns Low for plastic_waste even with a proximity signal (rule 2 does not apply)", () => {
      expect(score("plastic_waste", "Plastic bags beside the river")).toBe("Low");
    });
  });

  // Rule 5: all other combinations → Medium
  describe("Rule 5: all other combinations → Medium (fallback)", () => {
    it("returns Medium for illegal_dumping without any proximity signal (fallback)", () => {
      expect(score("illegal_dumping", "General mess in the park")).toBe("Medium");
    });

    it("returns Medium for water_pollution without any proximity signal (fallback)", () => {
      expect(score("water_pollution", "Dark water in the canal")).toBe("Medium");
    });
  });

  // Case-insensitive proximity signal detection
  describe("case-insensitive proximity signal detection", () => {
    it('detects "NEAR WATER" in uppercase for illegal_dumping', () => {
      expect(score("illegal_dumping", "Dumping NEAR WATER here")).toBe("High");
    });

    it('detects "NEAR HOMES" in uppercase for water_pollution', () => {
      expect(score("water_pollution", "Spill NEAR HOMES")).toBe("High");
    });

    it('detects "Next To" in mixed case for illegal_dumping', () => {
      expect(score("illegal_dumping", "Waste Next To the building")).toBe("High");
    });

    it('detects "BESIDE" in uppercase for water_pollution', () => {
      expect(score("water_pollution", "Foam BESIDE the dock")).toBe("High");
    });

    it('detects "ADJACENT" in uppercase for illegal_dumping', () => {
      expect(score("illegal_dumping", "Skip ADJACENT to the school")).toBe("High");
    });
  });

  // Verify PROXIMITY_SIGNALS export covers all expected signals
  describe("PROXIMITY_SIGNALS constant", () => {
    it("exports all five proximity signals", () => {
      expect(PROXIMITY_SIGNALS).toContain("near water");
      expect(PROXIMITY_SIGNALS).toContain("near homes");
      expect(PROXIMITY_SIGNALS).toContain("next to");
      expect(PROXIMITY_SIGNALS).toContain("beside");
      expect(PROXIMITY_SIGNALS).toContain("adjacent");
    });

    it("has exactly five proximity signals", () => {
      expect(PROXIMITY_SIGNALS).toHaveLength(5);
    });
  });
});
