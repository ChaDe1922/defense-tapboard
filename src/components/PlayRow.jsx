import { getOutcomeBadgeVariant } from '../lib/utils';

const badgeStyles = {
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-rose-600 text-white',
};

export default function PlayRow({ play }) {
  const variant = getOutcomeBadgeVariant(play.outcome);

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-slate-900 text-base">Play {play.playNumber ?? play.play}</div>
          <div className="text-sm text-slate-600 mt-0.5">
            {play.playType} · {play.blitz} · {play.lineStunt ?? play.stunt}</div>
          {play.presetName && (
            <div className="text-xs text-violet-600 font-medium mt-0.5">
              {play.presetName}
              {play.presetCustomized ? ' (customized)' : ''}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold ${badgeStyles[variant]}`}>
            {play.outcome}
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{play.quarter} · {play.timeLabel ?? play.time}</span>
            {play.syncStatus && (
              <span
                title={play.syncStatus === 'synced' ? 'Synced' : play.syncStatus === 'failed' ? 'Sync failed' : 'Queued'}
                className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                  play.syncStatus === 'synced' ? 'bg-emerald-500' :
                  play.syncStatus === 'failed' ? 'bg-rose-500' :
                  'bg-amber-400'
                }`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
