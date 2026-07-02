"use client";

/**
 * components/ReportFilters.tsx
 *
 * Filter panel for the dashboard. Exposes controls for:
 *   category · waste subtype · urgency · province · city · date range · confidence
 *
 * Entirely controlled — parent owns filter state.
 */

import type { PollutionCategory, WasteType, UrgencyLevel } from "@/types/report";
import { CATEGORY_LABEL, WASTE_TYPE_LABEL } from "@/lib/pollution-meta";

// ── Filter shape ─────────────────────────────────────────────────────────────
export interface ReportFilters {
  category:    PollutionCategory | "";
  wasteType:   WasteType | "";
  urgency:     UrgencyLevel | "";
  province:    string;
  city:        string;
  dateFrom:    string; // ISO date string yyyy-mm-dd or ""
  dateTo:      string;
  confidenceMin: number; // 0–100
}

export const DEFAULT_FILTERS: ReportFilters = {
  category:      "",
  wasteType:     "",
  urgency:       "",
  province:      "",
  city:          "",
  dateFrom:      "",
  dateTo:        "",
  confidenceMin: 0,
};

// ── Category options ──────────────────────────────────────────────────────────
const CATEGORY_OPTIONS: { value: PollutionCategory; label: string }[] = (
  Object.entries(CATEGORY_LABEL) as [PollutionCategory, string][]
).map(([value, label]) => ({ value, label }));

const WASTE_TYPE_OPTIONS: { value: WasteType; label: string }[] = (
  Object.entries(WASTE_TYPE_LABEL) as [WasteType, string][]
).map(([value, label]) => ({ value, label }));

const URGENCY_OPTIONS: UrgencyLevel[] = ["Critical", "High", "Medium", "Low"];

// ── Component ────────────────────────────────────────────────────────────────
interface ReportFiltersProps {
  filters:           ReportFilters;
  onChange:          (next: ReportFilters) => void;
  availableProvinces: string[];
  availableCities:   string[];
  activeCount:       number; // number of non-default filters active
}

function SelectField<T extends string>({
  id, label, value, onChange, options, placeholder,
}: {
  id:          string;
  label:       string;
  value:       T | "";
  onChange:    (v: T | "") => void;
  options:     { value: T; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                   text-gray-700"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function ReportFiltersPanel({
  filters,
  onChange,
  availableProvinces,
  availableCities,
  activeCount,
}: ReportFiltersProps) {
  function set<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function reset() {
    onChange(DEFAULT_FILTERS);
  }

  const provinceOptions = availableProvinces.map((p) => ({ value: p as string, label: p }));
  const cityOptions     = availableCities.map((c) => ({ value: c as string, label: c }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-800">🔎 Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                             bg-green-600 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Category */}
        <SelectField
          id="filter-category"
          label="Category"
          value={filters.category}
          onChange={(v) => set("category", v)}
          options={CATEGORY_OPTIONS}
          placeholder="All categories"
        />

        {/* Waste subtype — only relevant when category = waste_pollution */}
        <SelectField
          id="filter-waste-type"
          label="Waste Subtype"
          value={filters.wasteType}
          onChange={(v) => set("wasteType", v)}
          options={WASTE_TYPE_OPTIONS}
          placeholder="All subtypes"
        />

        {/* Urgency */}
        <SelectField
          id="filter-urgency"
          label="Urgency"
          value={filters.urgency}
          onChange={(v) => set("urgency", v as UrgencyLevel | "")}
          options={URGENCY_OPTIONS.map((u) => ({ value: u, label: u }))}
          placeholder="All urgencies"
        />

        {/* Province */}
        <SelectField
          id="filter-province"
          label="Province"
          value={filters.province as PollutionCategory | ""}
          onChange={(v) => set("province", v)}
          options={provinceOptions as { value: PollutionCategory; label: string }[]}
          placeholder="All provinces"
        />

        {/* City */}
        <SelectField
          id="filter-city"
          label="City"
          value={filters.city as PollutionCategory | ""}
          onChange={(v) => set("city", v)}
          options={cityOptions as { value: PollutionCategory; label: string }[]}
          placeholder="All cities"
        />

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-date-from" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            From date
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                       text-gray-700"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-date-to" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            To date
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                       text-gray-700"
          />
        </div>

        {/* Confidence min */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-confidence" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Min confidence: <span className="text-green-700">{filters.confidenceMin}%</span>
          </label>
          <input
            id="filter-confidence"
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.confidenceMin}
            onChange={(e) => set("confidenceMin", Number(e.target.value))}
            className="w-full accent-green-600 mt-1"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={filters.confidenceMin}
          />
        </div>
      </div>
    </div>
  );
}

// ── Filter predicate ─────────────────────────────────────────────────────────

import type { Report } from "@/types/report";

/**
 * Returns true when a report passes all active filters.
 * Pure function — safe to use in .filter() calls.
 */
export function applyFilters(report: Report, f: ReportFilters): boolean {
  if (f.category    && report.pollution_category !== f.category)    return false;
  if (f.wasteType   && report.waste_type          !== f.wasteType)   return false;
  if (f.urgency     && report.urgency_level        !== f.urgency)    return false;
  if (f.province    && report.geo_province         !== f.province)   return false;
  if (f.city        && report.geo_city             !== f.city)       return false;
  if (f.confidenceMin > 0 && report.confidence < f.confidenceMin)   return false;
  if (f.dateFrom) {
    const from = new Date(f.dateFrom).getTime();
    if (new Date(report.created_at).getTime() < from)               return false;
  }
  if (f.dateTo) {
    // Include the full day: add 1 day - 1ms
    const to = new Date(f.dateTo).getTime() + 86_399_999;
    if (new Date(report.created_at).getTime() > to)                 return false;
  }
  return true;
}

/** Counts how many filters differ from their default value */
export function countActiveFilters(f: ReportFilters): number {
  let n = 0;
  if (f.category)         n++;
  if (f.wasteType)        n++;
  if (f.urgency)          n++;
  if (f.province)         n++;
  if (f.city)             n++;
  if (f.dateFrom)         n++;
  if (f.dateTo)           n++;
  if (f.confidenceMin > 0) n++;
  return n;
}
