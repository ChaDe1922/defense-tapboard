import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/GameContext';
import { getOutcomeAccent } from '../lib/utils';
import EntryHeader from '../components/EntryHeader';
import QuickActionRow from '../components/QuickActionRow';
import PresetCard from '../components/PresetCard';
import Selector from '../components/Selector';
import SectionHeader from '../components/SectionHeader';
import SaveBar from '../components/SaveBar';
import PlayRow from '../components/PlayRow';

export default function LiveEntry() {
  const navigate = useNavigate();
  const {
    activeSession,
    plays,
    activePresetList,
    managedPlayTypes,
    managedBlitzes,
    managedStunts,
    managedOutcomes,
    selectedPresetId,
    selectedPlayType,
    selectedBlitz,
    selectedStunt,
    selectedOutcome,
    selectedPreset,
    presetCustomized,
    applyPreset,
    setSelectedPlayType,
    setSelectedBlitz,
    setSelectedStunt,
    setSelectedOutcome,
  } = useGame();

  const [recentOpen, setRecentOpen] = useState(false);
  const recentPlays = [...plays].reverse().slice(0, 8);

  // Empty state — no active session
  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-slate-500">
            <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No active game</h2>
        <p className="text-base text-slate-500 mb-6 max-w-xs">Start or resume a game session to begin logging plays.</p>
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
    <div className="flex flex-col h-full bg-slate-50 relative overflow-x-hidden">
      {/* A. Sticky Header */}
      <EntryHeader />

      {/* B. Quick Actions */}
      <div className="pt-3 pb-2">
        <QuickActionRow />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto overflow-x-hidden px-4 md:px-6 pb-4">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* C. Preset Shortcut Strip */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-base font-bold text-slate-900">Preset shortcuts</h3>
              <span className="text-sm text-slate-500">Tap to prefill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {activePresetList.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  selected={selectedPresetId === preset.id}
                  onClick={() => applyPreset(preset.id)}
                />
              ))}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Preset: <span className="font-semibold text-slate-900">{selectedPreset ? selectedPreset.name : 'None'}</span>
              {presetCustomized && <span className="ml-2 text-violet-600 font-semibold">· Customized</span>}
            </div>
          </section>

          {/* D. Manual Selection Sections */}

          {/* Play Type */}
          <section>
            <SectionHeader title="Play type" badge="Required" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {managedPlayTypes.map((item) => (
                <Selector
                  key={item}
                  label={item}
                  active={selectedPlayType === item}
                  onClick={() => setSelectedPlayType(item)}
                />
              ))}
            </div>
          </section>

          {/* Blitz */}
          <section>
            <SectionHeader title="Blitz" badge="Required" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {managedBlitzes.map((item) => (
                <Selector
                  key={item}
                  label={item}
                  active={selectedBlitz === item}
                  onClick={() => setSelectedBlitz(item)}
                />
              ))}
            </div>
          </section>

          {/* Line Stunt */}
          <section>
            <SectionHeader title="Line stunt" badge="Required" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {managedStunts.map((item) => (
                <Selector
                  key={item}
                  label={item}
                  active={selectedStunt === item}
                  onClick={() => setSelectedStunt(item)}
                />
              ))}
            </div>
          </section>

          {/* Outcome */}
          <section>
            <SectionHeader title="Outcome" badge="Final tap before save" badgeVariant="success" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {managedOutcomes.map((item) => (
                <Selector
                  key={item}
                  label={item}
                  accent={getOutcomeAccent(item)}
                  active={selectedOutcome === item}
                  onClick={() => setSelectedOutcome(item)}
                />
              ))}
            </div>
          </section>

          {/* E. Optional Context Placeholder */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 text-base">Optional context</div>
                <div className="text-sm text-slate-500">Clock, down, distance, field zone, notes</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-slate-400">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>

          {/* G. Recent Plays — collapsible */}
          <section>
            <button
              type="button"
              onClick={() => setRecentOpen(!recentOpen)}
              className="w-full flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Recent plays</h3>
                <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {plays.length}
                </span>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-5 w-5 text-slate-500 transition-transform ${recentOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {recentOpen && (
              <div className="space-y-2.5 mt-1">
                {recentPlays.length === 0 && (
                  <p className="text-base text-slate-400 text-center py-6">No plays recorded yet</p>
                )}
                {recentPlays.map((play) => (
                  <PlayRow key={play.id || `${play.playNumber}-${play.timeLabel}`} play={play} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* F. Sticky Save Bar */}
      <SaveBar />
    </div>
  );
}
