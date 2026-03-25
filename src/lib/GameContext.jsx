import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { loadPersistedState, savePersistedState } from './storage';
import { createFreshState, blankEntryState, generateId, createDefaultLookups } from './defaults';
import {
  createSession as smCreateSession,
  resumeSession as smResumeSession,
  updateSessionStatus as smUpdateStatus,
  getActiveSession,
  getSessionPlays,
  getSessionEntry,
  addPlayToSession,
  removeLastPlay,
  updateEntryState,
  updatePlayNumber,
  updateQuarter,
} from './session-manager';
import { validateSelection, buildTimeLabel } from './utils';
import { buildGamePayload, buildPlayPayload, buildPresetsPayload, buildLookupsPayload } from './sync';
import { isEndpointConfigured, healthCheck } from './sheet-api';
import {
  loadConnectionConfig,
  saveConnectionConfig as persistConnection,
  isConnectionReady,
  getConnectionStatus,
  createBlankConnection,
  buildTabsFromConfig,
} from './connection';
import { loadQueueState, saveQueueState } from './queue-storage';
import { createSyncJob, enqueueJob, getQueueSummary, getPendingCountForSession } from './queue-manager';
import { processQueue } from './queue-processor';
import { createNetworkStatus, updateNetworkStatus, setupNetworkListeners } from './network-status';
import {
  getActivePresets,
  getActiveLookupValues,
  addPreset as cmAddPreset,
  editPreset as cmEditPreset,
  deletePreset as cmDeletePreset,
  togglePresetFavorite as cmToggleFavorite,
  togglePresetActive as cmToggleActive,
  movePreset as cmMovePreset,
  addLookupItem as cmAddLookup,
  editLookupItem as cmEditLookup,
  deleteLookupItem as cmDeleteLookup,
  toggleLookupActive as cmToggleLookupActive,
  moveLookupItem as cmMoveLookup,
  updateLookupClassification as cmUpdateClassification,
  getOutcomeClassification,
  DEFAULT_OUTCOME_CLASSIFICATIONS,
  migratePresets,
} from './config-manager';
import {
  migratePlaysForCorrections,
  editPlay,
  softDeletePlay,
  restorePlay,
  getActivePlays,
} from './corrections';
import {
  getActiveDrive,
  getSessionDrives,
  addPlayToDrive,
  endActiveDrive,
  buildDriveSummary,
} from './drive-manager';

const GameContext = createContext(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

// ── Hydrate initial state from storage or fresh defaults ───────────

function hydrateInitialState() {
  const persisted = loadPersistedState();
  if (!persisted) return createFreshState();

  // Safety: only auto-restore open sessions.
  if (persisted.activeSessionId) {
    const active = (persisted.sessions || []).find(
      (s) => s.id === persisted.activeSessionId
    );
    if (!active || active.status !== 'open') {
      persisted.activeSessionId = null;
    }
  }

  // Phase 7: Migrate v1 state to v2 (add managed lookups)
  if (!persisted.lookups || persisted.lookups.length === 0) {
    persisted.lookups = createDefaultLookups();
    persisted.version = 2;
  }

  // Phase 7: Migrate preset IDs from numbers to UUIDs
  if (persisted.presets && persisted.presets.some((p) => typeof p.id === 'number')) {
    persisted.presets = migratePresets(persisted.presets);
  }

  // Phase 8: Migrate v2 state to v3 (add correction fields and audit log)
  if (persisted.version < 3) {
    // Add audit log if missing
    if (!persisted.auditLog) {
      persisted.auditLog = [];
    }

    // Migrate all plays to include correction fields
    if (persisted.playsBySessionId) {
      for (const sessionId in persisted.playsBySessionId) {
        persisted.playsBySessionId[sessionId] = migratePlaysForCorrections(
          persisted.playsBySessionId[sessionId]
        );
      }
    }

    persisted.version = 3;
  }

  // Phase 9: Migrate v3 to v4 (add outcome classification + drives)
  if (persisted.version < 4) {
    // Add classification to existing outcome lookups
    if (persisted.lookups) {
      persisted.lookups = persisted.lookups.map((l) => {
        if (l.lookupType === 'outcome' && !l.classification) {
          return { ...l, classification: DEFAULT_OUTCOME_CLASSIFICATIONS[l.value] || 'neutral' };
        }
        return l;
      });
    }
    // Initialize drives tracking
    if (!persisted.drivesBySessionId) {
      persisted.drivesBySessionId = {};
    }
    persisted.version = 4;
  }

  return persisted;
}

export function GameProvider({ children }) {
  const [appState, setAppState] = useState(hydrateInitialState);
  const [toast, setToast] = useState('');
  const [syncStatus, setSyncStatus] = useState('synced');
  const [hydrated, setHydrated] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState(() =>
    isEndpointConfigured() ? 'unknown' : 'not_configured'
  ); // 'not_configured' | 'unknown' | 'connected' | 'error'

  // ── Sheet connection state ────────────────────────────────────────
  const [sheetConnection, setSheetConnection] = useState(() => loadConnectionConfig() || createBlankConnection());

  const saveSheetConnection = useCallback((config) => {
    const saved = persistConnection(config);
    setSheetConnection(saved);
    return saved;
  }, []);

  // Ref that always holds the latest connection for use in async closures
  const connRef = useRef(sheetConnection);
  useEffect(() => { connRef.current = sheetConnection; }, [sheetConnection]);

  const connectionStatus = useMemo(() => getConnectionStatus(sheetConnection), [sheetConnection]);

  // ── Phase 5: Queue state ───────────────────────────────────────────
  const [queueState, setQueueState] = useState(() => loadQueueState());
  const [networkStatus, setNetworkStatus] = useState(() => createNetworkStatus());

  // Refs that always hold the latest values (avoids stale closures)
  const queueStateRef = useRef(queueState);
  useEffect(() => { queueStateRef.current = queueState; }, [queueState]);
  const networkStatusRef = useRef(networkStatus);
  useEffect(() => { networkStatusRef.current = networkStatus; }, [networkStatus]);

  // Auto-persist queue whenever it changes
  const isFirstQueueRender = useRef(true);
  useEffect(() => {
    if (isFirstQueueRender.current) {
      isFirstQueueRender.current = false;
      return;
    }
    saveQueueState(queueState);
  }, [queueState]);

  // Update network status when connection changes
  useEffect(() => {
    setNetworkStatus(updateNetworkStatus(sheetConnection));
  }, [sheetConnection]);

  // Mark hydration complete after first render
  useEffect(() => { setHydrated(true); }, []);

  // ── Auto-persist whenever appState changes (after hydration) ────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    savePersistedState(appState);
  }, [appState]);

  // ── Phase 5: Queue helpers ─────────────────────────────────────────

  const enqueueGameSync = useCallback((session) => {
    const conn = connRef.current;
    if (!conn.spreadsheetId) return;

    const job = createSyncJob({
      entityType: 'game',
      actionType: 'upsertGame',
      entityId: session.id,
      sessionId: session.id,
      spreadsheetId: conn.spreadsheetId,
      tabs: buildTabsFromConfig(conn),
      payload: buildGamePayload(session),
      priority: 10,
    });

    setQueueState((prev) => enqueueJob(prev, job));
  }, []);

  const enqueuePlaySync = useCallback((play, session) => {
    const conn = connRef.current;
    if (!conn.spreadsheetId) return;

    const job = createSyncJob({
      entityType: 'play',
      actionType: 'upsertPlay',
      entityId: play.id,
      sessionId: session.id,
      spreadsheetId: conn.spreadsheetId,
      tabs: buildTabsFromConfig(conn),
      payload: buildPlayPayload(play, session),
      priority: 20,
    });

    setQueueState((prev) => enqueueJob(prev, job));
  }, []);

  const enqueuePresetsSync = useCallback((presets) => {
    const conn = connRef.current;
    if (!conn.spreadsheetId) return;

    const job = createSyncJob({
      entityType: 'preset',
      actionType: 'upsertPresets',
      entityId: 'batch',
      spreadsheetId: conn.spreadsheetId,
      tabs: buildTabsFromConfig(conn),
      payload: buildPresetsPayload(presets),
      priority: 30,
    });

    setQueueState((prev) => enqueueJob(prev, job));
  }, []);

  const enqueueLookupsSync = useCallback((managedLookups) => {
    const conn = connRef.current;
    if (!conn.spreadsheetId) return;

    const job = createSyncJob({
      entityType: 'system',
      actionType: 'seedLookups',
      entityId: 'lookups',
      spreadsheetId: conn.spreadsheetId,
      tabs: buildTabsFromConfig(conn),
      payload: buildLookupsPayload(managedLookups),
      priority: 0,
    });

    setQueueState((prev) => enqueueJob(prev, job));
  }, []);

  // ── Phase 5: Background queue processor ────────────────────────────

  const processQueueAsync = useCallback(async () => {
    // Read from refs to always get the latest state (avoids stale closure)
    const currentQueue = queueStateRef.current;
    const currentNetwork = networkStatusRef.current;

    const result = await processQueue(currentQueue, currentNetwork, {
      maxJobsPerRun: 10,
      onJobComplete: (job) => {
        // Update local entity sync status
        if (job.entityType === 'game') {
          setAppState((prev) => ({
            ...prev,
            sessions: prev.sessions.map((s) =>
              s.id === job.entityId
                ? { ...s, syncStatus: 'synced', remoteWrittenAt: job.remoteWrittenAt, needsSync: false }
                : s
            ),
          }));
        } else if (job.entityType === 'play') {
          setAppState((prev) => ({
            ...prev,
            playsBySessionId: {
              ...prev.playsBySessionId,
              [job.sessionId]: (prev.playsBySessionId[job.sessionId] || []).map((p) =>
                p.id === job.entityId
                  ? { ...p, syncStatus: 'synced', remoteWrittenAt: job.remoteWrittenAt, needsSync: false }
                  : p
              ),
            },
          }));
        }
      },
      onJobFailed: (job) => {
        // Update local entity sync status
        if (job.entityType === 'game') {
          setAppState((prev) => ({
            ...prev,
            sessions: prev.sessions.map((s) =>
              s.id === job.entityId
                ? { ...s, syncStatus: 'failed', syncAttemptCount: (s.syncAttemptCount || 0) + 1 }
                : s
            ),
          }));
        } else if (job.entityType === 'play') {
          setAppState((prev) => ({
            ...prev,
            playsBySessionId: {
              ...prev.playsBySessionId,
              [job.sessionId]: (prev.playsBySessionId[job.sessionId] || []).map((p) =>
                p.id === job.entityId
                  ? { ...p, syncStatus: 'failed', syncAttemptCount: (p.syncAttemptCount || 0) + 1 }
                  : p
              ),
            },
          }));
        }
      },
    });

    setQueueState(result.state);
    queueStateRef.current = result.state;
    return result;
  }, []); // No dependencies - reads from refs

  // ── Phase 5: Auto-process queue on app load and network events ────

  const initialSyncDone = useRef(false);
  useEffect(() => {
    if (!hydrated || initialSyncDone.current) return;
    initialSyncDone.current = true;
    if (!isEndpointConfigured()) return;

    // Check endpoint health
    healthCheck().then((h) => {
      setEndpointStatus(h.ok ? 'connected' : 'error');
    });

    const conn = connRef.current;
    if (!isConnectionReady(conn)) return;

    // Seed lookups + presets once
    if (!appState.lookupsSynced) {
      enqueueLookupsSync(appState.lookups);
      setAppState((prev) => ({ ...prev, lookupsSynced: true }));
    }
    if (!appState.presetsSynced) {
      enqueuePresetsSync(appState.presets);
      setAppState((prev) => ({ ...prev, presetsSynced: true }));
    }

    // MIGRATION: Enqueue any existing queued/failed records from Phase 4
    // This ensures old records get into the new queue system
    const pendingSessions = appState.sessions.filter((s) => s.syncStatus === 'queued' || s.syncStatus === 'failed');
    for (const session of pendingSessions) {
      enqueueGameSync(session);
    }

    for (const session of appState.sessions) {
      const plays = appState.playsBySessionId[session.id] || [];
      const pendingPlays = plays.filter((p) => p.syncStatus === 'queued' || p.syncStatus === 'failed');
      for (const play of pendingPlays) {
        enqueuePlaySync(play, session);
      }
    }

    // Process queue after hydration and migration
    setTimeout(() => processQueueAsync(), 500);
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Setup network event listeners
  useEffect(() => {
    const cleanup = setupNetworkListeners(
      () => {
        setNetworkStatus(updateNetworkStatus(connRef.current));
        // Process queue when coming back online
        setTimeout(() => processQueueAsync(), 1000);
      },
      () => {
        setNetworkStatus(updateNetworkStatus(connRef.current));
      }
    );
    return cleanup;
  }, [processQueueAsync]);

  // Periodic queue processing (every 5s when online for near-instant sync)
  useEffect(() => {
    if (networkStatus.syncMode !== 'online') return;

    const interval = setInterval(() => {
      processQueueAsync();
    }, 5000); // 5 seconds for responsive sync

    return () => clearInterval(interval);
  }, [networkStatus.syncMode, processQueueAsync]);

  // ── Derived values from current state ───────────────────────────

  const activeSession = useMemo(() => getActiveSession(appState), [appState]);

  const plays = useMemo(
    () => (activeSession ? getSessionPlays(appState, activeSession.id) : []),
    [appState, activeSession]
  );

  const playNumber = activeSession ? activeSession.currentPlayNumber : 1;
  const quarter = activeSession ? activeSession.quarter : 'Q1';

  const currentEntry = useMemo(
    () => (activeSession ? getSessionEntry(appState, activeSession.id) : blankEntryState),
    [appState, activeSession]
  );

  const presets = appState.presets || [];
  const lookups = appState.lookups || [];

  // Phase 7: Derive active presets and lookup values from managed config
  const activePresetList = useMemo(() => getActivePresets(presets), [presets]);
  const managedPlayTypes = useMemo(() => getActiveLookupValues(lookups, 'play_type'), [lookups]);
  const managedBlitzes = useMemo(() => getActiveLookupValues(lookups, 'blitz'), [lookups]);
  const managedStunts = useMemo(() => getActiveLookupValues(lookups, 'line_stunt'), [lookups]);
  const managedOutcomes = useMemo(() => getActiveLookupValues(lookups, 'outcome'), [lookups]);

  const selectedPresetId = currentEntry.selectedPresetId;
  const selectedPlayType = currentEntry.selectedPlayType;
  const selectedBlitz = currentEntry.selectedBlitz;
  const selectedStunt = currentEntry.selectedLineStunt;
  const selectedOutcome = currentEntry.selectedOutcome;

  const selectedPreset = presets.find((p) => p.id === selectedPresetId) || null;

  const presetCustomized = Boolean(
    selectedPreset && (
      selectedPreset.playType !== selectedPlayType ||
      selectedPreset.blitz !== selectedBlitz ||
      selectedPreset.lineStunt !== selectedStunt
    )
  );

  const isValid = validateSelection(selectedPlayType, selectedBlitz, selectedStunt, selectedOutcome);

  // ── GameInfo derived from active session ────────────────────────

  const gameInfo = useMemo(() => {
    if (!activeSession) return null;
    return {
      opponent: activeSession.opponent,
      label: activeSession.label,
      date: activeSession.date,
      enteredBy: activeSession.enteredBy,
      venue: activeSession.venue || '',
    };
  }, [activeSession]);

  // ── Helper to update entry for active session ───────────────────

  const patchEntry = useCallback((partial) => {
    if (!activeSession) return;
    setAppState((prev) => updateEntryState(prev, activeSession.id, partial));
  }, [activeSession]);

  // ── Entry setters ───────────────────────────────────────────────

  const setSelectedPlayType = useCallback((v) => patchEntry({ selectedPlayType: v }), [patchEntry]);
  const setSelectedBlitz = useCallback((v) => patchEntry({ selectedBlitz: v }), [patchEntry]);
  const setSelectedStunt = useCallback((v) => patchEntry({ selectedLineStunt: v }), [patchEntry]);
  const setSelectedOutcome = useCallback((v) => patchEntry({ selectedOutcome: v }), [patchEntry]);

  // ── Toast ───────────────────────────────────────────────────────

  const showToast = useCallback((message, duration = 1500) => {
    setToast(message);
    setTimeout(() => setToast(''), duration);
  }, []);

  // ── Preset actions ──────────────────────────────────────────────

  const applyPreset = useCallback((presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset || !activeSession) return;
    patchEntry({
      selectedPresetId: presetId,
      selectedPlayType: preset.playType,
      selectedBlitz: preset.blitz,
      selectedLineStunt: preset.lineStunt,
    });
  }, [presets, activeSession, patchEntry]);

  const clearEntry = useCallback(() => {
    if (!activeSession) return;
    patchEntry({ ...blankEntryState });
  }, [activeSession, patchEntry]);

  // ── Phase 7: Preset Management ────────────────────────────────

  const syncPresetsAfterChange = useCallback(() => {
    setAppState((prev) => {
      enqueuePresetsSync(prev.presets || []);
      return prev;
    });
    if (networkStatusRef.current?.syncMode === 'online') {
      setTimeout(() => processQueueAsync(), 500);
    }
  }, [enqueuePresetsSync, processQueueAsync]);

  const syncLookupsAfterChange = useCallback(() => {
    setAppState((prev) => {
      enqueueLookupsSync(prev.lookups || []);
      return prev;
    });
    if (networkStatusRef.current?.syncMode === 'online') {
      setTimeout(() => processQueueAsync(), 500);
    }
  }, [enqueueLookupsSync, processQueueAsync]);

  const addNewPreset = useCallback((presetData) => {
    let result;
    setAppState((prev) => {
      result = cmAddPreset(prev.presets || [], presetData, prev.lookups || []);
      if (result.error) return prev;
      return { ...prev, presets: result.presets };
    });
    if (result?.error) { showToast(result.error, 2000); return false; }
    showToast('Preset added', 1200);
    syncPresetsAfterChange();
    return true;
  }, [showToast, syncPresetsAfterChange]);

  const editExistingPreset = useCallback((presetId, updates) => {
    let result;
    setAppState((prev) => {
      result = cmEditPreset(prev.presets || [], presetId, updates, prev.lookups || []);
      if (result.error) return prev;
      return { ...prev, presets: result.presets };
    });
    if (result?.error) { showToast(result.error, 2000); return false; }
    showToast('Preset updated', 1200);
    syncPresetsAfterChange();
    return true;
  }, [showToast, syncPresetsAfterChange]);

  const deleteExistingPreset = useCallback((presetId) => {
    let result;
    setAppState((prev) => {
      result = cmDeletePreset(prev.presets || [], presetId);
      if (result.error) return prev;
      return { ...prev, presets: result.presets };
    });
    if (result?.error) { showToast(result.error, 2000); return false; }
    showToast('Preset deleted', 1200);
    syncPresetsAfterChange();
    return true;
  }, [showToast, syncPresetsAfterChange]);

  const toggleFavoritePreset = useCallback((presetId) => {
    setAppState((prev) => ({ ...prev, presets: cmToggleFavorite(prev.presets || [], presetId) }));
    syncPresetsAfterChange();
  }, [syncPresetsAfterChange]);

  const toggleActivePreset = useCallback((presetId) => {
    setAppState((prev) => ({ ...prev, presets: cmToggleActive(prev.presets || [], presetId) }));
    syncPresetsAfterChange();
  }, [syncPresetsAfterChange]);

  const movePresetOrder = useCallback((presetId, direction) => {
    setAppState((prev) => ({ ...prev, presets: cmMovePreset(prev.presets || [], presetId, direction) }));
    syncPresetsAfterChange();
  }, [syncPresetsAfterChange]);

  // ── Phase 7: Lookup Management ────────────────────────────────

  const addLookupValue = useCallback((lookupType, value, classification = null) => {
    let result;
    setAppState((prev) => {
      result = cmAddLookup(prev.lookups || [], lookupType, value, classification);
      if (result.error) return prev;
      return { ...prev, lookups: result.lookups };
    });
    if (result?.error) { showToast(result.error, 2000); return false; }
    showToast('Value added', 1200);
    syncLookupsAfterChange();
    return true;
  }, [showToast, syncLookupsAfterChange]);

  const editLookupValue = useCallback((itemId, newValue) => {
    let result;
    setAppState((prev) => {
      result = cmEditLookup(prev.lookups || [], itemId, newValue);
      if (result.error) return prev;
      return { ...prev, lookups: result.lookups };
    });
    if (result?.error) { showToast(result.error, 2000); return false; }
    showToast('Value updated', 1200);
    syncLookupsAfterChange();
    return true;
  }, [showToast, syncLookupsAfterChange]);

  const deleteLookupValue = useCallback((itemId) => {
    let result;
    setAppState((prev) => {
      result = cmDeleteLookup(prev.lookups || [], itemId, prev.presets || []);
      if (result.error) return prev;
      return { ...prev, lookups: result.lookups };
    });
    if (result?.error) { showToast(result.error, 2000); return false; }
    showToast('Value removed', 1200);
    syncLookupsAfterChange();
    return true;
  }, [showToast, syncLookupsAfterChange]);

  const toggleLookupActiveValue = useCallback((itemId) => {
    let result;
    setAppState((prev) => {
      result = cmToggleLookupActive(prev.lookups || [], itemId);
      if (result.error) return prev;
      return { ...prev, lookups: result.lookups };
    });
    if (result?.error) { showToast(result.error, 2000); return false; }
    syncLookupsAfterChange();
    return true;
  }, [showToast, syncLookupsAfterChange]);

  const moveLookupOrder = useCallback((itemId, direction) => {
    setAppState((prev) => ({ ...prev, lookups: cmMoveLookup(prev.lookups || [], itemId, direction) }));
    syncLookupsAfterChange();
  }, [syncLookupsAfterChange]);

  const updateLookupClassificationValue = useCallback((itemId, classification) => {
    let result;
    setAppState((prev) => {
      result = cmUpdateClassification(prev.lookups || [], itemId, classification);
      if (result.error) return prev;
      return { ...prev, lookups: result.lookups };
    });
    if (result?.error) { showToast(result.error, 2000); return false; }
    syncLookupsAfterChange();
    return true;
  }, [showToast, syncLookupsAfterChange]);

  // ── Save Play ───────────────────────────────────────────────────

  const savePlay = useCallback((advance = false, outcomeOverride = null) => {
    if (!activeSession) return false;
    const finalOutcome = outcomeOverride || selectedOutcome;
    if (!validateSelection(selectedPlayType, selectedBlitz, selectedStunt, finalOutcome)) {
      showToast('Select play type, blitz, stunt, and outcome first.', 1800);
      return false;
    }

    const now = new Date().toISOString();
    const play = {
      id: generateId(),
      sessionId: activeSession.id,
      playNumber,
      playType: selectedPlayType,
      blitz: selectedBlitz,
      lineStunt: selectedStunt,
      outcome: finalOutcome,
      quarter,
      timeLabel: buildTimeLabel(playNumber),
      presetId: selectedPreset ? selectedPreset.id : null,
      presetName: selectedPreset ? selectedPreset.name : null,
      presetCustomized,
      entryMode: selectedPreset ? 'preset' : 'manual',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'queued',
      syncAttemptCount: 0,
      lastSyncAttemptAt: null,
      remoteWrittenAt: null,
      needsSync: true,
    };

    setAppState((prev) => {
      let next = addPlayToSession(prev, activeSession.id, play);
      // Track play in current drive (auto-starts drive if none active)
      next = addPlayToDrive(next, activeSession.id, play.id, playNumber);
      if (advance) {
        next = updatePlayNumber(next, activeSession.id, playNumber + 1);
        next = updateEntryState(next, activeSession.id, { selectedOutcome: null });
      }
      // Also mark session as needing sync (play count changed)
      next = {
        ...next,
        sessions: next.sessions.map((s) =>
          s.id === activeSession.id ? { ...s, syncStatus: 'queued', needsSync: true, updatedAt: now } : s
        ),
      };
      return next;
    });

    setSyncStatus('queued');
    showToast(`Play ${playNumber} saved`);

    // Enqueue sync jobs for play and game
    const sessionSnapshot = activeSession;
    enqueuePlaySync(play, sessionSnapshot);
    enqueueGameSync(sessionSnapshot);

    // Trigger immediate processing when online (500ms for state consistency)
    if (networkStatus.syncMode === 'online') {
      setTimeout(() => processQueueAsync(), 500);
    }

    return true;
  }, [activeSession, playNumber, quarter, selectedPlayType, selectedBlitz, selectedStunt, selectedOutcome, selectedPreset, presetCustomized, showToast, enqueuePlaySync, enqueueGameSync, processQueueAsync, networkStatus.syncMode]);

  // ── Repeat Last ─────────────────────────────────────────────────

  const repeatLast = useCallback(() => {
    if (!activeSession || plays.length === 0) {
      showToast('No plays to repeat');
      return;
    }
    const last = plays[plays.length - 1];
    patchEntry({
      selectedPresetId: null,
      selectedPlayType: last.playType,
      selectedBlitz: last.blitz,
      selectedLineStunt: last.lineStunt,
      selectedOutcome: null,
    });
    showToast('Last call loaded', 1200);
  }, [activeSession, plays, patchEntry, showToast]);

  // ── Undo Last ───────────────────────────────────────────────────

  const undoLast = useCallback(() => {
    if (!activeSession || plays.length === 0) {
      showToast('No plays to undo');
      return;
    }
    setAppState((prev) => {
      const { state: next, removedPlay } = removeLastPlay(prev, activeSession.id);
      if (!removedPlay) return prev;
      const newNum = Math.max(1, activeSession.currentPlayNumber - 1);
      return updatePlayNumber(next, activeSession.id, newNum);
    });
    const last = plays[plays.length - 1];
    showToast(`Removed play #${last.playNumber}`);
  }, [activeSession, plays, showToast]);

  // ── Quarter management ──────────────────────────────────────────

  const setQuarter = useCallback((q) => {
    if (!activeSession) return;
    setAppState((prev) => updateQuarter(prev, activeSession.id, q));
  }, [activeSession]);

  // ── Phase 9: Drive Management ──────────────────────────────────

  const currentDrive = useMemo(() => {
    if (!activeSession) return null;
    return getActiveDrive(appState, activeSession.id);
  }, [appState, activeSession]);

  const drives = useMemo(() => {
    if (!activeSession) return [];
    return getSessionDrives(appState, activeSession.id);
  }, [appState, activeSession]);

  const endDrive = useCallback(() => {
    if (!activeSession) return null;
    let endedDrive = null;
    setAppState((prev) => {
      const result = endActiveDrive(prev, activeSession.id);
      endedDrive = result.drive;
      if (!endedDrive) return prev;
      return result.state;
    });
    if (endedDrive) {
      const summary = buildDriveSummary(endedDrive, plays, appState.lookups || []);
      showToast(`Drive ${endedDrive.driveNumber} ended (${summary.totalPlays} plays)`, 2000);
      return summary;
    }
    showToast('No active drive to end');
    return null;
  }, [activeSession, plays, appState.lookups, showToast]);

  const getDriveSummaryById = useCallback((driveId) => {
    if (!activeSession) return null;
    const allDrives = getSessionDrives(appState, activeSession.id);
    const drive = allDrives.find((d) => d.id === driveId);
    if (!drive) return null;
    return buildDriveSummary(drive, plays, appState.lookups || []);
  }, [activeSession, appState, plays]);

  // ── Phase 8: Play Correction Actions ────────────────────────────

  const editPlayRecord = useCallback((playId, updates, reason = null) => {
    if (!activeSession) return false;

    let updatedPlay = null;
    let auditEntry = null;

    setAppState((prev) => {
      const plays = prev.playsBySessionId[activeSession.id] || [];
      const playIndex = plays.findIndex((p) => p.id === playId);
      if (playIndex === -1) return prev;

      const originalPlay = plays[playIndex];
      const result = editPlay(originalPlay, updates, reason);
      updatedPlay = result.play;
      auditEntry = result.auditEntry;

      const updatedPlays = [...plays];
      updatedPlays[playIndex] = updatedPlay;

      return {
        ...prev,
        playsBySessionId: {
          ...prev.playsBySessionId,
          [activeSession.id]: updatedPlays,
        },
        auditLog: [...(prev.auditLog || []), auditEntry],
      };
    });

    if (updatedPlay) {
      showToast('Play corrected', 1200);
      // Enqueue sync for the corrected play
      enqueuePlaySync(updatedPlay, activeSession);
      if (networkStatus.syncMode === 'online') {
        setTimeout(() => processQueueAsync(), 500);
      }
      return true;
    }

    return false;
  }, [activeSession, showToast, enqueuePlaySync, processQueueAsync, networkStatus.syncMode]);

  const softDeletePlayRecord = useCallback((playId, reason = null) => {
    if (!activeSession) return false;

    let deletedPlay = null;
    let auditEntry = null;

    setAppState((prev) => {
      const plays = prev.playsBySessionId[activeSession.id] || [];
      const playIndex = plays.findIndex((p) => p.id === playId);
      if (playIndex === -1) return prev;

      const originalPlay = plays[playIndex];
      const result = softDeletePlay(originalPlay, reason);
      deletedPlay = result.play;
      auditEntry = result.auditEntry;

      const updatedPlays = [...plays];
      updatedPlays[playIndex] = deletedPlay;

      return {
        ...prev,
        playsBySessionId: {
          ...prev.playsBySessionId,
          [activeSession.id]: updatedPlays,
        },
        auditLog: [...(prev.auditLog || []), auditEntry],
      };
    });

    if (deletedPlay) {
      showToast('Play deleted', 1200);
      // Enqueue sync for the deleted play
      enqueuePlaySync(deletedPlay, activeSession);
      if (networkStatus.syncMode === 'online') {
        setTimeout(() => processQueueAsync(), 500);
      }
      return true;
    }

    return false;
  }, [activeSession, showToast, enqueuePlaySync, processQueueAsync, networkStatus.syncMode]);

  const restorePlayRecord = useCallback((playId, reason = null) => {
    if (!activeSession) return false;

    let restoredPlay = null;
    let auditEntry = null;

    setAppState((prev) => {
      const plays = prev.playsBySessionId[activeSession.id] || [];
      const playIndex = plays.findIndex((p) => p.id === playId);
      if (playIndex === -1) return prev;

      const originalPlay = plays[playIndex];
      const result = restorePlay(originalPlay, reason);
      restoredPlay = result.play;
      auditEntry = result.auditEntry;

      const updatedPlays = [...plays];
      updatedPlays[playIndex] = restoredPlay;

      return {
        ...prev,
        playsBySessionId: {
          ...prev.playsBySessionId,
          [activeSession.id]: updatedPlays,
        },
        auditLog: [...(prev.auditLog || []), auditEntry],
      };
    });

    if (restoredPlay) {
      showToast('Play restored', 1200);
      // Enqueue sync for the restored play
      enqueuePlaySync(restoredPlay, activeSession);
      if (networkStatus.syncMode === 'online') {
        setTimeout(() => processQueueAsync(), 500);
      }
      return true;
    }

    return false;
  }, [activeSession, showToast, enqueuePlaySync, processQueueAsync, networkStatus.syncMode]);

  // ── Session management actions (exposed to Setup) ───────────────

  const createGameSession = useCallback((params) => {
    let newSession = null;
    setAppState((prev) => {
      const { state: next, sessionId } = smCreateSession(prev, params);
      newSession = next.sessions.find((s) => s.id === sessionId) || null;
      return next;
    });
    // Enqueue sync for the new game
    if (newSession) {
      enqueueGameSync(newSession);
      setTimeout(() => processQueueAsync(), 100);
    }
  }, [enqueueGameSync, processQueueAsync]);

  const resumeGameSession = useCallback((sessionId) => {
    setAppState((prev) => smResumeSession(prev, sessionId));
  }, []);

  const closeSession = useCallback((sessionId) => {
    let updatedSession = null;
    setAppState((prev) => {
      const next = smUpdateStatus(prev, sessionId, 'closed');
      updatedSession = next.sessions.find((s) => s.id === sessionId) || null;
      return next;
    });
    if (updatedSession) {
      enqueueGameSync(updatedSession);
      if (networkStatus.syncMode === 'online') {
        setTimeout(() => processQueueAsync(), 500);
      }
    }
  }, [enqueueGameSync, processQueueAsync, networkStatus.syncMode]);

  const archiveSession = useCallback((sessionId) => {
    let updatedSession = null;
    setAppState((prev) => {
      const next = smUpdateStatus(prev, sessionId, 'archived');
      updatedSession = next.sessions.find((s) => s.id === sessionId) || null;
      return next;
    });
    if (updatedSession) {
      enqueueGameSync(updatedSession);
      if (networkStatus.syncMode === 'online') {
        setTimeout(() => processQueueAsync(), 500);
      }
    }
  }, [enqueueGameSync, processQueueAsync, networkStatus.syncMode]);

  const reopenSession = useCallback((sessionId) => {
    let updatedSession = null;
    setAppState((prev) => {
      const next = smUpdateStatus(prev, sessionId, 'open');
      updatedSession = next.sessions.find((s) => s.id === sessionId) || null;
      return next;
    });
    if (updatedSession) {
      enqueueGameSync(updatedSession);
      if (networkStatus.syncMode === 'online') {
        setTimeout(() => processQueueAsync(), 500);
      }
    }
  }, [enqueueGameSync, processQueueAsync, networkStatus.syncMode]);

  // ── Manual retry for a session + its plays ────────────────────────

  const retrySyncSession = useCallback(async (sessionId) => {
    if (!isEndpointConfigured() || !isConnectionReady(connRef.current)) {
      showToast('Sync not available — check connection settings', 2000);
      return;
    }
    showToast('Retrying sync…', 1500);

    // Re-enqueue any pending records from app state into the queue
    setAppState((prev) => {
      const session = prev.sessions.find((s) => s.id === sessionId);
      if (session && (session.syncStatus === 'queued' || session.syncStatus === 'failed')) {
        enqueueGameSync(session);
      }
      const plays = prev.playsBySessionId[sessionId] || [];
      plays.forEach((play) => {
        if (play.syncStatus === 'queued' || play.syncStatus === 'failed') {
          enqueuePlaySync(play, session || { id: sessionId });
        }
      });
      return prev; // Don't change app state, just read it
    });

    // Wait for queue state to update via refs
    await new Promise((r) => setTimeout(r, 300));

    const result = await processQueueAsync();
    if (result.succeeded > 0) {
      showToast(`${result.succeeded} records synced`, 1500);
    } else if (result.failed > 0) {
      showToast(`Sync failed for ${result.failed} records`, 2000);
    } else {
      showToast('No pending records to sync', 1500);
    }
  }, [showToast, processQueueAsync, enqueueGameSync, enqueuePlaySync]);

  // ── Retry all pending records across all sessions ─────────────────

  const retryAllSync = useCallback(async () => {
    if (!isEndpointConfigured() || !isConnectionReady(connRef.current)) {
      showToast('Sync not available — check connection settings', 2000);
      return;
    }
    showToast('Syncing all pending…', 1500);

    // Re-enqueue any pending records from app state into the queue
    setAppState((prev) => {
      prev.sessions.forEach((session) => {
        if (session.syncStatus === 'queued' || session.syncStatus === 'failed') {
          enqueueGameSync(session);
        }
        const plays = prev.playsBySessionId[session.id] || [];
        plays.forEach((play) => {
          if (play.syncStatus === 'queued' || play.syncStatus === 'failed') {
            enqueuePlaySync(play, session);
          }
        });
      });
      return prev; // Don't change app state, just read it
    });

    // Wait for queue state to update via refs
    await new Promise((r) => setTimeout(r, 300));

    const result = await processQueueAsync();
    const total = result.succeeded + result.failed;
    if (total === 0) {
      showToast('All records already synced', 1500);
    } else {
      showToast(`${result.succeeded}/${total} records synced`, 2000);
    }
  }, [showToast, processQueueAsync, enqueueGameSync, enqueuePlaySync]);

  // ── Dashboard-derived summary ───────────────────────────────────

  const summary = useMemo(() => {
    // Phase 8: Exclude deleted plays from analytics
    const activePlays = getActivePlays(plays);
    const total = activePlays.length;
    const turnovers = activePlays.filter((p) => p.outcome === 'Turnover').length;
    const sacks = activePlays.filter((p) => p.outcome === 'Sack').length;
    const tfl = activePlays.filter((p) => p.outcome === 'Tackle for loss').length;
    // Phase 9: Use lookup-driven classification
    const positive = activePlays.filter((p) => {
      const cls = getOutcomeClassification(lookups, p.outcome);
      return cls === 'positive';
    }).length;

    const outcomeCounts = {};
    activePlays.forEach((p) => {
      outcomeCounts[p.outcome] = (outcomeCounts[p.outcome] || 0) + 1;
    });

    const comboMap = {};
    activePlays.forEach((p) => {
      const key = `${p.playType} • ${p.blitz} • ${p.lineStunt}`;
      if (!comboMap[key]) comboMap[key] = { combo: key, calls: 0, positive: 0, turnovers: 0 };
      comboMap[key].calls++;
      const cls = getOutcomeClassification(lookups, p.outcome);
      if (cls === 'positive') comboMap[key].positive++;
      if (p.outcome === 'Turnover') comboMap[key].turnovers++;
    });
    const combos = Object.values(comboMap).sort((a, b) => b.calls - a.calls).slice(0, 5);

    return {
      total,
      turnovers,
      sacks,
      tfl,
      positiveRate: total ? Math.round((positive / total) * 100) : 0,
      outcomes: outcomeCounts,
      combos,
    };
  }, [plays, lookups]);

  // ── Context value ───────────────────────────────────────────────

  // ── Derived sync summary ───────────────────────────────────────────

  const syncSummary = useMemo(() => {
    let totalQueued = 0;
    let totalFailed = 0;
    let totalSynced = 0;

    appState.sessions.forEach((s) => {
      if (s.syncStatus === 'queued') totalQueued++;
      else if (s.syncStatus === 'failed') totalFailed++;
      else if (s.syncStatus === 'synced') totalSynced++;
    });

    Object.values(appState.playsBySessionId).forEach((plays) => {
      plays.forEach((p) => {
        if (p.syncStatus === 'queued') totalQueued++;
        else if (p.syncStatus === 'failed') totalFailed++;
        else if (p.syncStatus === 'synced') totalSynced++;
      });
    });

    // Overall status: if any failed → 'failed', if any queued → 'queued', else 'synced'
    let overall = 'synced';
    if (totalFailed > 0) overall = 'failed';
    else if (totalQueued > 0) overall = 'queued';

    return { totalQueued, totalFailed, totalSynced, overall };
  }, [appState]);

  // Derive the header-level sync status from real sync data
  const effectiveSyncStatus = syncSummary.overall;

  // Phase 5: Queue summary for UI
  const queueSummary = useMemo(() => getQueueSummary(queueState, activeSession?.id), [queueState, activeSession]);
  const queuedPlayCount = useMemo(() => {
    if (!activeSession) return 0;
    return queueState.jobs.filter(
      (j) => j.entityType === 'play' && j.sessionId === activeSession.id && (j.status === 'queued' || j.status === 'failed')
    ).length;
  }, [queueState, activeSession]);

  const value = {
    // Hydration
    hydrated,
    // Raw state (for Setup session lists)
    appState,
    // Session
    activeSession,
    gameInfo,
    // Play state
    plays,
    playNumber,
    quarter,
    syncStatus: effectiveSyncStatus,
    // Presets
    presets,
    activePresetList,
    // Phase 7: Managed lookups
    lookups,
    managedPlayTypes,
    managedBlitzes,
    managedStunts,
    managedOutcomes,
    // Entry state
    selectedPresetId,
    selectedPlayType,
    selectedBlitz,
    selectedStunt,
    selectedOutcome,
    selectedPreset,
    presetCustomized,
    isValid,
    // Toast
    toast,
    showToast,
    // Entry actions
    setSelectedPlayType,
    setSelectedBlitz,
    setSelectedStunt,
    setSelectedOutcome,
    applyPreset,
    clearEntry,
    savePlay,
    repeatLast,
    undoLast,
    // Quarter
    setQuarter,
    // Phase 8: Play correction actions
    editPlayRecord,
    softDeletePlayRecord,
    restorePlayRecord,
    // Session management
    createGameSession,
    resumeGameSession,
    closeSession,
    archiveSession,
    reopenSession,
    // Phase 7: Preset management
    addNewPreset,
    editExistingPreset,
    deleteExistingPreset,
    toggleFavoritePreset,
    toggleActivePreset,
    movePresetOrder,
    // Phase 7: Lookup management
    addLookupValue,
    editLookupValue,
    deleteLookupValue,
    toggleLookupActiveValue,
    moveLookupOrder,
    // Phase 9: Outcome classification
    updateLookupClassificationValue,
    // Phase 9: Drive management
    currentDrive,
    drives,
    endDrive,
    getDriveSummaryById,
    // Connection
    sheetConnection,
    saveSheetConnection,
    connectionStatus,
    // Sync
    endpointStatus,
    setEndpointStatus,
    syncSummary,
    retrySyncSession,
    retryAllSync,
    // Phase 5: Queue and network status
    queueSummary,
    queuedPlayCount,
    networkStatus,
    processQueueAsync,
    // Dashboard
    summary,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
