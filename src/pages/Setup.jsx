import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../lib/GameContext';
import {
  validateSheetUrl,
  testSheetConnection,
  registerSheet,
  initializeSheet,
} from '../lib/connection';
import { isEndpointConfigured, healthCheck } from '../lib/sheet-api';
import PresetManager from '../components/PresetManager';
import LookupManager from '../components/LookupManager';

// ── Helpers ────────────────────────────────────────────────────────

const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'];

function statusBadge(status) {
  const map = {
    open: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-200 text-slate-700',
    archived: 'bg-amber-100 text-amber-800',
  };
  return map[status] || map.closed;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function formatRelative(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch { return ''; }
}

// ── Form input component ──────────────────────────────────────────

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500';
const selectClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition appearance-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100';

// ── Session card component ────────────────────────────────────────

function syncBadge(syncStatus) {
  if (syncStatus === 'synced') return 'bg-emerald-100 text-emerald-700';
  if (syncStatus === 'failed') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

function syncLabel(syncStatus) {
  if (syncStatus === 'synced') return 'Synced';
  if (syncStatus === 'failed') return 'Failed';
  return 'Queued';
}

function SessionCard({ session, playsCount, unsyncedCount, onResume, onClose, onReopen, onArchive, onUnarchive, onRetrySync }) {
  const hasPending = unsyncedCount > 0 || session.syncStatus === 'queued' || session.syncStatus === 'failed';
  return (
    <div className="rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{session.label}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            vs {session.opponent} · {session.date}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
            <span>{playsCount} plays</span>
            <span>·</span>
            <span>Play #{session.currentPlayNumber}</span>
            {session.updatedAt && (
              <>
                <span>·</span>
                <span>Updated {formatRelative(session.updatedAt)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(session.status)}`}>
            {session.status}
          </span>
          {session.syncStatus && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${syncBadge(session.syncStatus)}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                session.syncStatus === 'synced' ? 'bg-emerald-500' :
                session.syncStatus === 'failed' ? 'bg-rose-500' : 'bg-amber-400'
              }`} />
              {syncLabel(session.syncStatus)}
              {unsyncedCount > 0 && ` (${unsyncedCount})`}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {onResume && (
          <button
            onClick={onResume}
            className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 transition active:scale-[0.98] cursor-pointer"
          >
            Resume
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold px-4 py-2 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Close
          </button>
        )}
        {onReopen && (
          <button
            onClick={onReopen}
            className="rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold px-4 py-2 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Reopen
          </button>
        )}
        {onArchive && (
          <button
            onClick={onArchive}
            className="rounded-xl border border-slate-300 bg-white text-slate-600 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Archive
          </button>
        )}
        {onUnarchive && (
          <button
            onClick={onUnarchive}
            className="rounded-xl border border-slate-300 bg-white text-slate-600 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Unarchive
          </button>
        )}
        {hasPending && onRetrySync && (
          <button
            onClick={onRetrySync}
            className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm font-medium px-4 py-2 hover:bg-amber-100 transition active:scale-[0.98] cursor-pointer"
          >
            Retry Sync
          </button>
        )}
      </div>
    </div>
  );
}

// ── Setup page ────────────────────────────────────────────────────

export default function Setup() {
  const navigate = useNavigate();
  const {
    appState,
    activeSession,
    showToast,
    createGameSession,
    resumeGameSession,
    closeSession,
    archiveSession,
    reopenSession,
    sheetConnection,
    saveSheetConnection,
    connectionStatus,
    endpointStatus,
    setEndpointStatus,
    syncSummary,
    queueSummary,
    networkStatus,
    processQueueAsync,
    retrySyncSession,
    retryAllSync,
  } = useGame();

  // Form state
  const [opponent, setOpponent] = useState('');
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [venue, setVenue] = useState('');
  const [enteredBy, setEnteredBy] = useState('');
  const [startQuarter, setStartQuarter] = useState('Q1');
  const [startPlayNumber, setStartPlayNumber] = useState(1);
  const [formErrors, setFormErrors] = useState({});

  // Collapsed sections
  const [showArchived, setShowArchived] = useState(false);

  // ── Connection form state (seeded from saved config) ──────────────
  const [connUrl, setConnUrl] = useState(sheetConnection.spreadsheetUrl || '');
  const [connLabel, setConnLabel] = useState(sheetConnection.connectionLabel || '');
  const [connGamesTab, setConnGamesTab] = useState(sheetConnection.gamesTab || 'Games');
  const [connPlaysTab, setConnPlaysTab] = useState(sheetConnection.playsTab || 'Plays');
  const [connPresetsTab, setConnPresetsTab] = useState(sheetConnection.presetsTab || 'Presets');
  const [connLookupsTab, setConnLookupsTab] = useState(sheetConnection.lookupsTab || 'Lookups');
  const [connAuditTab, setConnAuditTab] = useState(sheetConnection.auditTab || 'Audit_Log');
  const [connRegKey, setConnRegKey] = useState(sheetConnection.registrationKey || '');
  const [connBusy, setConnBusy] = useState(false);
  const [connMessage, setConnMessage] = useState('');

  const parsedId = validateSheetUrl(connUrl);

  // Build a working config from current form values
  const buildFormConfig = useCallback(() => ({
    ...sheetConnection,
    spreadsheetUrl: connUrl,
    spreadsheetId: parsedId.spreadsheetId || '',
    connectionLabel: connLabel,
    gamesTab: connGamesTab,
    playsTab: connPlaysTab,
    presetsTab: connPresetsTab,
    lookupsTab: connLookupsTab,
    auditTab: connAuditTab,
    registrationKey: connRegKey,
  }), [sheetConnection, connUrl, connLabel, connGamesTab, connPlaysTab, connPresetsTab, connLookupsTab, connAuditTab, connRegKey, parsedId]);

  async function handleSaveConnection() {
    if (!parsedId.valid) {
      setConnMessage(parsedId.error || 'Invalid URL');
      return;
    }
    const cfg = buildFormConfig();
    saveSheetConnection(cfg);
    setConnMessage('Connection saved locally');
    showToast('Connection saved', 1200);
  }

  async function handleTestConnection() {
    if (!isEndpointConfigured()) { setConnMessage('Apps Script endpoint not configured (VITE_APPS_SCRIPT_URL)'); return; }
    if (!parsedId.valid) { setConnMessage(parsedId.error || 'Invalid URL'); return; }
    setConnBusy(true);
    setConnMessage('Testing…');

    // Also check endpoint health
    const h = await healthCheck();
    setEndpointStatus(h.ok ? 'connected' : 'error');

    const cfg = buildFormConfig();
    const r = await testSheetConnection(cfg);
    setConnBusy(false);
    setConnMessage(r.message || (r.ok ? 'Connection passed' : 'Connection failed'));

    const now = new Date().toISOString();
    saveSheetConnection({
      ...cfg,
      lastConnectionCheckAt: now,
      lastConnectionCheckStatus: r.ok ? 'passed' : 'failed',
      lastConnectionCheckMessage: r.message || '',
    });
  }

  async function handleRegisterSheet() {
    if (!isEndpointConfigured()) { setConnMessage('Apps Script endpoint not configured'); return; }
    if (!parsedId.valid) { setConnMessage(parsedId.error || 'Invalid URL'); return; }
    if (!connRegKey.trim()) { setConnMessage('Registration key is required'); return; }
    setConnBusy(true);
    setConnMessage('Registering…');

    const cfg = buildFormConfig();
    const r = await registerSheet(cfg);
    setConnBusy(false);
    setConnMessage(r.message || (r.ok ? 'Registered!' : 'Registration failed'));

    if (r.ok) {
      saveSheetConnection({
        ...cfg,
        isRegistered: true,
        registeredAt: r.remoteWrittenAt || new Date().toISOString(),
      });
      showToast('Sheet registered successfully', 1500);
    }
  }

  async function handleInitializeSheet() {
    if (!isEndpointConfigured()) { setConnMessage('Apps Script endpoint not configured'); return; }
    if (!parsedId.valid) { setConnMessage(parsedId.error || 'Invalid URL'); return; }
    const cfg = buildFormConfig();
    if (!cfg.isRegistered && !sheetConnection.isRegistered) {
      setConnMessage('Register the sheet first before initializing');
      return;
    }
    setConnBusy(true);
    setConnMessage('Initializing tabs…');

    const r = await initializeSheet(cfg);
    setConnBusy(false);
    setConnMessage(r.message || (r.ok ? 'Initialized!' : 'Initialization failed'));
    if (r.ok) showToast('Sheet tabs initialized', 1500);
  }

  // Session lists by status
  const openSessions = appState.sessions.filter((s) => s.status === 'open');
  const closedSessions = appState.sessions.filter((s) => s.status === 'closed');
  const archivedSessions = appState.sessions.filter((s) => s.status === 'archived');

  // Auto-generate label from opponent + date
  function autoLabel() {
    if (opponent && date) {
      const d = new Date(date + 'T12:00:00');
      const mo = String(d.getMonth() + 1);
      const dy = String(d.getDate());
      return `${opponent} ${mo}/${dy}`;
    }
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!opponent.trim()) errors.opponent = true;
    if (!date) errors.date = true;
    if (!enteredBy.trim()) errors.enteredBy = true;
    if (!startPlayNumber || startPlayNumber < 1) errors.startPlayNumber = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const finalLabel = label.trim() || autoLabel() || `Game ${appState.sessions.length + 1}`;

    createGameSession({
      opponent: opponent.trim(),
      label: finalLabel,
      date,
      venue: venue.trim(),
      enteredBy: enteredBy.trim(),
      quarter: startQuarter,
      startingPlayNumber: Number(startPlayNumber),
    });

    showToast(`Game "${finalLabel}" created`, 1800);

    // Reset form
    setOpponent('');
    setLabel('');
    setDate(new Date().toISOString().slice(0, 10));
    setVenue('');
    setEnteredBy('');
    setStartQuarter('Q1');
    setStartPlayNumber(1);
    setFormErrors({});

    navigate('/');
  }

  function handleResume(sessionId) {
    resumeGameSession(sessionId);
    const s = appState.sessions.find((ss) => ss.id === sessionId);
    showToast(`Resumed "${s?.label || 'game'}"`, 1200);
    navigate('/');
  }

  function handleClose(sessionId) {
    closeSession(sessionId);
    const s = appState.sessions.find((ss) => ss.id === sessionId);
    showToast(`"${s?.label || 'game'}" closed`, 1200);
  }

  function handleReopen(sessionId) {
    reopenSession(sessionId);
    const s = appState.sessions.find((ss) => ss.id === sessionId);
    showToast(`"${s?.label || 'game'}" reopened`, 1200);
  }

  function handleArchive(sessionId) {
    archiveSession(sessionId);
    const s = appState.sessions.find((ss) => ss.id === sessionId);
    showToast(`"${s?.label || 'game'}" archived`, 1200);
  }

  function handleUnarchive(sessionId) {
    reopenSession(sessionId);
    const s = appState.sessions.find((ss) => ss.id === sessionId);
    showToast(`"${s?.label || 'game'}" unarchived`, 1200);
  }

  function getPlaysCount(sessionId) {
    return (appState.playsBySessionId[sessionId] || []).length;
  }

  function getUnsyncedCount(sessionId) {
    const plays = appState.playsBySessionId[sessionId] || [];
    return plays.filter((p) => p.syncStatus === 'queued' || p.syncStatus === 'failed').length;
  }

  const endpointLabel = endpointStatus === 'connected' ? 'Connected'
    : endpointStatus === 'error' ? 'Error'
    : endpointStatus === 'not_configured' ? 'Not configured'
    : 'Checking…';

  const endpointColor = endpointStatus === 'connected' ? 'bg-emerald-500'
    : endpointStatus === 'error' ? 'bg-rose-500'
    : endpointStatus === 'not_configured' ? 'bg-slate-400'
    : 'bg-amber-400';

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-full p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Active session banner */}
        {activeSession && (
          <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Active game</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-lg mt-0.5">{activeSession.label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">vs {activeSession.opponent} · Play #{activeSession.currentPlayNumber}</div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 transition active:scale-[0.98] cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* A. Start New Game */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
          <div className="p-4 pb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Start new game</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-4 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Opponent" required>
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => { setOpponent(e.target.value); setFormErrors((p) => ({ ...p, opponent: false })); }}
                  placeholder="e.g. DC Divas"
                  className={`${inputClass} ${formErrors.opponent ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
                />
              </FormField>
              <FormField label="Game label">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={autoLabel() || 'Auto-generated from opponent + date'}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Game date" required>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setFormErrors((p) => ({ ...p, date: false })); }}
                  className={`${inputClass} ${formErrors.date ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
                />
              </FormField>
              <FormField label="Venue">
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Entered by" required>
                <input
                  type="text"
                  value={enteredBy}
                  onChange={(e) => { setEnteredBy(e.target.value); setFormErrors((p) => ({ ...p, enteredBy: false })); }}
                  placeholder="e.g. Coach T"
                  className={`${inputClass} ${formErrors.enteredBy ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Starting quarter" required>
                  <select
                    value={startQuarter}
                    onChange={(e) => setStartQuarter(e.target.value)}
                    className={selectClass}
                  >
                    {quarters.map((q) => <option key={q} value={q}>{q}</option>)}
                  </select>
                </FormField>
                <FormField label="Starting play #" required>
                  <input
                    type="number"
                    min="1"
                    value={startPlayNumber}
                    onChange={(e) => { setStartPlayNumber(e.target.value); setFormErrors((p) => ({ ...p, startPlayNumber: false })); }}
                    className={`${inputClass} ${formErrors.startPlayNumber ? 'ring-2 ring-rose-400 border-rose-400' : ''}`}
                  />
                </FormField>
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 border border-violet-600 text-base font-semibold text-white transition active:scale-[0.99] cursor-pointer"
            >
              Create Game & Start Entry
            </button>
          </form>
        </div>

        {/* B. Open Games */}
        {openSessions.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Open games</h3>
            <div className="space-y-3">
              {openSessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  playsCount={getPlaysCount(s.id)}
                  unsyncedCount={getUnsyncedCount(s.id)}
                  onResume={() => handleResume(s.id)}
                  onClose={() => handleClose(s.id)}
                  onArchive={() => handleArchive(s.id)}
                  onRetrySync={() => retrySyncSession(s.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* C. Closed Games */}
        {closedSessions.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Closed games</h3>
            <div className="space-y-3">
              {closedSessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  playsCount={getPlaysCount(s.id)}
                  unsyncedCount={getUnsyncedCount(s.id)}
                  onResume={() => handleResume(s.id)}
                  onReopen={() => handleReopen(s.id)}
                  onArchive={() => handleArchive(s.id)}
                  onRetrySync={() => retrySyncSession(s.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* D. Archived Games — collapsible */}
        {archivedSessions.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100 mb-3 cursor-pointer"
            >
              Archived games
              <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {archivedSessions.length}
              </span>
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`h-4 w-4 text-slate-500 transition-transform ${showArchived ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {showArchived && (
              <div className="space-y-3">
                {archivedSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    playsCount={getPlaysCount(s.id)}
                    unsyncedCount={getUnsyncedCount(s.id)}
                    onResume={() => handleResume(s.id)}
                    onUnarchive={() => handleUnarchive(s.id)}
                    onRetrySync={() => retrySyncSession(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* E. Google Sheets Connection */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
          <div className="p-4 pb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Google Sheets connection</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure where game data is synced</p>
          </div>
          <div className="p-4 pt-2 space-y-4">
            {/* Sheet URL */}
            <FormField label="Google Sheet URL" required>
              <input
                type="url"
                value={connUrl}
                onChange={(e) => setConnUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className={inputClass}
              />
              {connUrl && (
                <div className="mt-1 text-xs">
                  {parsedId.valid ? (
                    <span className="text-emerald-600">Sheet ID: {parsedId.spreadsheetId}</span>
                  ) : (
                    <span className="text-rose-500">{parsedId.error}</span>
                  )}
                </div>
              )}
            </FormField>

            {/* Connection label */}
            <FormField label="Connection label">
              <input
                type="text"
                value={connLabel}
                onChange={(e) => setConnLabel(e.target.value)}
                placeholder="e.g. 2026 Defense Data"
                className={inputClass}
              />
            </FormField>

            {/* Tab names */}
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Tab names</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Games</label>
                  <input type="text" value={connGamesTab} onChange={(e) => setConnGamesTab(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Plays</label>
                  <input type="text" value={connPlaysTab} onChange={(e) => setConnPlaysTab(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Presets</label>
                  <input type="text" value={connPresetsTab} onChange={(e) => setConnPresetsTab(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Lookups</label>
                  <input type="text" value={connLookupsTab} onChange={(e) => setConnLookupsTab(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Audit Log</label>
                  <input type="text" value={connAuditTab} onChange={(e) => setConnAuditTab(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Registration key */}
            <FormField label="Registration key">
              <input
                type="password"
                value={connRegKey}
                onChange={(e) => setConnRegKey(e.target.value)}
                placeholder="Shared secret for registration"
                className={inputClass}
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-slate-400">Used only during Register Sheet. Not sent on normal writes.</p>
            </FormField>

            {/* Status indicators */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className={`inline-block w-2 h-2 rounded-full ${endpointColor}`} />
                  Apps Script endpoint
                </div>
                <span className="font-medium text-slate-800 dark:text-slate-200">{endpointLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Registration</span>
                <span className={`font-medium ${sheetConnection.isRegistered ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {sheetConnection.isRegistered ? 'Registered' : 'Not registered'}
                </span>
              </div>
              {sheetConnection.lastConnectionCheckAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Last tested</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatRelative(sheetConnection.lastConnectionCheckAt)} — {sheetConnection.lastConnectionCheckStatus === 'passed' ? 'Passed' : 'Failed'}
                  </span>
                </div>
              )}
              {sheetConnection.registeredAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Registered</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formatDate(sheetConnection.registeredAt)}</span>
                </div>
              )}
            </div>

            {/* Action message */}
            {connMessage && (
              <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2">{connMessage}</div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSaveConnection}
                disabled={connBusy}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                Save Connection
              </button>
              <button
                onClick={handleTestConnection}
                disabled={connBusy}
                className="rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold px-4 py-2 hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Test Connection
              </button>
              <button
                onClick={handleRegisterSheet}
                disabled={connBusy}
                className="rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold px-4 py-2 hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Register Sheet
              </button>
              <button
                onClick={handleInitializeSheet}
                disabled={connBusy}
                className="rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold px-4 py-2 hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Initialize Sheet
              </button>
            </div>
          </div>
        </div>

        {/* F. Sync Diagnostics */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
          <div className="p-4 pb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Sync diagnostics</h3>
          </div>
          <div className="p-4 pt-2 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Connection status</span>
              <span className={`font-medium capitalize ${connectionStatus === 'registered' ? 'text-emerald-700' : connectionStatus === 'connection_failed' ? 'text-rose-700' : 'text-slate-700'}`}>
                {connectionStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Synced records</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{syncSummary.totalSynced}</span>
            </div>
            {syncSummary.totalQueued > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700">Queued</span>
                <span className="font-medium text-amber-700">{syncSummary.totalQueued}</span>
              </div>
            )}
            {syncSummary.totalFailed > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-rose-700">Failed</span>
                <span className="font-medium text-rose-700">{syncSummary.totalFailed}</span>
              </div>
            )}
            {(syncSummary.totalQueued > 0 || syncSummary.totalFailed > 0) && (
              <button
                onClick={retryAllSync}
                className="w-full h-10 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition active:scale-[0.99] cursor-pointer"
              >
                Retry all pending ({syncSummary.totalQueued + syncSummary.totalFailed})
              </button>
            )}
          </div>
        </div>

        {/* G. Phase 5: Queue Reliability */}
        {queueSummary && (
          <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
            <div className="p-4 pb-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Queue reliability</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Offline-first sync queue status</p>
            </div>
            <div className="p-4 pt-2 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Network status</span>
                <span className={`font-medium capitalize ${networkStatus?.syncMode === 'online' ? 'text-emerald-700' : networkStatus?.syncMode === 'offline' ? 'text-slate-600' : 'text-amber-700'}`}>
                  {networkStatus?.syncMode || 'unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Queue jobs</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{queueSummary.totalJobs}</span>
              </div>
              {queueSummary.queuedPlayCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">Queued plays</span>
                  <span className="font-medium text-amber-700">{queueSummary.queuedPlayCount}</span>
                </div>
              )}
              {queueSummary.failedPlayCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-rose-700">Failed plays</span>
                  <span className="font-medium text-rose-700">{queueSummary.failedPlayCount}</span>
                </div>
              )}
              {queueSummary.lastSuccessfulSyncAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Last synced</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{formatRelative(queueSummary.lastSuccessfulSyncAt)}</span>
                </div>
              )}
              {!queueSummary.lastSuccessfulSyncAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Last synced</span>
                  <span className="font-medium text-slate-500">Never</span>
                </div>
              )}
              {(queueSummary.queuedCount > 0 || queueSummary.failedCount > 0) && (
                <button
                  onClick={processQueueAsync}
                  className="w-full h-10 rounded-xl border border-violet-300 bg-violet-50 text-violet-800 text-sm font-semibold hover:bg-violet-100 transition active:scale-[0.99] cursor-pointer"
                >
                  Process queue now ({queueSummary.queuedCount + queueSummary.failedCount} pending)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Phase 7: Preset Manager */}
        <PresetManager />

        {/* Phase 7: Lookup Manager */}
        <LookupManager />

      </div>
    </div>
  );
}
