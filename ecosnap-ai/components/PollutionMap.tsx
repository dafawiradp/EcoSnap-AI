"use client";

/**
 * ============================================================================
 * PollutionMap.tsx
 * ============================================================================
 * EcoSnap AI
 *
 * Compatible with:
 * - Next.js 15
 * - React 19
 * - TypeScript 5
 *
 * Features:
 * - OpenStreetMap
 * - Leaflet markers
 * - Beautiful popup
 * - Auto fit bounds
 *
 * NOTE:
 * Heatmap sengaja dihapus terlebih dahulu agar build 100% bersih.
 * Setelah project selesai build baru kita tambahkan lagi.
 * ============================================================================
 */

import { useEffect, useRef } from "react";
import type { Report } from "@/types/report";

import {
  CATEGORY_ICON,
  WASTE_TYPE_ICON,
  getPollutionLabel,
} from "@/lib/pollution-meta";

import { displayLocation } from "@/types/report";
import { formatRelativeTime } from "@/components/ReportCard";

const PLACEHOLDER = "/placeholder-photo.jpg";

const URGENCY_COLOR: Record<string, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#ca8a04",
  Low: "#16a34a",
};

interface PollutionMapProps {
  reports: Report[];
  height?: string;
}

function buildMarkerSvg(color: string) {
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="32"
      viewBox="0 0 24 32"
    >
      <path
        d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z"
        fill="${color}"
        stroke="white"
        stroke-width="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="5"
        fill="white"
      />
    </svg>
  `;
}

export default function PollutionMap({
  reports,
  height = "480px",
}: PollutionMapProps) {

  const containerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {

    if (!containerRef.current) return;

    if (mapRef.current) {
  mapRef.current.remove();
  mapRef.current = null;
}

    if (mapRef.current) return;

    let map: import("leaflet").Map;

    async function init() {

      const L = (await import("leaflet")).default;

      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const reportsWithCoords = reports.filter(
        (report) =>
          report.latitude != null &&
          report.longitude != null
      );

      const center: [number, number] =
        reportsWithCoords.length > 0
          ? [
              reportsWithCoords[0].latitude!,
              reportsWithCoords[0].longitude!,
            ]
          : [0, 0];

      const zoom =
        reportsWithCoords.length > 0
          ? 10
          : 2;

      const container = containerRef.current!;

if (!container) return;

map = L.map(container, {
  zoomControl: true,
}).setView(center, zoom);

      mapRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // ============================================================
      // MARKERS
      // ============================================================

      for (const report of reports) {

        if (
          report.latitude == null ||
          report.longitude == null
        ) {
          continue;
        }

        const color =
          URGENCY_COLOR[report.urgency_level] ??
          "#6b7280";

        const icon = L.divIcon({
          className: "",
          html: buildMarkerSvg(color),
          iconSize: [24, 32],
          iconAnchor: [12, 32],
          popupAnchor: [0, -34],
        });

        const {
          primary,
          secondary,
        } = getPollutionLabel(
          report.pollution_category,
          report.waste_type
        );

        const subtypeIcon =
          report.waste_type
            ? WASTE_TYPE_ICON[report.waste_type]
            : null;

        const categoryIcon =
          CATEGORY_ICON[report.pollution_category] ??
          "⚠️";

        const locationText =
          displayLocation(report);

        const timeText =
          formatRelativeTime(report.created_at);        const isPlaceholder =
          !report.photo_url ||
          report.photo_url === PLACEHOLDER;

        const photoHtml = isPlaceholder
          ? `
            <div class="ecosnap-popup-thumb ecosnap-popup-thumb-placeholder">
              ${subtypeIcon ?? categoryIcon}
            </div>
          `
          : `
            <img
              src="${report.photo_url}"
              alt="Report Photo"
              class="ecosnap-popup-thumb"
            />
          `;

        const subtypeHtml = secondary
          ? `
            <span class="ecosnap-popup-subtype">
              ${subtypeIcon ?? ""}
              ${secondary}
            </span>
          `
          : "";

        const actionsHtml = (report.recommended_actions ?? [])
          .slice(0, 3)
          .map((action) => `<li>${action}</li>`)
          .join("");

        const popupHtml = `
          <div class="ecosnap-popup">

            ${photoHtml}

            <div class="ecosnap-popup-body">

              <div class="ecosnap-popup-header">

                <span
                  class="ecosnap-popup-urgency ecosnap-urgency-${report.urgency_level.toLowerCase()}"
                >
                  ${report.urgency_level}
                </span>

                <span class="ecosnap-popup-category">
                  ${primary}
                </span>

              </div>

              ${subtypeHtml}

              <div class="ecosnap-popup-confidence">
                Confidence:
                <strong>${report.confidence}%</strong>
              </div>

              <div class="ecosnap-popup-location">
                📍 ${locationText}
              </div>

              <div class="ecosnap-popup-time">
                🕐 ${timeText}
              </div>

              ${
                actionsHtml
                  ? `
                    <ul class="ecosnap-popup-actions">
                      ${actionsHtml}
                    </ul>
                  `
                  : ""
              }

            </div>

          </div>
        `;

        L.marker(
          [
            report.latitude,
            report.longitude,
          ],
          {
            icon,
          }
        )
          .bindPopup(
            popupHtml,
            {
              maxWidth: 300,
              className:
                "ecosnap-leaflet-popup",
            }
          )
          .addTo(map);
      }

      // ============================================================
      // AUTO FIT BOUNDS
      // ============================================================

      if (reportsWithCoords.length > 1) {

        const bounds = L.latLngBounds(
          reportsWithCoords.map((report) => [
            report.latitude!,
            report.longitude!,
          ])
        );

        map.fitBounds(bounds, {
          padding: [40, 40],
        });

      }

    }

    init().catch(console.error);

    return () => {

      mapRef.current?.remove();

      mapRef.current = null;

    };

  }, [reports]);  return (
    <>
      <style>{`
        .ecosnap-leaflet-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,.15);
        }

        .ecosnap-leaflet-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }

        .ecosnap-popup {
          font-family: inherit;
          font-size: 13px;
          min-width: 220px;
          max-width: 300px;
        }

        .ecosnap-popup-thumb {
          width: 100%;
          height: 120px;
          object-fit: cover;
          display: block;
        }

        .ecosnap-popup-thumb-placeholder {
          width: 100%;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          background: #f3f4f6;
        }

        .ecosnap-popup-body {
          padding: 12px;
        }

        .ecosnap-popup-header {
          display: flex;
          gap: 6px;
          align-items: center;
          margin-bottom: 6px;
        }

        .ecosnap-popup-urgency {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .ecosnap-urgency-critical {
          background: #fee2e2;
          color: #b91c1c;
        }

        .ecosnap-urgency-high {
          background: #ffedd5;
          color: #c2410c;
        }

        .ecosnap-urgency-medium {
          background: #fef9c3;
          color: #92400e;
        }

        .ecosnap-urgency-low {
          background: #dcfce7;
          color: #15803d;
        }

        .ecosnap-popup-category {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .ecosnap-popup-subtype {
          display: inline-flex;
          gap: 4px;
          align-items: center;
          margin-bottom: 6px;
          padding: 2px 8px;
          border-radius: 999px;
          background: #fef3c7;
          color: #92400e;
          font-size: 11px;
        }

        .ecosnap-popup-confidence {
          font-size: 12px;
          color: #4b5563;
          margin: 6px 0;
        }

        .ecosnap-popup-location {
          font-size: 12px;
          color: #6b7280;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .ecosnap-popup-time {
          margin-top: 2px;
          font-size: 11px;
          color: #9ca3af;
        }

        .ecosnap-popup-actions {
          margin: 8px 0 0;
          padding-left: 16px;
          font-size: 11px;
          color: #374151;
          line-height: 1.5;
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height,
        }}
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0"
        aria-label="Pollution reports map"
      />
    </>
  );
}