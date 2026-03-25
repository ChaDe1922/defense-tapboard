import { cn } from '../lib/utils';

const accents = {
  slate: {
    active: 'bg-slate-900 text-white border-slate-900',
    inactive: 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50',
  },
  purple: {
    active: 'bg-violet-600 text-white border-violet-600',
    inactive: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  },
  emerald: {
    active: 'bg-emerald-600 text-white border-emerald-600',
    inactive: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  amber: {
    active: 'bg-amber-500 text-white border-amber-500',
    inactive: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  red: {
    active: 'bg-rose-600 text-white border-rose-600',
    inactive: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  },
};

export default function Selector({ label, active, onClick, accent = 'slate' }) {
  const palette = accents[accent] || accents.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border px-3.5 py-2.5 text-base font-semibold transition active:scale-[0.98] cursor-pointer',
        active ? palette.active : palette.inactive
      )}
    >
      {label}
    </button>
  );
}
