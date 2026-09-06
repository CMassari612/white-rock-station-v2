interface StatCardProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md text-center hover:shadow-xl transition-shadow">
      {icon && (
        <div className="flex justify-center mb-3">
          {icon}
        </div>
      )}
      <div className="text-[var(--river-blue)] mb-2">{value}</div>
      <p className="text-[var(--forest-green)]/70">{label}</p>
    </div>
  );
}
