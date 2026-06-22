import { describe, it, expect } from "vitest";
import { classify } from "./classifier";

describe("classify", () => {
  // burning_waste keywords
  describe("burning_waste category", () => {
    it('matches "burn"', () => {
      expect(classify("There is a burn pile nearby")).toBe("burning_waste");
    });
    it('matches "fire"', () => {
      expect(classify("A fire is spreading")).toBe("burning_waste");
    });
    it('matches "smoke"', () => {
      expect(classify("Thick smoke in the air")).toBe("burning_waste");
    });
    it('matches "ash"', () => {
      expect(classify("Ash covers the ground")).toBe("burning_waste");
    });
  });

  // illegal_dumping keywords
  describe("illegal_dumping category", () => {
    it('matches "dump"', () => {
      expect(classify("Someone used this area to dump waste")).toBe("illegal_dumping");
    });
    it('matches "illegal"', () => {
      expect(classify("Illegal waste left here")).toBe("illegal_dumping");
    });
    it('matches "discard"', () => {
      expect(classify("They discard rubbish here regularly")).toBe("illegal_dumping");
    });
    it('matches "abandon"', () => {
      expect(classify("Cars are abandoned with leaking fluids")).toBe("illegal_dumping");
    });
  });

  // water_pollution keywords
  describe("water_pollution category", () => {
    it('matches "water"', () => {
      expect(classify("The water looks contaminated")).toBe("water_pollution");
    });
    it('matches "river"', () => {
      expect(classify("Pollution found in the river")).toBe("water_pollution");
    });
    it('matches "lake"', () => {
      expect(classify("Foam on the lake surface")).toBe("water_pollution");
    });
    it('matches "ocean"', () => {
      expect(classify("Litter floating in the ocean")).toBe("water_pollution");
    });
    it('matches "stream"', () => {
      expect(classify("Oil visible in the stream")).toBe("water_pollution");
    });
  });

  // air_pollution keywords
  describe("air_pollution category", () => {
    it('matches "air"', () => {
      expect(classify("The air quality is terrible")).toBe("air_pollution");
    });
    it('matches "smog"', () => {
      expect(classify("Dense smog over the city")).toBe("air_pollution");
    });
    it('matches "fume"', () => {
      expect(classify("Chemical fumes from the factory")).toBe("air_pollution");
    });
    it('matches "exhaust"', () => {
      expect(classify("Exhaust from old trucks")).toBe("air_pollution");
    });
    it('matches "haze"', () => {
      expect(classify("Heavy haze blocking the sun")).toBe("air_pollution");
    });
  });

  // plastic_waste keywords
  describe("plastic_waste category", () => {
    it('matches "plastic"', () => {
      expect(classify("Plastic litter all over the park")).toBe("plastic_waste");
    });
    it('matches "bottle"', () => {
      expect(classify("Bottles scattered on the beach")).toBe("plastic_waste");
    });
    it('matches "bag"', () => {
      expect(classify("Plastic bag stuck in a tree")).toBe("plastic_waste");
    });
    it('matches "wrapper"', () => {
      expect(classify("Candy wrapper on the ground")).toBe("plastic_waste");
    });
  });

  // Default case
  describe("default case", () => {
    it("returns plastic_waste for empty string", () => {
      expect(classify("")).toBe("plastic_waste");
    });

    it("returns plastic_waste when no keywords match", () => {
      expect(classify("Something looks wrong here")).toBe("plastic_waste");
    });

    it("returns plastic_waste for an unrelated description", () => {
      expect(classify("The trees look healthy today")).toBe("plastic_waste");
    });
  });

  // Case insensitivity
  describe("case insensitivity", () => {
    it("matches BURN in uppercase", () => {
      expect(classify("BURN pile spotted")).toBe("burning_waste");
    });
    it("matches WATER in uppercase", () => {
      expect(classify("WATER looks dirty")).toBe("water_pollution");
    });
    it("matches mixed case Fire", () => {
      expect(classify("Fire hazard reported")).toBe("burning_waste");
    });
  });

  // Matching order — first match wins
  describe("matching order (first match wins)", () => {
    it('returns burning_waste for "fire and water" (fire checked first)', () => {
      expect(classify("fire and water contamination")).toBe("burning_waste");
    });

    it('returns illegal_dumping for "dump near river" (dump checked before water)', () => {
      expect(classify("dump near the river")).toBe("illegal_dumping");
    });

    it('returns water_pollution for "water and smog" (water checked before air)', () => {
      expect(classify("water and smog issue")).toBe("water_pollution");
    });

    it('returns air_pollution for "exhaust and plastic" (air checked before plastic)', () => {
      expect(classify("exhaust fumes and plastic bags")).toBe("air_pollution");
    });
  });
});
