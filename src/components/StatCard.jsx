export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
        </div>
        {Icon && (
          <div className="rounded-xl bg-violet-50 dark:bg-violet-900/30 p-3 text-violet-700 dark:text-violet-400">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
