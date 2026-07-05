import { describe, it, expect } from "vitest";
import { recommend, ACTION_POOL } from "./recommender";
import type { PollutionCategory, UrgencyLevel, WasteType } from "@/types/report";

const CATEGORIES: PollutionCategory[] = [
  "air_pollution", "water_pollution", "soil_pollution",
  "noise_pollution", "light_pollution", "visual_pollution",
  "thermal_pollution", "electromagnetic_pollution",
  "waste_pollution", "other",
];
const URGENCY_LEVELS: UrgencyLevel[] = ["Low", "Medium", "High", "Critical"];
const WASTE_TYPES: WasteType[] = [
  "organic", "plastic", "paper", "glass", "metal",
  "electronic", "chemical", "construction", "mixed", "other",
];

// ── Output bounds ─────────────────────────────────────────────────────────────
describe("output bounds — every (category, urgency) pair returns 1–4 actions", () => {
  for (const category of CATEGORIES) {
    for (const urgency of URGENCY_LEVELS) {
      it(`${category} + ${urgency}`, () => {
        const result = recommend(category, urgency);
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result.length).toBeLessThanOrEqual(4);
      });
    }
  }
});

// ── Pool membership ───────────────────────────────────────────────────────────
describe("pool membership — all actions come from the defined pool", () => {
  for (const category of CATEGORIES) {
    for (const urgency of URGENCY_LEVELS) {
      it(`${category} + ${urgency}: all actions in pool`, () => {
        const result = recommend(category, urgency);
        for (const action of result) expect(ACTION_POOL).toContain(action);
      });
    }
  }
});

// ── No duplicates ─────────────────────────────────────────────────────────────
describe("no duplicate actions", () => {
  for (const category of CATEGORIES) {
    for (const urgency of URGENCY_LEVELS) {
      it(`${category} + ${urgency}: no duplicates`, () => {
        const result = recommend(category, urgency);
        expect(new Set(result).size).toBe(result.length);
      });
    }
  }
});

// ── Waste subtype × urgency bounds ────────────────────────────────────────────
describe("waste subtype output bounds (1–4 actions, no duplicates)", () => {
  for (const wasteType of WASTE_TYPES) {
    for (const urgency of URGENCY_LEVELS) {
      it(`waste_pollution + ${wasteType} + ${urgency}`, () => {
        const result = recommend("waste_pollution", urgency, wasteType);
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result.length).toBeLessThanOrEqual(4);
        expect(new Set(result).size).toBe(result.length);
        for (const a of result) expect(ACTION_POOL).toContain(a);
      });
    }
  }
});

// ── Urgency-mandated inclusions ───────────────────────────────────────────────
describe("Critical urgency — always includes notify + escalate", () => {
  for (const category of CATEGORIES) {
    it(`${category} + Critical includes 'Notify local authorities'`, () =>
      expect(recommend(category, "Critical")).toContain("Notify local authorities"));
    it(`${category} + Critical includes 'Escalate to environmental emergency services'`, () =>
      expect(recommend(category, "Critical")).toContain("Escalate to environmental emergency services"));
  }
});

describe("High urgency — always includes notify", () => {
  for (const category of CATEGORIES) {
    it(`${category} + High includes 'Notify local authorities'`, () =>
      expect(recommend(category, "High")).toContain("Notify local authorities"));
  }
});

describe("Low urgency — always includes community cleanup", () => {
  for (const category of CATEGORIES) {
    it(`${category} + Low includes 'Organize a community cleanup'`, () =>
      expect(recommend(category, "Low")).toContain("Organize a community cleanup"));
  }
});

// ── Waste-subtype specific actions ────────────────────────────────────────────
describe("waste subtype contextual actions", () => {
  it("chemical + Critical includes 'Avoid direct contact with the pollutant'", () => {
    expect(recommend("waste_pollution", "Critical", "chemical"))
      .toContain("Avoid direct contact with the pollutant");
  });
  it("toxic + Medium includes 'Schedule a chemical waste pickup'", () => {
    expect(recommend("waste_pollution", "Medium", "toxic"))
      .toContain("Schedule a chemical waste pickup");
  });
  it("electronic + High includes 'Request e-waste collection service'", () => {
    expect(recommend("waste_pollution", "High", "electronic"))
      .toContain("Request e-waste collection service");
  });
  it("electronic + High includes 'Contact the local environmental agency'", () => {
    expect(recommend("waste_pollution", "High", "electronic"))
      .toContain("Contact the local environmental agency");
  });
  it("glass + any includes 'Avoid direct contact with the pollutant'", () => {
    expect(recommend("waste_pollution", "Medium", "glass"))
      .toContain("Avoid direct contact with the pollutant");
  });
  it("organic + Low includes 'Organize a community cleanup'", () => {
    expect(recommend("waste_pollution", "Low", "organic"))
      .toContain("Organize a community cleanup");
  });
  it("construction + High includes 'Restrict public access to the affected zone'", () => {
    expect(recommend("waste_pollution", "High", "construction"))
      .toContain("Restrict public access to the affected zone");
  });
});

// ── Category-specific context ─────────────────────────────────────────────────
describe("category-contextual actions", () => {
  it("air_pollution + High includes 'Avoid the area until assessed by authorities'", () => {
    expect(recommend("air_pollution", "High"))
      .toContain("Avoid the area until assessed by authorities");
  });
  it("air_pollution + Critical includes respiratory protection action", () => {
    expect(recommend("air_pollution", "Critical"))
      .toContain("Wear respiratory protection near the area");
  });
  it("water_pollution + Critical includes 'Avoid direct contact with the pollutant'", () => {
    expect(recommend("water_pollution", "Critical"))
      .toContain("Avoid direct contact with the pollutant");
  });
  it("water_pollution + Medium includes 'Test local water supply for contamination'", () => {
    expect(recommend("water_pollution", "Medium"))
      .toContain("Test local water supply for contamination");
  });
  it("soil_pollution + Medium includes 'Request soil remediation assessment'", () => {
    expect(recommend("soil_pollution", "Medium"))
      .toContain("Request soil remediation assessment");
  });
  it("noise_pollution + Medium includes 'Install noise barriers or request noise assessment'", () => {
    expect(recommend("noise_pollution", "Medium"))
      .toContain("Install noise barriers or request noise assessment");
  });
  it("light_pollution + Low includes 'Reduce outdoor lighting or shield fixtures downward'", () => {
    expect(recommend("light_pollution", "Low"))
      .toContain("Reduce outdoor lighting or shield fixtures downward");
  });
});

// ── Scenario examples matching the spec ──────────────────────────────────────
describe("spec scenario coverage", () => {
  it("plastic floating in river → water_pollution + High → notify + water actions", () => {
    // category = water_pollution, urgency = High (proximity implied by River)
    const result = recommend("water_pollution", "High");
    expect(result).toContain("Notify local authorities");
    expect(result.length).toBeLessThanOrEqual(4);
  });
  it("burning plastic → air_pollution + Critical → notify + escalate + safety actions", () => {
    const result = recommend("air_pollution", "Critical");
    expect(result).toContain("Notify local authorities");
    expect(result).toContain("Escalate to environmental emergency services");
  });
  it("organic vegetables dumped → waste_pollution/organic + Low → cleanup actions", () => {
    const result = recommend("waste_pollution", "Low", "organic");
    expect(result).toContain("Organize a community cleanup");
  });
});

// ── ACTION_POOL integrity ────────────────────────────────────────────────────
describe("ACTION_POOL integrity", () => {
  it("includes all original actions", () => {
    expect(ACTION_POOL).toContain("Notify local authorities");
    expect(ACTION_POOL).toContain("Escalate to environmental emergency services");
    expect(ACTION_POOL).toContain("Organize a community cleanup");
    expect(ACTION_POOL).toContain("Avoid direct contact with the pollutant");
    expect(ACTION_POOL).toContain("Document the location with additional photos");
  });
  it("includes new context-aware actions", () => {
    expect(ACTION_POOL).toContain("Test local water supply for contamination");
    expect(ACTION_POOL).toContain("Request soil remediation assessment");
    expect(ACTION_POOL).toContain("Wear respiratory protection near the area");
    expect(ACTION_POOL).toContain("Seal windows and stay indoors");
    expect(ACTION_POOL).toContain("Request e-waste collection service");
    expect(ACTION_POOL).toContain("Schedule a chemical waste pickup");
    expect(ACTION_POOL).toContain("Restrict public access to the affected zone");
  });
});
