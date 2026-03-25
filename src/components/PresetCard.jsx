import { cn } from '../lib/utils';

export default function PresetCard({ preset, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Preset: ${preset.name}${preset.favorite ? ' (favorite)' : ''}`}
      className={cn(
        'rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.97] cursor-pointer',
        selected
          ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-300 shadow-sm dark:bg-violet-900/30 dark:border-violet-500 dark:ring-violet-700'
          : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base">{preset.name}</div>
        {preset.favorite && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-amber-500 flex-shrink-0" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )}
      </div>
      <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
        {preset.playType} · {preset.blitz} · {preset.lineStunt ?? preset.stunt}
      </div>
    </button>
  );
}
