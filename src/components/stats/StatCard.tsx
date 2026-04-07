interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export const StatCard = ({ label, value, sub }: StatCardProps) => (
  <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-4xl font-bold text-gradient">{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
);
