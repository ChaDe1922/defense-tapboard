import { cn } from '../lib/utils';

export default function PresetCard({ preset, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left transition active:scale-[0.98] cursor-pointer',
        selected
          ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200'
          : 'border-slate-300 bg-white hover:bg-slate-50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-slate-900 text-base">{preset.name}</div>
        {preset.favorite && (
          <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white">
            Fav
          </span>
        )}
      </div>
      <div className="mt-1.5 text-sm text-slate-600">
        {preset.playType} · {preset.blitz} · {preset.lineStunt ?? preset.stunt}
      </div>
    </button>
  );
}
