interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  /** Tailwind color classes for the icon background + text */
  colorClass: string;
}

export default function StatCard({ label, value, icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4
                    flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${colorClass}`}>
        <span aria-hidden="true">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
