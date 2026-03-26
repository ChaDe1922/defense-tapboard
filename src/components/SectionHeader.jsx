export default function SectionHeader({ title, badge, badgeVariant = 'secondary' }) {
  const badgeStyles = {
    secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    success: 'bg-emerald-600 text-white dark:bg-emerald-500',
  };

  return (
    <div className="flex items-center justify-between mb-2.5">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      {badge && (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[badgeVariant]}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
