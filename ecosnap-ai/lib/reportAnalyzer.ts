import type { Report } from "@/types/report";

export function buildReportContext(reports: Report[]) {
  return reports
    .map((r) => {
      return `
Category : ${r.pollution_category}
Waste    : ${r.waste_type ?? "-"}
Urgency  : ${r.urgency_level}
Location : ${r.geo_city ?? r.location}
Description : ${r.description}
Confidence : ${r.confidence}
`;
    })
    .join("\n-----------------\n");
}