/**
 * Phase 9: Drive Manager
 * 
 * Pure functions for tracking offensive drives within a game session.
 * A drive groups consecutive plays. Ending a drive closes the current one
 * and the next saved play starts a new drive automatically.
 */

import { generateId } from './id-utils';
import { getOutcomeClassification } from './config-manager';

/**
 * Create a new drive for a session.
 * @param {string} sessionId
 * @param {number} driveNumber
 * @param {number} startPlayNumber
 * @returns {object} drive object
 */
export function createDrive(sessionId, driveNumber, startPlayNumber) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    sessionId,
    driveNumber,
    startedAt: now,
    endedAt: null,
    startPlayNumber,
    endPlayNumber: null,
    playIds: [],
    status: 'active', // 'active' | 'ended'
  };
}

/**
 * Get drives for a session.
 * @param {object} state - appState
 * @param {string} sessionId
 * @returns {Array} drives sorted by driveNumber
 */
export function getSessionDrives(state, sessionId) {
  const drives = state.drivesBySessionId?.[sessionId] || [];
  return [...drives].sort((a, b) => a.driveNumber - b.driveNumber);
}

/**
 * Get the active (current) drive for a session.
 * @param {object} state
 * @param {string} sessionId
 * @returns {object|null}
 */
export function getActiveDrive(state, sessionId) {
  const drives = state.drivesBySessionId?.[sessionId] || [];
  return drives.find((d) => d.status === 'active') || null;
}

/**
 * Start a new drive for a session. If there's already an active drive, returns state unchanged.
 * @param {object} state
 * @param {string} sessionId
 * @param {number} startPlayNumber
 * @returns {object} updated state
 */
export function startDrive(state, sessionId, startPlayNumber) {
  const drives = state.drivesBySessionId?.[sessionId] || [];
  const active = drives.find((d) => d.status === 'active');
  if (active) return state; // Already has an active drive

  const driveNumber = drives.length + 1;
  const drive = createDrive(sessionId, driveNumber, startPlayNumber);

  return {
    ...state,
    drivesBySessionId: {
      ...state.drivesBySessionId,
      [sessionId]: [...drives, drive],
    },
  };
}

/**
 * Add a play ID to the active drive.
 * If no active drive exists, starts one first.
 * @param {object} state
 * @param {string} sessionId
 * @param {string} playId
 * @param {number} playNumber
 * @returns {object} updated state
 */
export function addPlayToDrive(state, sessionId, playId, playNumber) {
  let currentState = state;
  let drives = currentState.drivesBySessionId?.[sessionId] || [];
  let active = drives.find((d) => d.status === 'active');

  // Auto-start a drive if none active
  if (!active) {
    currentState = startDrive(currentState, sessionId, playNumber);
    drives = currentState.drivesBySessionId[sessionId];
    active = drives.find((d) => d.status === 'active');
  }

  if (!active) return currentState;

  return {
    ...currentState,
    drivesBySessionId: {
      ...currentState.drivesBySessionId,
      [sessionId]: drives.map((d) =>
        d.id === active.id
          ? { ...d, playIds: [...d.playIds, playId], endPlayNumber: playNumber }
          : d
      ),
    },
  };
}

/**
 * End the active drive for a session.
 * @param {object} state
 * @param {string} sessionId
 * @returns {{ state: object, drive: object|null }} updated state and the ended drive
 */
export function endActiveDrive(state, sessionId) {
  const drives = state.drivesBySessionId?.[sessionId] || [];
  const active = drives.find((d) => d.status === 'active');
  if (!active) return { state, drive: null };

  const now = new Date().toISOString();
  const endedDrive = { ...active, status: 'ended', endedAt: now };

  return {
    state: {
      ...state,
      drivesBySessionId: {
        ...state.drivesBySessionId,
        [sessionId]: drives.map((d) =>
          d.id === active.id ? endedDrive : d
        ),
      },
    },
    drive: endedDrive,
  };
}

/**
 * Build a summary for a specific drive.
 * @param {object} drive
 * @param {Array} allPlays - all plays for the session
 * @param {Array} lookups - managed lookups for classification
 * @returns {object} drive summary
 */
export function buildDriveSummary(drive, allPlays, lookups) {
  // Get plays that belong to this drive and are not deleted
  const drivePlays = allPlays.filter(
    (p) => drive.playIds.includes(p.id) && !p.deleted
  );

  const totalPlays = drivePlays.length;

  // Outcome counts
  const outcomeCounts = {};
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let turnovers = 0;
  let sacks = 0;
  let tfl = 0;

  drivePlays.forEach((p) => {
    outcomeCounts[p.outcome] = (outcomeCounts[p.outcome] || 0) + 1;
    const cls = getOutcomeClassification(lookups, p.outcome);
    if (cls === 'positive') positive++;
    else if (cls === 'neutral') neutral++;
    else if (cls === 'negative') negative++;
    if (p.outcome === 'Turnover') turnovers++;
    if (p.outcome === 'Sack') sacks++;
    if (p.outcome === 'Tackle for loss') tfl++;
  });

  // Most-used calls
  const callCounts = {};
  drivePlays.forEach((p) => {
    const key = `${p.playType} · ${p.blitz} · ${p.lineStunt}`;
    callCounts[key] = (callCounts[key] || 0) + 1;
  });
  const topCalls = Object.entries(callCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([call, count]) => ({ call, count }));

  return {
    driveNumber: drive.driveNumber,
    totalPlays,
    startPlayNumber: drive.startPlayNumber,
    endPlayNumber: drive.endPlayNumber,
    positive,
    neutral,
    negative,
    turnovers,
    sacks,
    tfl,
    outcomeCounts,
    topCalls,
    positiveRate: totalPlays > 0 ? Math.round((positive / totalPlays) * 100) : 0,
  };
}
