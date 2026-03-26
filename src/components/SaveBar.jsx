import { cn } from '../lib/utils';
import { useGame } from '../lib/GameContext';

export default function SaveBar({ onContinueToOutcome }) {
  const { selectedPlayType, selectedBlitz, selectedStunt, clearEntry, showToast } = useGame();

  const hasAnyCall = Boolean(selectedPlayType || selectedBlitz || selectedStunt);

  function handleContinue() {
    if (!hasAnyCall) {
      showToast('Select at least one call option first.', 1800);
      return;
    }
    onContinueToOutcome();
  }

  return (
    <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-lg px-2.5 md:px-4 py-3 dark:bg-slate-900/95 dark:border-slate-700">
      <div className="mb-2.5 text-[0.9375rem] font-semibold text-slate-700 dark:text-slate-300">
        {hasAnyCall ? '✓ Ready — continue to select outcome' : 'Select at least one call option'}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={clearEntry}
          aria-label="Clear current entry"
          className="min-h-[48px] rounded-xl border border-slate-300 bg-white text-base md:text-lg font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-all duration-150 active:scale-[0.98] cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!hasAnyCall}
          aria-label="Continue to outcome selection"
          className={cn(
            'col-span-2 min-h-[48px] rounded-xl border text-base md:text-lg font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer',
            hasAnyCall
              ? 'bg-violet-600 hover:bg-violet-700 border-violet-600 text-white shadow-sm'
              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
          )}
        >
          Continue to Outcome →
        </button>
      </div>
    </div>
  );
}
