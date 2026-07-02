import UrgencyBadge from "./UrgencyBadge";
import {
  CATEGORY_ICON,
  CATEGORY_GRADIENT,
  getPollutionLabel,
  WASTE_TYPE_ICON,
} from "@/lib/pollution-meta";
import { displayLocation } from "@/types/report";
import type { Report } from "@/types/report";

export type { Report };

// ── Time helpers ──────────────────────────────────────────────────────────────

/** Returns a relative time string ("2 hours ago", "just now", etc.) */
export function formatRelativeTime(isoString: string): string {
  const diffMs  = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60)  return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)  return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr  = Math.floor(diffMin / 60);
  if (diffHr  < 24)  return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30)  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

const PLACEHOLDER = "/placeholder-photo.jpg";

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  const isPlaceholder = !report.photo_url || report.photo_url === PLACEHOLDER;
  const { primary, secondary } = getPollutionLabel(
    report.pollution_category,
    report.waste_type
  );
  const locationText = displayLocation(report);

  return (
    <article
      className="group bg-white rounded-2xl border border-gray-200 shadow-sm
                 hover:shadow-md hover:border-green-200 transition-all duration-200
                 overflow-hidden flex flex-col sm:flex-row"
    >
      {/* ── Thumbnail ──────────────────────────────────────────────────────── */}
      <div className="sm:w-36 sm:shrink-0 h-40 sm:h-auto relative overflow-hidden">
        {isPlaceholder ? (
          <div
            className={`w-full h-full bg-gradient-to-br
                        ${CATEGORY_GRADIENT[report.pollution_category]}
                        flex items-center justify-center`}
          >
            <span className="text-5xl" aria-hidden="true">
              {/* Show waste subtype icon inside thumbnail if available */}
              {report.pollution_category === "waste_pollution" && report.waste_type
                ? WASTE_TYPE_ICON[report.waste_type]
                : CATEGORY_ICON[report.pollution_category]}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.photo_url}
            alt={`Photo of ${primary}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* Confidence chip */}
        {report.confidence > 0 && (
          <div
            className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm
                       text-white text-[10px] font-semibold px-2 py-0.5 rounded-full"
          >
            {report.confidence}% match
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">

        {/* Header: urgency badge + category + time */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyBadge level={report.urgency_level} />
            <span className="text-sm font-semibold text-gray-800">{primary}</span>
          </div>
          <time
            dateTime={report.created_at}
            className="text-xs text-gray-400 whitespace-nowrap shrink-0"
          >
            {formatRelativeTime(report.created_at)}
          </time>
        </div>

        {/* Waste subtype chip */}
        {secondary && (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 text-xs font-medium
                         bg-amber-50 text-amber-700 border border-amber-200
                         rounded-full px-2.5 py-0.5"
            >
              {report.waste_type ? WASTE_TYPE_ICON[report.waste_type] : "♻️"}
              {secondary}
            </span>
          </div>
        )}

        {/* Location */}
        {locationText && (
          <div className="flex items-center gap-1 text-xs text-gray-500 min-w-0">
            <span aria-hidden="true">📍</span>
            <span className="truncate">{locationText}</span>
          </div>
        )}

        {/* Description */}
        {report.description ? (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {report.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No description provided.</p>
        )}

        {/* Recommendations preview */}
        {report.recommended_actions.length > 0 && (
          <div className="mt-auto pt-2 border-t border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Recommended
            </p>
            <ul className="flex flex-col gap-1">
              {report.recommended_actions.slice(0, 2).map((action) => (
                <li
                  key={action}
                  className="flex items-center gap-1.5 text-xs text-gray-600"
                >
                  <span
                    className="w-1 h-1 rounded-full bg-green-500 shrink-0"
                    aria-hidden="true"
                  />
                  {action}
                </li>
              ))}
              {report.recommended_actions.length > 2 && (
                <li className="text-xs text-gray-400">
                  +{report.recommended_actions.length - 2} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
