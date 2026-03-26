/**
 * Phase 9: Outcome Sheet
 * 
 * A focused bottom-sheet / modal for selecting the outcome after confirming a defensive call.
 * Shows the call summary at top, outcome chips grouped by classification, and save/cancel actions.
 */

import { useState } from 'react';
import { useGame } from '../lib/GameContext';
import { getOutcomeClassification } from '../lib/config-manager';

const CLASSIFICATION_ORDER = ['positive', 'neutral', 'negative'];
const CLASSIFICATION_LABELS = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' };
const CLASSIFICATION_COLORS = {
  positive: {
    heading: 'text-emerald-700 dark:text-emerald-400',
    chip: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50',
    active: 'border-emerald-500 bg-emerald-600 text-white ring-2 ring-emerald-300 dark:ring-emerald-700',
  },
  neutral: {
    heading: 'text-amber-700 dark:text-amber-400',
    chip: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50',
    active: 'border-amber-500 bg-amber-600 text-white ring-2 ring-amber-300 dark:ring-amber-700',
  },
  negative: {
    heading: 'text-rose-700 dark:text-rose-400',
    chip: 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50',
    active: 'border-rose-500 bg-rose-600 text-white ring-2 ring-rose-300 dark:ring-rose-700',
  },
};

export default function OutcomeSheet({ onClose }) {
  const {
    selectedPlayType,
    selectedBlitz,
    selectedStunt,
    selectedPreset,
    presetCustomized,
    managedOutcomes,
    lookups,
    playNumber,
    savePlay,
  } = useGame();

  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [saving, setSaving] = useState(false);

  // Group outcomes by classification
  const grouped = {};
  CLASSIFICATION_ORDER.forEach((cls) => { grouped[cls] = []; });
  managedOutcomes.forEach((outcome) => {
    const cls = getOutcomeClassification(lookups, outcome);
    if (!grouped[cls]) grouped[cls] = [];
    grouped[cls].push(outcome);
  });

  const callParts = [selectedPlayType, selectedBlitz, selectedStunt].filter(Boolean);
  const callSummary = callParts.length > 0 ? callParts.join(' · ') : 'No call selected';

  function handleSavePlay() {
    if (!selectedOutcome || saving) return;
    setSaving(true);
    onClose(selectedOutcome);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onClose(null)} />
      
      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Select Outcome</h2>
            <button
              onClick={() => onClose(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          
          {/* Call summary */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Play #{playNumber} — Defensive Call
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">
              {callSummary}
            </div>
            {selectedPreset && (
              <div className="text-sm text-violet-600 dark:text-violet-400 mt-0.5">
                {selectedPreset.name}{presetCustomized ? ' (customized)' : ''}
              </div>
            )}
          </div>
        </div>
        
        {/* Outcome grid */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
          {CLASSIFICATION_ORDER.map((cls) => {
            const outcomes = grouped[cls];
            if (!outcomes || outcomes.length === 0) return null;
            const colors = CLASSIFICATION_COLORS[cls];
            return (
              <div key={cls}>
                <h4 className={`text-sm font-semibold ${colors.heading} mb-2`}>
                  {CLASSIFICATION_LABELS[cls]}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {outcomes.map((outcome) => (
                    <button
                      key={outcome}
                      onClick={() => setSelectedOutcome(outcome)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold text-center transition cursor-pointer active:scale-[0.97] ${
                        selectedOutcome === outcome
                          ? colors.active
                          : colors.chip
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={() => onClose(null)}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 transition active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePlay}
            disabled={!selectedOutcome || saving}
            className={`flex-[2] rounded-xl text-sm font-semibold px-4 py-3 transition active:scale-[0.98] cursor-pointer ${
              selectedOutcome
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : selectedOutcome ? `Save Play #${playNumber}` : 'Select an outcome'}
          </button>
        </div>
      </div>
    </div>
  );
}
