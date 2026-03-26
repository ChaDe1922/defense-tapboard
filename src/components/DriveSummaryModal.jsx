/**
 * Phase 9: Drive Summary Modal
 * 
 * Displays a summary of a completed drive including play count,
 * outcome breakdown by classification, key stats, and top calls.
 */

const CLASSIFICATION_STYLES = {
  positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
  neutral: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
  negative: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400',
};

export default function DriveSummaryModal({ summary, onClose }) {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Drive {summary.driveNumber} Summary
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
          {/* Key Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Plays" value={summary.totalPlays} />
            <StatBox label="Play Range" value={`#${summary.startPlayNumber}–${summary.endPlayNumber || summary.startPlayNumber}`} small />
            <StatBox label="Positive %" value={`${summary.positiveRate}%`} accent={summary.positiveRate >= 50 ? 'emerald' : summary.positiveRate >= 30 ? 'amber' : 'rose'} />
          </div>

          {/* Classification Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Outcome Breakdown</h4>
            <div className="grid grid-cols-3 gap-2">
              <ClassificationCard label="Positive" count={summary.positive} total={summary.totalPlays} cls="positive" />
              <ClassificationCard label="Neutral" count={summary.neutral} total={summary.totalPlays} cls="neutral" />
              <ClassificationCard label="Negative" count={summary.negative} total={summary.totalPlays} cls="negative" />
            </div>
          </div>

          {/* Key Defensive Stats */}
          {(summary.turnovers > 0 || summary.sacks > 0 || summary.tfl > 0 || summary.touchdowns > 0) && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Defensive Highlights</h4>
              <div className="flex flex-wrap gap-2">
                {summary.turnovers > 0 && <HighlightChip label="Turnovers" count={summary.turnovers} color="violet" />}
                {summary.sacks > 0 && <HighlightChip label="Sacks" count={summary.sacks} color="blue" />}
                {summary.tfl > 0 && <HighlightChip label="TFL" count={summary.tfl} color="emerald" />}
                {summary.touchdowns > 0 && <HighlightChip label="TD Allowed" count={summary.touchdowns} color="rose" />}
              </div>
            </div>
          )}

          {/* Outcome Details */}
          {Object.keys(summary.outcomeCounts).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Outcomes</h4>
              <div className="space-y-1.5">
                {Object.entries(summary.outcomeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([outcome, count]) => (
                    <div key={outcome} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{outcome}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top Calls */}
          {summary.topCalls.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Most-Used Calls</h4>
              <div className="space-y-1.5">
                {summary.topCalls.map(({ call, count }) => (
                  <div key={call} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{call}</span>
                    <span className="text-slate-500 dark:text-slate-400">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-3 transition active:scale-[0.98] cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function StatBox({ label, value, small = false, accent }) {
  const accentColors = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-center">
      <div className={`${small ? 'text-base' : 'text-2xl'} font-bold ${accent ? accentColors[accent] : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}

function ClassificationCard({ label, count, total, cls }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`rounded-xl p-3 text-center ${CLASSIFICATION_STYLES[cls]}`}>
      <div className="text-xl font-bold">{count}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide mt-0.5">{label}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{pct}%</div>
    </div>
  );
}

function HighlightChip({ label, count, color }) {
  const colors = {
    violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-400',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${colors[color]}`}>
      {label}: {count}
    </span>
  );
}
