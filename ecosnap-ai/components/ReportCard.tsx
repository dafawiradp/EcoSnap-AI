import UrgencyBadge from "./UrgencyBadge";
import type { PollutionCategory, Report } from "@/types/report";

export type { PollutionCategory, Report };

/** Converts a snake_case category string to Title Case with spaces. */
function formatCategory(category: PollutionCategory): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Formats an ISO timestamp using the locale's default date/time format. */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
      {/* Top row: urgency badge + category */}
      <div className="flex items-center gap-3">
        <UrgencyBadge level={report.urgency_level} />
        <span className="text-sm font-medium text-gray-800">
          {formatCategory(report.pollution_category)}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <span>📍</span>
        <span>{report.location}</span>
      </div>

      {/* Timestamp */}
      <div className="text-xs text-gray-400">
        Submitted: {formatTimestamp(report.created_at)}
      </div>
    </div>
  );
}
