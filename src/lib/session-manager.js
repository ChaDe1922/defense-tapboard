/**
 * Session management helpers.
 * All functions are pure — they accept and return state objects.
 * The caller (GameContext) is responsible for persisting the result.
 */

import { generateId, blankEntryState } from './defaults';

/**
 * Create a new game session and add it to the app state.
 * Returns the updated state with the new session as active.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {Object} params
 * @param {string} params.opponent
 * @param {string} params.label
 * @param {string} params.date
 * @param {string} params.enteredBy
 * @param {string} [params.venue]
 * @param {string} [params.quarter]
 * @param {number} [params.startingPlayNumber]
 * @returns {{ state: import('./types').PersistedAppState, sessionId: string }}
 */
export function createSession(state, params) {
  const now = new Date().toISOString();
  const id = generateId();

  /** @type {import('./types').GameSession} */
  const session = {
    id,
    label: params.label,
    opponent: params.opponent,
    date: params.date,
    venue: params.venue || '',
    enteredBy: params.enteredBy,
    status: 'open',
    quarter: params.quarter || 'Q1',
    currentPlayNumber: params.startingPlayNumber || 1,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    syncStatus: 'queued',
    syncAttemptCount: 0,
    lastSyncAttemptAt: null,
    remoteWrittenAt: null,
    needsSync: true,
  };

  return {
    state: {
      ...state,
      activeSessionId: id,
      sessions: [...state.sessions, session],
      playsBySessionId: { ...state.playsBySessionId, [id]: [] },
      currentEntryBySessionId: {
        ...state.currentEntryBySessionId,
        [id]: { ...blankEntryState },
      },
    },
    sessionId: id,
  };
}

/**
 * Set a session as the active session.
 * Updates lastOpenedAt timestamp.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @returns {import('./types').PersistedAppState}
 */
export function resumeSession(state, sessionId) {
  const now = new Date().toISOString();
  return {
    ...state,
    activeSessionId: sessionId,
    sessions: state.sessions.map((s) =>
      s.id === sessionId ? { ...s, lastOpenedAt: now, updatedAt: now } : s
    ),
    // Ensure entry state exists for this session
    currentEntryBySessionId: {
      ...state.currentEntryBySessionId,
      [sessionId]: state.currentEntryBySessionId[sessionId] || { ...blankEntryState },
    },
    // Ensure plays array exists
    playsBySessionId: {
      ...state.playsBySessionId,
      [sessionId]: state.playsBySessionId[sessionId] || [],
    },
  };
}

/**
 * Update a session's status.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @param {"open"|"closed"|"archived"} newStatus
 * @returns {import('./types').PersistedAppState}
 */
export function updateSessionStatus(state, sessionId, newStatus) {
  const now = new Date().toISOString();

  let activeSessionId = state.activeSessionId;
  // If closing or archiving the active session, clear it
  if (activeSessionId === sessionId && (newStatus === 'closed' || newStatus === 'archived')) {
    activeSessionId = null;
  }

  return {
    ...state,
    activeSessionId,
    sessions: state.sessions.map((s) =>
      s.id === sessionId ? { ...s, status: newStatus, updatedAt: now } : s
    ),
  };
}

/**
 * Get the active session object, or null.
 *
 * @param {import('./types').PersistedAppState} state
 * @returns {import('./types').GameSession|null}
 */
export function getActiveSession(state) {
  if (!state.activeSessionId) return null;
  return state.sessions.find((s) => s.id === state.activeSessionId) || null;
}

/**
 * Get plays for a specific session.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @returns {import('./types').PlayRecord[]}
 */
export function getSessionPlays(state, sessionId) {
  return state.playsBySessionId[sessionId] || [];
}

/**
 * Get the current entry state for a session.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @returns {import('./types').CurrentEntryState}
 */
export function getSessionEntry(state, sessionId) {
  return state.currentEntryBySessionId[sessionId] || { ...blankEntryState };
}

/**
 * Add a play to a session. Returns updated state.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @param {import('./types').PlayRecord} play
 * @returns {import('./types').PersistedAppState}
 */
export function addPlayToSession(state, sessionId, play) {
  const now = new Date().toISOString();
  const existing = state.playsBySessionId[sessionId] || [];
  return {
    ...state,
    playsBySessionId: {
      ...state.playsBySessionId,
      [sessionId]: [...existing, play],
    },
    sessions: state.sessions.map((s) =>
      s.id === sessionId ? { ...s, updatedAt: now } : s
    ),
  };
}

/**
 * Remove the last play from a session. Returns updated state.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @returns {{ state: import('./types').PersistedAppState, removedPlay: import('./types').PlayRecord|null }}
 */
export function removeLastPlay(state, sessionId) {
  const existing = state.playsBySessionId[sessionId] || [];
  if (existing.length === 0) return { state, removedPlay: null };

  const removedPlay = existing[existing.length - 1];
  const now = new Date().toISOString();

  return {
    state: {
      ...state,
      playsBySessionId: {
        ...state.playsBySessionId,
        [sessionId]: existing.slice(0, -1),
      },
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, updatedAt: now } : s
      ),
    },
    removedPlay,
  };
}

/**
 * Update the current entry state for a session.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @param {Partial<import('./types').CurrentEntryState>} partial
 * @returns {import('./types').PersistedAppState}
 */
export function updateEntryState(state, sessionId, partial) {
  const current = state.currentEntryBySessionId[sessionId] || { ...blankEntryState };
  return {
    ...state,
    currentEntryBySessionId: {
      ...state.currentEntryBySessionId,
      [sessionId]: { ...current, ...partial },
    },
  };
}

/**
 * Update the session's currentPlayNumber.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @param {number} playNumber
 * @returns {import('./types').PersistedAppState}
 */
export function updatePlayNumber(state, sessionId, playNumber) {
  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === sessionId ? { ...s, currentPlayNumber: playNumber, updatedAt: new Date().toISOString() } : s
    ),
  };
}

/**
 * Update the session's quarter.
 *
 * @param {import('./types').PersistedAppState} state
 * @param {string} sessionId
 * @param {string} quarter
 * @returns {import('./types').PersistedAppState}
 */
export function updateQuarter(state, sessionId, quarter) {
  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === sessionId ? { ...s, quarter, updatedAt: new Date().toISOString() } : s
    ),
  };
}
