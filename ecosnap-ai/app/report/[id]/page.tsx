import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import UrgencyBadge from "@/components/UrgencyBadge";
import type { PollutionCategory, UrgencyLevel } from "@/types/report";

/** Converts a snake_case category string to Title Case with spaces. */
function formatCategory(category: PollutionCategory): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;

  // Fetch the report from Supabase by ID
  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !report) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* ── Success confirmation ── */}
      <div
        role="status"
        className="mb-8 rounded-md bg-green-50 border border-green-200 px-4 py-3"
      >
        <p className="text-sm font-medium text-green-800">
          ✅ Your report has been saved.
        </p>
        <p className="mt-1 text-xs text-green-700 break-all">
          Report ID: <span className="font-mono font-semibold">{id}</span>
        </p>
      </div>

      {/* ── Page heading ── */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Report Results</h1>

      {/* ── Classification card ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Pollution Category
          </dt>
          <dd className="text-lg font-semibold text-gray-900">
            {formatCategory(report.pollution_category as PollutionCategory)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Urgency Level
          </dt>
          <dd>
            <UrgencyBadge level={report.urgency_level as UrgencyLevel} />
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Location
          </dt>
          <dd className="text-sm text-gray-700">{report.location}</dd>
        </div>

        {report.description && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Description
            </dt>
            <dd className="text-sm text-gray-700">{report.description}</dd>
          </div>
        )}

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Recommended Actions
          </dt>
          <dd>
            <ol className="list-decimal list-inside space-y-1.5">
              {(report.recommended_actions as string[]).map((action: string) => (
                <li key={action} className="text-sm text-gray-700">
                  {action}
                </li>
              ))}
            </ol>
          </dd>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/report"
          className="inline-flex items-center justify-center rounded-md bg-green-600
                     px-5 py-2.5 text-sm font-semibold text-white shadow-sm
                     hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                     transition-colors"
        >
          Report Another Pollution
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-white
                     border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700
                     shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2
                     focus:ring-green-500 transition-colors"
        >
          View All Reports
        </Link>
      </div>
    </div>
  );
}
