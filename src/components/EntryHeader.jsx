import { useState } from 'react';
import { cn } from '../lib/utils';
import { useGame } from '../lib/GameContext';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'];

export default function EntryHeader() {
  const { gameInfo, playNumber, quarter, setQuarter, syncStatus, queuedPlayCount, networkStatus } = useGame();
  const [qOpen, setQOpen] = useState(false);

  if (!gameInfo) return null;

  // Determine sync display based on queue and network
  const isOffline = networkStatus?.syncMode === 'offline';
  const hasQueued = queuedPlayCount > 0;

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur px-4 md:px-6 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current game</div>
            <div className="font-bold text-slate-900 text-base">{gameInfo.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Play</div>
          <div className="font-bold text-slate-900 text-base">#{playNumber}</div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setQOpen(!qOpen)}
            className="text-left cursor-pointer"
          >
            <div className="text-xs text-slate-500">Quarter</div>
            <div className="font-bold text-slate-900 text-base flex items-center gap-1">
              {quarter}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-slate-400">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </button>
          {qOpen && (
            <div className="absolute top-full left-0 mt-1 z-20 rounded-xl bg-white shadow-lg ring-1 ring-slate-200 py-1 min-w-[72px]">
              {quarters.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setQuarter(q); setQOpen(false); }}
                  className={cn(
                    'block w-full text-left px-3 py-1.5 text-sm font-semibold transition cursor-pointer',
                    q === quarter ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">vs</div>
          <div className="font-bold text-slate-900 text-base">{gameInfo.opponent}</div>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
          isOffline
            ? 'bg-slate-100 text-slate-600'
            : syncStatus === 'synced' && !hasQueued
              ? 'bg-emerald-50 text-emerald-700'
              : syncStatus === 'failed'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-700'
        )}>
          {isOffline ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          ) : syncStatus === 'synced' && !hasQueued ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" />
            </svg>
          ) : syncStatus === 'failed' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M5 12.5a10 10 0 0 1 14 0" />
              <path d="M8.5 16a5 5 0 0 1 7 0" />
              <path d="M12 20h.01" />
            </svg>
          )}
          {isOffline 
            ? (hasQueued ? `Offline • ${queuedPlayCount} queued` : 'Offline')
            : syncStatus === 'synced' && !hasQueued
              ? 'Synced'
              : syncStatus === 'failed'
                ? 'Failed'
                : hasQueued
                  ? `${queuedPlayCount} queued`
                  : 'Syncing'}
        </div>
      </div>
    </div>
  );
}
