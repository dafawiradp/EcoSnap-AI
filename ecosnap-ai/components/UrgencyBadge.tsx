import type { UrgencyLevel } from "@/types/report";

export type { UrgencyLevel };

const urgencyStyles: Record<UrgencyLevel, string> = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

interface UrgencyBadgeProps {
  level: UrgencyLevel;
}

export default function UrgencyBadge({ level }: UrgencyBadgeProps) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${urgencyStyles[level]}`}
    >
      {level}
    </span>
  );
}
