"use client";

/**
 * components/PollutionMap.tsx
 *
 * Interactive Leaflet/OpenStreetMap component that renders:
 *  - Colour-coded markers for each report (by urgency)
 *  - Popup on each marker with full report details
 *  - Heatmap layer driven by report density
 *
 * Must be imported with next/dynamic + ssr:false because Leaflet
 * accesses `window` at module load time.
 */

import { useEffect, useRef } from "react";
import type { Report } from "@/types/report";
import { getPollutionLabel, WASTE_TYPE_ICON, CATEGORY_ICON } from "@/lib/pollution-meta";
import { displayLocation } from "@/types/report";
import { formatRelativeTime } from "@/components/ReportCard";

// ── Urgency → marker colour ────────────────────────────────────────────────
const URGENCY_COLOUR: Record<string, string> = {
  Critical: "#dc2626", // red-600
  High:     "#ea580c", // orange-600
  Medium:   "#ca8a04", // yellow-600
  Low:      "#16a34a", // green-600
};

const PLACEHOLDER = "/placeholder-photo.jpg";

function buildMarkerSvg(color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`;
}

interface PollutionMapProps {
  reports: Report[];
  height?: string;
}

export default function PollutionMap({ reports, height = "480px" }: PollutionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // already initialised

    // ── Dynamic Leaflet import (avoids SSR crash) ────────────────────────
    let map: import("leaflet").Map;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.heat");

      // Fix default icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!containerRef.current) return;

      // ── Determine initial centre ────────────────────────────────────────
      const reportsWithCoords = reports.filter(
        (r) => r.latitude != null && r.longitude != null
      );

      const center: [number, number] =
        reportsWithCoords.length > 0
          ? [reportsWithCoords[0].latitude!, reportsWithCoords[0].longitude!]
          : [0, 0];

      const zoom = reportsWithCoords.length > 0 ? 10 : 2;

      map = L.map(containerRef.current, { zoomControl: true }).setView(center, zoom);
      mapRef.current = map;

      // ── Base tile layer ─────────────────────────────────────────────────
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // ── Markers ─────────────────────────────────────────────────────────
      for (const report of reports) {
        if (report.latitude == null || report.longitude == null) continue;

        const color  = URGENCY_COLOUR[report.urgency_level] ?? "#6b7280";
        const svgStr = buildMarkerSvg(color);
        const icon   = L.divIcon({
          className: "",
          html:      svgStr,
          iconSize:  [24, 32],
          iconAnchor:[12, 32],
          popupAnchor: [0, -34],
        });

        const { primary, secondary } = getPollutionLabel(
          report.pollution_category,
          report.waste_type
        );
        const locationText = displayLocation(report);
        const timeText     = formatRelativeTime(report.created_at);
        const isPlaceholder = !report.photo_url || report.photo_url === PLACEHOLDER;
        const subtypeIcon  = report.waste_type ? WASTE_TYPE_ICON[report.waste_type] : null;
        const catIcon      = CATEGORY_ICON[report.pollution_category] ?? "⚠️";

        // Build popup HTML
        const photoHtml = isPlaceholder
          ? `<div class="ecosnap-popup-thumb ecosnap-popup-thumb-placeholder">${subtypeIcon ?? catIcon}</div>`
          : `<img src="${report.photo_url}" alt="Report photo" class="ecosnap-popup-thumb ecosnap-popup-thumb-img" />`;

        const subtypeHtml = secondary
          ? `<span class="ecosnap-popup-subtype">${subtypeIcon ?? ""} ${secondary}</span>`
          : "";

        const actionsHtml = (report.recommended_actions ?? [])
          .slice(0, 3)
          .map((a) => `<li>${a}</li>`)
          .join("");

        const popupHtml = `
          <div class="ecosnap-popup">
            ${photoHtml}
            <div class="ecosnap-popup-body">
              <div class="ecosnap-popup-header">
                <span class="ecosnap-popup-urgency ecosnap-urgency-${report.urgency_level.toLowerCase()}">${report.urgency_level}</span>
                <span class="ecosnap-popup-category">${primary}</span>
              </div>
              ${subtypeHtml}
              <div class="ecosnap-popup-confidence">Confidence: <strong>${report.confidence}%</strong></div>
              <div class="ecosnap-popup-location">📍 ${locationText}</div>
              <div class="ecosnap-popup-time">🕐 ${timeText}</div>
              ${actionsHtml ? `<ul class="ecosnap-popup-actions">${actionsHtml}</ul>` : ""}
            </div>
          </div>`;

        L.marker([report.latitude, report.longitude], { icon })
          .bindPopup(popupHtml, { maxWidth: 280, className: "ecosnap-leaflet-popup" })
          .addTo(map);
      }

      // ── Heatmap layer ───────────────────────────────────────────────────
      const heatPoints = reportsWithCoords.map((r) => {
        // Intensity by urgency: Critical=1.0, High=0.7, Medium=0.4, Low=0.2
        const intensity =
          r.urgency_level === "Critical" ? 1.0 :
          r.urgency_level === "High"     ? 0.7 :
          r.urgency_level === "Medium"   ? 0.4 : 0.2;
        return [r.latitude!, r.longitude!, intensity] as [number, number, number];
      });

      if (heatPoints.length > 0) {
        L.heatLayer(heatPoints, {
          radius:     35,
          blur:       25,
          maxZoom:    15,
          max:        1.0,
          minOpacity: 0.3,
          gradient: {
            "0.2": "#16a34a",   // Low  → green
            "0.4": "#ca8a04",   // Medium → yellow
            "0.7": "#ea580c",   // High  → orange
            "1.0": "#dc2626",   // Critical → red
          },
        }).addTo(map);
      }

      // ── Auto-fit bounds ─────────────────────────────────────────────────
      if (reportsWithCoords.length > 1) {
        const bounds = L.latLngBounds(
          reportsWithCoords.map((r) => [r.latitude!, r.longitude!])
        );
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    init().catch(console.error);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Only run once on mount — report list changes are handled by key-based remount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Popup styles injected via a global <style> tag — Leaflet popups live
          outside the React tree so Tailwind classes don't reach them */}
      <style>{`
        .ecosnap-leaflet-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .ecosnap-leaflet-popup .leaflet-popup-content { margin: 0; width: auto !important; }
        .ecosnap-popup { font-family: inherit; font-size: 13px; min-width: 220px; max-width: 280px; }
        .ecosnap-popup-thumb { width: 100%; height: 120px; object-fit: cover; display: block; }
        .ecosnap-popup-thumb-placeholder {
          background: #f3f4f6; display: flex; align-items: center;
          justify-content: center; font-size: 2.5rem;
        }
        .ecosnap-popup-body { padding: 10px 12px 12px; }
        .ecosnap-popup-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .ecosnap-popup-urgency {
          font-size: 11px; font-weight: 700; padding: 2px 8px;
          border-radius: 999px; text-transform: uppercase; letter-spacing: .04em;
        }
        .ecosnap-urgency-critical { background:#fee2e2; color:#b91c1c; }
        .ecosnap-urgency-high     { background:#ffedd5; color:#c2410c; }
        .ecosnap-urgency-medium   { background:#fef9c3; color:#92400e; }
        .ecosnap-urgency-low      { background:#dcfce7; color:#15803d; }
        .ecosnap-popup-category { font-size: 13px; font-weight: 600; color: #111827; }
        .ecosnap-popup-subtype {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; background: #fef3c7; color: #92400e;
          border-radius: 999px; padding: 1px 8px; margin-bottom: 4px;
        }
        .ecosnap-popup-confidence { font-size: 12px; color: #4b5563; margin: 4px 0; }
        .ecosnap-popup-location { font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ecosnap-popup-time { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .ecosnap-popup-actions { margin: 6px 0 0; padding: 0 0 0 14px; font-size: 11px; color: #374151; line-height: 1.5; }
      `}</style>

      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0"
        aria-label="Pollution reports map"
      />
    </>
  );
}
