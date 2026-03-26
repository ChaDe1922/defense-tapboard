import { cn } from '../lib/utils';

const accents = {
  slate: {
    active: 'bg-slate-900 text-white border border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100',
    inactive: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700',
  },
  purple: {
    active: 'bg-violet-600 text-white border border-violet-600 shadow-sm',
    inactive: 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 hover:border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700 dark:hover:bg-violet-900/50',
  },
  emerald: {
    active: 'bg-emerald-600 text-white border border-emerald-600 shadow-sm',
    inactive: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/50',
  },
  amber: {
    active: 'bg-amber-500 text-white border border-amber-500 shadow-sm',
    inactive: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/50',
  },
  red: {
    active: 'bg-rose-600 text-white border border-rose-600 shadow-sm',
    inactive: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 dark:hover:bg-rose-900/50',
  },
};

export default function Selector({ label, active, onClick, accent = 'slate' }) {
  const palette = accents[accent] || accents.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-xl px-4 py-3.5 min-h-[48px] text-base md:text-lg font-semibold transition-all duration-150 active:scale-[0.97] cursor-pointer',
        active ? palette.active : palette.inactive
      )}
    >
      {label}
    </button>
  );
}
