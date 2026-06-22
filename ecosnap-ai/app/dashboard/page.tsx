import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ReportCard from "@/components/ReportCard";
import type { Report } from "@/types/report";

export default async function DashboardPage() {
  const { data: reports, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  const reportList: Report[] = error ? [] : (reports ?? []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pollution Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          All submitted pollution reports, most recent first.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          Failed to load reports. Please try refreshing the page.
        </div>
      )}

      {reportList.length > 0 ? (
        /* Report list */
        <ul className="flex flex-col gap-4">
          {reportList.map((report) => (
            <li key={report.id}>
              <ReportCard report={report} />
            </li>
          ))}
        </ul>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="text-5xl">🌿</div>
          <h2 className="text-lg font-semibold text-gray-700">No reports yet</h2>
          <p className="text-sm text-gray-500 max-w-xs">
            No pollution reports have been submitted yet. Be the first to help
            keep our environment clean.
          </p>
          <Link
            href="/report"
            className="mt-2 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-green-700 transition-colors"
          >
            Submit a Report
          </Link>
        </div>
      )}
    </div>
  );
}
