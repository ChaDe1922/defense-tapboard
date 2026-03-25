export default function SectionHeader({ title, badge, badgeVariant = 'secondary' }) {
  const badgeStyles = {
    secondary: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-600 text-white',
  };

  return (
    <div className="flex items-center justify-between mb-2.5">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {badge && (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles[badgeVariant]}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
