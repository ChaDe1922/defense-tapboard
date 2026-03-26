import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/GameContext';
import { getPlayDisplayStatus } from '../lib/corrections';
import EntryHeader from '../components/EntryHeader';
import QuickActionRow from '../components/QuickActionRow';
import Selector from '../components/Selector';
import SectionHeader from '../components/SectionHeader';
import SaveBar from '../components/SaveBar';
import PlayRow from '../components/PlayRow';
import PlayCorrectionForm from '../components/PlayCorrectionForm';
import OutcomeSheet from '../components/OutcomeSheet';
import DriveSummaryModal from '../components/DriveSummaryModal';

export default function LiveEntry() {
  const navigate = useNavigate();
  const {
    activeSession,
    plays,
    managedPlayTypes,
    managedBlitzes,
    managedStunts,
    managedOutcomes,
    selectedPlayType,
    selectedBlitz,
    selectedStunt,
    setSelectedPlayType,
    setSelectedBlitz,
    setSelectedStunt,
    savePlay,
    endDrive,
    editPlayRecord,
    softDeletePlayRecord,
  } = useGame();

  const [recentOpen, setRecentOpen] = useState(false);
  const [editingPlay, setEditingPlay] = useState(null);
  const [deletingPlayId, setDeletingPlayId] = useState(null);
  const [outcomeSheetOpen, setOutcomeSheetOpen] = useState(false);
  const [driveSummary, setDriveSummary] = useState(null);
  
  // Filter out deleted plays from recent view
  const recentPlays = [...plays].filter(p => !p.deleted).reverse().slice(0, 8);

  // Handle outcome selection from the sheet — save directly with outcome override
  function handleOutcomeSelected(outcome) {
    setOutcomeSheetOpen(false);
    if (!outcome) return; // cancelled

    // Pass outcome directly to savePlay via override (avoids state timing issues)
    savePlay(true, outcome); // Save + advance (increment play number, clear outcome)
  }

  // Handle End Drive — get summary and show modal
  function handleEndDrive() {
    const summary = endDrive();
    if (summary) {
      setDriveSummary(summary);
    }
  }

  // Empty state — no active session
  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-slate-500">
            <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No active game</h2>
        <p className="text-base text-slate-500 dark:text-slate-400 mb-6 max-w-xs">Start or resume a game session to begin logging plays.</p>
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative overflow-x-hidden">
      {/* A. Sticky Header */}
      <EntryHeader />

      {/* B. Quick Actions */}
      <div className="pt-3 pb-2">
        <QuickActionRow onEditLast={setEditingPlay} onEndDrive={handleEndDrive} />
      </div>

      {/* Scrollable content area — Step 1: Call Selection */}
      <div className="flex-1 overflow-auto overflow-x-hidden px-2.5 md:px-4 pb-4">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Play Type */}
          <section className="pb-4 border-b border-slate-200 dark:border-slate-700">
            <SectionHeader title="Play type" />
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
          <section className="pb-4 border-b border-slate-200 dark:border-slate-700">
            <SectionHeader title="Blitz" />
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
          <section className="pb-4 border-b border-slate-200 dark:border-slate-700">
            <SectionHeader title="Line stunt" />
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

          {/* Recent Plays — collapsible */}
          <section>
            <button
              type="button"
              onClick={() => setRecentOpen(!recentOpen)}
              className="w-full flex items-center justify-between py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent plays</h3>
                <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                {recentPlays.map((play) => {
                  const displayStatus = getPlayDisplayStatus(play);
                  const isDeleting = deletingPlayId === play.id;
                  
                  return (
                    <div key={play.id || `${play.playNumber}-${play.timeLabel}`} className="relative">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <PlayRow play={play} />
                          {displayStatus === 'corrected' && (
                            <div className="mt-1 ml-2">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Corrected
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => setEditingPlay(play)}
                            className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                          >
                            Edit
                          </button>
                          {!isDeleting ? (
                            <button
                              onClick={() => setDeletingPlayId(play.id)}
                              className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                            >
                              Delete
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  softDeletePlayRecord(play.id);
                                  setDeletingPlayId(null);
                                }}
                                className="px-2 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeletingPlayId(null)}
                                className="px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Sticky Save Bar — Step 1: "Continue to Outcome" */}
      <SaveBar onContinueToOutcome={() => setOutcomeSheetOpen(true)} />

      {/* Step 2: Outcome Sheet */}
      {outcomeSheetOpen && (
        <OutcomeSheet onClose={handleOutcomeSelected} />
      )}

      {/* Drive Summary Modal */}
      {driveSummary && (
        <DriveSummaryModal summary={driveSummary} onClose={() => setDriveSummary(null)} />
      )}

      {/* Edit Play Modal */}
      {editingPlay && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  Edit Play #{editingPlay.playNumber}
                </h2>
                <button
                  onClick={() => setEditingPlay(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <PlayCorrectionForm
                play={editingPlay}
                managedPlayTypes={managedPlayTypes}
                managedBlitzes={managedBlitzes}
                managedStunts={managedStunts}
                managedOutcomes={managedOutcomes}
                onSave={(updates) => {
                  editPlayRecord(editingPlay.id, updates, updates.reason);
                  setEditingPlay(null);
                }}
                onCancel={() => setEditingPlay(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
