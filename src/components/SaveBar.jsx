import { cn } from '../lib/utils';
import { useGame } from '../lib/GameContext';

export default function SaveBar() {
  const { isValid, clearEntry, savePlay } = useGame();

  return (
    <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur px-4 md:px-6 py-3">
      <div className="mb-2 text-sm font-medium text-slate-600">
        {isValid ? 'Ready to save' : 'Choose all required values to save this play'}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={clearEntry}
          className="h-12 rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-800 hover:bg-slate-50 transition active:scale-[0.99] cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => savePlay(false)}
          className="h-12 rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-800 hover:bg-slate-50 transition active:scale-[0.99] cursor-pointer"
        >
          Save Play
        </button>
        <button
          type="button"
          onClick={() => savePlay(true)}
          disabled={!isValid}
          className={cn(
            'h-12 rounded-xl border text-base font-semibold transition active:scale-[0.99] cursor-pointer',
            isValid
              ? 'bg-violet-600 hover:bg-violet-700 border-violet-600 text-white'
              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          Save + Next
        </button>
      </div>
    </div>
  );
}
