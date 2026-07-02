"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReportCard from "@/components/ReportCard";
import StatCard from "@/components/StatCard";
import ReportFiltersPanel, {
  DEFAULT_FILTERS,
  applyFilters,
  countActiveFilters,
  type ReportFilters,
} from "@/components/ReportFilters";
import { fetchAllReports } from "@/lib/reports";
import type { Report } from "@/types/report";

// ── Lazy-load map (Leaflet needs window — no SSR) ────────────────────────────
const PollutionMap = dynamic(() => import("@/components/PollutionMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 animate-pulse flex items-center justify-center"
         style={{ height: 480 }}>
      <p className="text-sm text-gray-400">Loading map…</p>
    </div>
  ),
});

// ── Skeleton loaders ──────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden
                    flex flex-col sm:flex-row animate-pulse">
      <div className="sm:w-36 h-40 sm:h-auto bg-gray-200 shrink-0" />
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-gray-200" />
          <div className="h-4 w-28 rounded bg-gray-200" />
        </div>
        <div className="h-3 w-40 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-3/4 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4
                    flex items-center gap-4 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
      <div className="flex flex-col gap-1.5">
        <div className="h-6 w-10 rounded bg-gray-200" />
        <div className="h-2.5 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ── Active tab ────────────────────────────────────────────────────────────────
type Tab = "list" | "map";

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [reports,  setReports]  = useState<Report[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<Tab>("list");
  const [filters,  setFilters]  = useState<ReportFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchAllReports();

    if (fetchError || !data) {
      setError(fetchError ?? "Failed to load reports.");
      setReports([]);
    } else {
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setReports(sorted);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  // ── Derived: filter options from data ────────────────────────────────────
  const availableProvinces = useMemo(() => {
    const s = new Set<string>();
    for (const r of reports) if (r.geo_province) s.add(r.geo_province);
    return [...s].sort();
  }, [reports]);

  const availableCities = useMemo(() => {
    const s = new Set<string>();
    for (const r of reports) {
      // Restrict city list to selected province if active
      if (filters.province && r.geo_province !== filters.province) continue;
      if (r.geo_city) s.add(r.geo_city);
    }
    return [...s].sort();
  }, [reports, filters.province]);

  // ── Derived: filtered list ────────────────────────────────────────────────
  const filtered = useMemo(
    () => reports.filter((r) => applyFilters(r, filters)),
    [reports, filters]
  );

  // ── Derived: stats (from full list, not filtered) ────────────────────────
  const totalReports  = reports.length;
  const criticalCount = reports.filter((r) => r.urgency_level === "Critical").length;
  const highCount     = reports.filter((r) => r.urgency_level === "High").length;
  const lowCount      = reports.filter((r) => r.urgency_level === "Low").length;

  const activeFilterCount = countActiveFilters(filters);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">🌍 Pollution Reports</h1>
          <p className="text-sm text-gray-500">All submitted reports, most recent first.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`inline-flex items-center gap-1.5 text-sm font-medium rounded-xl px-4 py-2
                        border transition-colors
                        ${showFilters
                          ? "bg-green-50 border-green-300 text-green-700"
                          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            🔎 Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                               bg-green-600 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            aria-label="Refresh reports"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600
                       border border-gray-300 bg-white rounded-xl px-4 py-2
                       hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={loading ? "animate-spin inline-block" : ""} aria-hidden="true">🔄</span>
            Refresh
          </button>

          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white
                       bg-green-600 rounded-xl px-4 py-2 hover:bg-green-700 transition-colors"
          >
            + New Report
          </Link>
        </div>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {loading ? (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        ) : (
          <>
            <StatCard label="Total Reports" value={totalReports}  icon="📋" colorClass="bg-blue-50 text-blue-500" />
            <StatCard label="Critical"       value={criticalCount} icon="🔴" colorClass="bg-red-50 text-red-500" />
            <StatCard label="High"           value={highCount}     icon="🟠" colorClass="bg-orange-50 text-orange-500" />
            <StatCard label="Low"            value={lowCount}      icon="🟢" colorClass="bg-green-50 text-green-600" />
          </>
        )}
      </div>

      {/* ── Filter panel ────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="mb-6">
          <ReportFiltersPanel
            filters={filters}
            onChange={setFilters}
            availableProvinces={availableProvinces}
            availableCities={availableCities}
            activeCount={activeFilterCount}
          />
        </div>
      )}

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div role="alert"
             className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4
                        flex items-start gap-3 text-sm text-red-700">
          <span className="text-lg shrink-0" aria-hidden="true">⚠️</span>
          <div>
            <p className="font-semibold mb-0.5">Could not load reports</p>
            <p className="text-red-600">{error}</p>
            <button type="button" onClick={loadReports}
                    className="mt-2 text-xs font-semibold underline hover:text-red-900">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ── Tab switcher (List / Map) ────────────────────────────────────── */}
      {!loading && !error && reports.length > 0 && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(["list", "map"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors
                ${tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "list" ? "📋 List" : "🗺️ Map"}
            </button>
          ))}
        </div>
      )}

      {/* ── Loading state ────────────────────────────────────────────────── */}
      {loading && (
        <ul className="flex flex-col gap-4" aria-label="Loading reports">
          {Array.from({ length: 4 }).map((_, i) => <li key={i}><CardSkeleton /></li>)}
        </ul>
      )}

      {/* ── List view ────────────────────────────────────────────────────── */}
      {!loading && !error && tab === "list" && (
        <>
          {/* Filtered count */}
          {activeFilterCount > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of{" "}
              <span className="font-semibold text-gray-800">{reports.length}</span> reports
            </p>
          )}

          {filtered.length > 0 ? (
            <ul className="flex flex-col gap-4" aria-label="Pollution reports">
              {filtered.map((report) => (
                <li key={report.id}><ReportCard report={report} /></li>
              ))}
            </ul>
          ) : (
            <div className="py-16 text-center">
              <p className="text-gray-500 text-sm">No reports match the current filters.</p>
              <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="mt-3 text-xs font-semibold text-green-700 underline">
                Clear filters
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Map view ─────────────────────────────────────────────────────── */}
      {!loading && !error && tab === "map" && (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" />Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-600 inline-block" />High</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-600 inline-block" />Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" />Low</span>
            <span className="ml-auto text-gray-400">Heatmap intensity = report density × urgency</span>
          </div>

          {/* Map — key forces full remount when filtered set changes */}
          <PollutionMap
            key={filtered.map((r) => r.id).join(",")}
            reports={filtered}
            height="520px"
          />

          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400">
              No reports with GPS coordinates match the current filters.
            </p>
          )}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && !error && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-4xl">🌿</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No reports yet</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
              No pollution reports have been submitted yet. Be the first to help keep our environment clean.
            </p>
          </div>
          <Link href="/report"
                className="inline-flex items-center gap-2 bg-green-600 text-white
                           text-sm font-semibold px-6 py-3 rounded-xl
                           hover:bg-green-700 transition-colors shadow-sm">
            📷 Submit the First Report
          </Link>
        </div>
      )}
    </div>
  );
}
