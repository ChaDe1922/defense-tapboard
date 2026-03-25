/**
 * Default seed data for first-load and recovery scenarios.
 * Phase 7: Lookup arrays are now used as seed data for managed lookups.
 * Presets are seeded on first load, then persisted and restored afterward.
 */

import { generateId } from './id-utils';
import { seedLookupItems } from './config-manager';

// Re-export generateId for backward compatibility
export { generateId };

// ── Lookup arrays (seed defaults) ──────────────────────────────────

export const playTypes = [
  'Chicago',
  'Death',
  'Lakers',
  'Miami',
  'Miami Show',
  'Tampa',
];

export const blitzes = [
  'Heavy Cyclone',
  'Heavy Wheel',
  'Heavy Sword',
  'Heavy Sam',
  'Heavy Smash',
  'Sam',
  'Wheel',
  'Smash',
  'Sword',
  'Cyclone',
];

export const stunts = [
  'Pin',
  'Bow',
  'Tap',
  'River',
  'Lake',
  'Gnat',
  'Ton',
  'Quick',
  'Lag',
];

export const outcomes = [
  'Tackle for loss',
  'Sack',
  'First down',
  'Under',
  '5 yards gained',
  'Over 10 yards gained',
  'Turnover',
];

// ── Default presets (seeded once, then persisted) ──────────────────

const now = new Date().toISOString();

export const defaultPresets = [
  { id: 1, name: 'Chicago Pin', playType: 'Chicago', blitz: 'Heavy Sam', lineStunt: 'Pin', favorite: true, active: true, sortOrder: 0, createdAt: now },
  { id: 2, name: 'Death River', playType: 'Death', blitz: 'Cyclone', lineStunt: 'River', favorite: true, active: true, sortOrder: 1, createdAt: now },
  { id: 3, name: 'Miami Quick', playType: 'Miami', blitz: 'Smash', lineStunt: 'Quick', favorite: true, active: true, sortOrder: 2, createdAt: now },
  { id: 4, name: 'Tampa Bow', playType: 'Tampa', blitz: 'Wheel', lineStunt: 'Bow', favorite: false, active: true, sortOrder: 3, createdAt: now },
  { id: 5, name: 'Lakers Tap', playType: 'Lakers', blitz: 'Sword', lineStunt: 'Tap', favorite: false, active: true, sortOrder: 4, createdAt: now },
];

// ── Blank entry state ──────────────────────────────────────────────

export const blankEntryState = {
  selectedPresetId: null,
  selectedPlayType: '',
  selectedBlitz: '',
  selectedLineStunt: '',
  selectedOutcome: null,
  presetCustomized: false,
};

// ── Seed lookup items from defaults ────────────────────────────────

export function createDefaultLookups() {
  return seedLookupItems(playTypes, blitzes, stunts, outcomes);
}

// ── Fresh persisted state skeleton ─────────────────────────────────

export function createFreshState() {
  return {
    version: 2,
    activeSessionId: null,
    sessions: [],
    playsBySessionId: {},
    currentEntryBySessionId: {},
    presets: [...defaultPresets],
    lookups: createDefaultLookups(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

// ── UUID helper (re-exported from id-utils.js) ─────────────────────
