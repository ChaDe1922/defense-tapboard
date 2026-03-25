import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/GameContext';
import StatCard from '../components/StatCard';
import PlayRow from '../components/PlayRow';
import { getDashboardSummary } from '../lib/analytics';

function ShieldIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" />
    </svg>
  );
}
function TrophyIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M5 6H3a2 2 0 0 0 2 2" /><path d="M19 6h2a2 2 0 0 1-2 2" />
    </svg>
  );
}
function TrendingDownIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7h6l4 4 7-7" /><path d="M14 4h6v6" />
    </svg>
  );
}
function CheckCircleIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function MiniBar({ label, value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const badgeStyles = {
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-rose-600 text-white',
  secondary: 'bg-slate-100 text-slate-700',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeSession, gameInfo, plays, lookups, syncSummary, sheetConnection, connectionStatus } = useGame();

  // Phase 6: Dashboard filters
  const [quarterFilter, setQuarterFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState('All');

  // Phase 6: Real-time analytics from active session
  const analytics = useMemo(() => {
    if (!plays || plays.length === 0) {
      return {
        totalPlays: 0,
        sacks: 0,
        tfl: 0,
        turnovers: 0,
        positiveRate: 0,
        outcomeBreakdown: [],
        playTypeUsage: [],
        blitzUsage: [],
        stuntUsage: [],
        comboStats: [],
        recentPlays: [],
      };
    }
    return getDashboardSummary(plays, { quarter: quarterFilter, outcome: outcomeFilter }, lookups);
  }, [plays, quarterFilter, outcomeFilter, lookups]);

  const quarters = ['All', 'Q1', 'Q2', 'Q3', 'Q4', 'OT'];
  const outcomeFilters = ['All', 'Positive', 'Neutral', 'Negative'];

  // Empty state — no active session
  if (!activeSession || !gameInfo) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 min-h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-slate-500">
            <path d="M4 20V10" /><path d="M12 20V4" /><path d="M20 20v-6" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No active game</h2>
        <p className="text-base text-slate-500 dark:text-slate-400 mb-6 max-w-xs">Start or resume a game session to view dashboard stats.</p>
        <button
          onClick={() => navigate('/setup')}
          className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-base font-semibold px-6 py-3 transition active:scale-[0.98] cursor-pointer"
        >
          Go to Setup
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-full p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Live dashboard</div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">{gameInfo.label}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>vs {gameInfo.opponent} · Updated from live entry data</span>
              {sheetConnection?.connectionLabel && connectionStatus === 'registered' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {sheetConnection.connectionLabel}
                </span>
              )}
              {(syncSummary.totalQueued > 0 || syncSummary.totalFailed > 0) && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  syncSummary.totalFailed > 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {syncSummary.totalFailed > 0
                    ? `${syncSummary.totalFailed} failed`
                    : `${syncSummary.totalQueued} queued`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Back to entry
          </button>
        </div>
      </div>

      {/* Phase 6: Filter Row */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-4">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Quarter</div>
            <div className="flex flex-wrap gap-2">
              {quarters.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuarterFilter(q)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition cursor-pointer ${
                    quarterFilter === q
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Outcome</div>
            <div className="flex flex-wrap gap-2">
              {outcomeFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setOutcomeFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition cursor-pointer ${
                    outcomeFilter === f
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phase 6: Real KPI Cards */}
      {analytics.totalPlays === 0 && (quarterFilter !== 'All' || outcomeFilter !== 'All') ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8 text-center">
          <p className="text-slate-500">No plays match the current filters.</p>
          <button
            onClick={() => { setQuarterFilter('All'); setOutcomeFilter('All'); }}
            className="mt-3 text-sm font-semibold text-violet-600 hover:text-violet-700 cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Total Plays" value={analytics.totalPlays} icon={ShieldIcon} />
            <StatCard label="Sacks" value={analytics.sacks} icon={TrendingDownIcon} />
            <StatCard label="TFL" value={analytics.tfl} icon={TrendingDownIcon} />
            <StatCard label="Turnovers" value={analytics.turnovers} icon={TrophyIcon} />
            <StatCard 
              label="Positive Rate" 
              value={analytics.totalPlays > 0 ? `${Math.round(analytics.positiveRate)}%` : '0%'} 
              icon={CheckCircleIcon} 
            />
          </div>

          {/* Phase 6: Outcome Breakdown */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
            <div className="p-4 pb-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Outcome breakdown</h3>
            </div>
            <div className="p-4 pt-0 space-y-3">
              {analytics.outcomeBreakdown.map((item) => (
                <MiniBar key={item.outcome} label={item.outcome} value={item.count} total={analytics.totalPlays} />
              ))}
              {analytics.outcomeBreakdown.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No plays logged yet</p>
              )}
            </div>
          </div>

          {/* Phase 6: Call Combo Effectiveness */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
            <div className="p-4 pb-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Call combo effectiveness</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Most used combinations</p>
            </div>
            <div className="p-4 pt-0 space-y-2.5">
              {analytics.comboStats.slice(0, 8).map((row) => (
                <div key={row.combo} className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{row.combo}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${badgeStyles.secondary}`}>
                      {row.calls} calls
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                      row.positiveRate >= 50 ? badgeStyles.success : badgeStyles.secondary
                    }`}>
                      {Math.round(row.positiveRate)}% positive
                    </span>
                    {row.turnovers > 0 && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${badgeStyles.success}`}>
                        {row.turnovers} TO
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {analytics.comboStats.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No plays logged yet</p>
              )}
            </div>
          </div>

          {/* Phase 6: Usage Counts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Play Type Usage */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
              <div className="p-4 pb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Play type usage</h3>
              </div>
              <div className="p-4 pt-0 space-y-2">
                {analytics.playTypeUsage.slice(0, 6).map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
                  </div>
                ))}
                {analytics.playTypeUsage.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No data</p>
                )}
              </div>
            </div>

            {/* Blitz Usage */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
              <div className="p-4 pb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Blitz usage</h3>
              </div>
              <div className="p-4 pt-0 space-y-2">
                {analytics.blitzUsage.slice(0, 6).map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
                  </div>
                ))}
                {analytics.blitzUsage.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No data</p>
                )}
              </div>
            </div>

            {/* Stunt Usage */}
            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
              <div className="p-4 pb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Line stunt usage</h3>
              </div>
              <div className="p-4 pt-0 space-y-2">
                {analytics.stuntUsage.slice(0, 6).map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
                  </div>
                ))}
                {analytics.stuntUsage.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No data</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Phase 6: Recent Plays */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
        <div className="p-4 pb-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent plays</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest {Math.min(10, plays.length)} plays</p>
        </div>
        <div className="p-4 pt-0 space-y-2">
          {analytics.recentPlays.map((p) => (
            <PlayRow key={p.id || `${p.playNumber}-${p.timeLabel}`} play={p} />
          ))}
          {analytics.recentPlays.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No plays logged yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
