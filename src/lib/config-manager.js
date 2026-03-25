/**
 * Phase 7: Config Manager
 * 
 * CRUD operations, validation, protection rules, and dependency checks
 * for managed presets and lookup values.
 */

import { generateId } from './id-utils';

// ── Required / Protected Outcomes ──────────────────────────────────

export const REQUIRED_OUTCOMES = [
  'Tackle for loss',
  'Sack',
  'First down',
  'Under',
  '5 yards gained',
  'Over 10 yards gained',
  'Turnover',
];

const REQUIRED_OUTCOME_SET = new Set(REQUIRED_OUTCOMES);

export function isProtectedOutcome(value) {
  return REQUIRED_OUTCOME_SET.has(value);
}

// ── Lookup Types ───────────────────────────────────────────────────

export const LOOKUP_TYPES = ['play_type', 'blitz', 'line_stunt', 'outcome'];

export const LOOKUP_TYPE_LABELS = {
  play_type: 'Play Type',
  blitz: 'Blitz',
  line_stunt: 'Line Stunt',
  outcome: 'Outcome',
};

// ── Normalization ──────────────────────────────────────────────────

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

// ── Lookup Item Factory ────────────────────────────────────────────

export function createLookupItem({ lookupType, value, active = true, sortOrder = 0, required = false, protected: isProtected = false }) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    lookupType,
    value: value.trim(),
    active,
    sortOrder,
    required,
    protected: isProtected,
    createdAt: now,
    updatedAt: now,
    deleted: false,
  };
}

// ── Seed Lookup Items from Defaults ────────────────────────────────

export function seedLookupItems(playTypes, blitzes, stunts, outcomes) {
  const items = [];
  let order = 0;

  playTypes.forEach((v) => {
    items.push(createLookupItem({ lookupType: 'play_type', value: v, sortOrder: order++, active: true }));
  });

  order = 0;
  blitzes.forEach((v) => {
    items.push(createLookupItem({ lookupType: 'blitz', value: v, sortOrder: order++, active: true }));
  });

  order = 0;
  stunts.forEach((v) => {
    items.push(createLookupItem({ lookupType: 'line_stunt', value: v, sortOrder: order++, active: true }));
  });

  order = 0;
  outcomes.forEach((v) => {
    const isReq = isProtectedOutcome(v);
    items.push(createLookupItem({
      lookupType: 'outcome',
      value: v,
      sortOrder: order++,
      active: true,
      required: isReq,
      protected: isReq,
    }));
  });

  return items;
}

// ── Lookup Queries ─────────────────────────────────────────────────

export function getLookupsByType(lookups, type) {
  return lookups
    .filter((l) => l.lookupType === type && !l.deleted)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getActiveLookupsByType(lookups, type) {
  return lookups
    .filter((l) => l.lookupType === type && l.active && !l.deleted)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getActiveLookupValues(lookups, type) {
  return getActiveLookupsByType(lookups, type).map((l) => l.value);
}

// ── Lookup Validation ──────────────────────────────────────────────

export function validateLookupValue(lookups, lookupType, value, excludeId = null) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'Value is required' };

  const normalized = normalize(trimmed);
  const existing = lookups.filter(
    (l) => l.lookupType === lookupType && !l.deleted && l.id !== excludeId
  );
  const duplicate = existing.find((l) => normalize(l.value) === normalized);
  if (duplicate) return { valid: false, error: `"${duplicate.value}" already exists` };

  return { valid: true, error: null };
}

// ── Lookup CRUD ────────────────────────────────────────────────────

export function addLookupItem(lookups, lookupType, value) {
  const validation = validateLookupValue(lookups, lookupType, value);
  if (!validation.valid) return { lookups, error: validation.error };

  const maxOrder = lookups
    .filter((l) => l.lookupType === lookupType && !l.deleted)
    .reduce((max, l) => Math.max(max, l.sortOrder), -1);

  const item = createLookupItem({
    lookupType,
    value: value.trim(),
    sortOrder: maxOrder + 1,
    active: true,
    required: false,
    protected: false,
  });

  return { lookups: [...lookups, item], error: null, item };
}

export function editLookupItem(lookups, itemId, newValue) {
  const item = lookups.find((l) => l.id === itemId);
  if (!item) return { lookups, error: 'Item not found' };
  if (item.protected) return { lookups, error: 'Protected values cannot be renamed' };

  const validation = validateLookupValue(lookups, item.lookupType, newValue, itemId);
  if (!validation.valid) return { lookups, error: validation.error };

  return {
    lookups: lookups.map((l) =>
      l.id === itemId
        ? { ...l, value: newValue.trim(), updatedAt: new Date().toISOString() }
        : l
    ),
    error: null,
  };
}

export function toggleLookupActive(lookups, itemId) {
  const item = lookups.find((l) => l.id === itemId);
  if (!item) return { lookups, error: 'Item not found' };
  if (item.protected && item.active) return { lookups, error: 'Protected values cannot be deactivated' };

  return {
    lookups: lookups.map((l) =>
      l.id === itemId
        ? { ...l, active: !l.active, updatedAt: new Date().toISOString() }
        : l
    ),
    error: null,
  };
}

export function deleteLookupItem(lookups, itemId, presets = []) {
  const item = lookups.find((l) => l.id === itemId);
  if (!item) return { lookups, error: 'Item not found' };
  if (item.protected) return { lookups, error: 'Protected values cannot be deleted' };
  if (item.required) return { lookups, error: 'Required values cannot be deleted' };

  // Check preset dependencies
  const deps = getPresetDependencies(presets, item.lookupType, item.value);
  if (deps.length > 0) {
    return { lookups, error: `Used by ${deps.length} preset${deps.length > 1 ? 's' : ''}: ${deps.map((p) => p.name).join(', ')}` };
  }

  return {
    lookups: lookups.map((l) =>
      l.id === itemId
        ? { ...l, deleted: true, active: false, updatedAt: new Date().toISOString() }
        : l
    ),
    error: null,
  };
}

export function reorderLookups(lookups, lookupType, orderedIds) {
  const updated = [...lookups];
  orderedIds.forEach((id, index) => {
    const idx = updated.findIndex((l) => l.id === id);
    if (idx !== -1) {
      updated[idx] = { ...updated[idx], sortOrder: index, updatedAt: new Date().toISOString() };
    }
  });
  return updated;
}

export function moveLookupItem(lookups, itemId, direction) {
  const item = lookups.find((l) => l.id === itemId);
  if (!item) return lookups;

  const typeItems = getLookupsByType(lookups, item.lookupType);
  const currentIndex = typeItems.findIndex((l) => l.id === itemId);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= typeItems.length) return lookups;

  const target = typeItems[targetIndex];
  const tempOrder = item.sortOrder;
  const now = new Date().toISOString();

  return lookups.map((l) => {
    if (l.id === item.id) return { ...l, sortOrder: target.sortOrder, updatedAt: now };
    if (l.id === target.id) return { ...l, sortOrder: tempOrder, updatedAt: now };
    return l;
  });
}

// ── Preset Dependencies ────────────────────────────────────────────

function getPresetDependencies(presets, lookupType, value) {
  const fieldMap = {
    play_type: 'playType',
    blitz: 'blitz',
    line_stunt: 'lineStunt',
  };
  const field = fieldMap[lookupType];
  if (!field) return [];

  return presets.filter((p) => !p.deleted && p.active && p[field] === value);
}

// ── Preset Queries ─────────────────────────────────────────────────

export function getActivePresets(presets) {
  return presets
    .filter((p) => p.active && !p.deleted)
    .sort((a, b) => {
      // Favorites first, then by sortOrder
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
}

export function getAllPresets(presets) {
  return presets
    .filter((p) => !p.deleted)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFavoritePresets(presets) {
  return presets
    .filter((p) => p.favorite && !p.deleted)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getInactivePresets(presets) {
  return presets
    .filter((p) => !p.active && !p.deleted)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── Preset Validation ──────────────────────────────────────────────

export function validatePreset(preset, lookups) {
  const errors = {};

  if (!(preset.name || '').trim()) errors.name = 'Name is required';
  if (!(preset.playType || '').trim()) errors.playType = 'Play type is required';
  if (!(preset.blitz || '').trim()) errors.blitz = 'Blitz is required';
  if (!(preset.lineStunt || '').trim()) errors.lineStunt = 'Line stunt is required';

  // Validate against lookup values
  if (lookups && preset.playType) {
    const validTypes = lookups.filter((l) => l.lookupType === 'play_type' && !l.deleted).map((l) => l.value);
    if (!validTypes.includes(preset.playType)) errors.playType = 'Invalid play type';
  }
  if (lookups && preset.blitz) {
    const validBlitzes = lookups.filter((l) => l.lookupType === 'blitz' && !l.deleted).map((l) => l.value);
    if (!validBlitzes.includes(preset.blitz)) errors.blitz = 'Invalid blitz';
  }
  if (lookups && preset.lineStunt) {
    const validStunts = lookups.filter((l) => l.lookupType === 'line_stunt' && !l.deleted).map((l) => l.value);
    if (!validStunts.includes(preset.lineStunt)) errors.lineStunt = 'Invalid line stunt';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Preset CRUD ────────────────────────────────────────────────────

export function createPreset({ name, playType, blitz, lineStunt, favorite = false, active = true }, presets) {
  const maxOrder = presets
    .filter((p) => !p.deleted)
    .reduce((max, p) => Math.max(max, p.sortOrder ?? 0), -1);

  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: name.trim(),
    playType,
    blitz,
    lineStunt,
    favorite,
    active,
    sortOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
    deleted: false,
    source: 'custom',
  };
}

export function addPreset(presets, presetData, lookups) {
  const validation = validatePreset(presetData, lookups);
  if (!validation.valid) return { presets, error: Object.values(validation.errors)[0] };

  const preset = createPreset(presetData, presets);
  return { presets: [...presets, preset], error: null, preset };
}

export function editPreset(presets, presetId, updates, lookups) {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) return { presets, error: 'Preset not found' };

  const merged = { ...preset, ...updates };
  const validation = validatePreset(merged, lookups);
  if (!validation.valid) return { presets, error: Object.values(validation.errors)[0] };

  return {
    presets: presets.map((p) =>
      p.id === presetId
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    ),
    error: null,
  };
}

export function deletePreset(presets, presetId) {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) return { presets, error: 'Preset not found' };

  return {
    presets: presets.map((p) =>
      p.id === presetId
        ? { ...p, deleted: true, active: false, updatedAt: new Date().toISOString() }
        : p
    ),
    error: null,
  };
}

export function togglePresetFavorite(presets, presetId) {
  return presets.map((p) =>
    p.id === presetId
      ? { ...p, favorite: !p.favorite, updatedAt: new Date().toISOString() }
      : p
  );
}

export function togglePresetActive(presets, presetId) {
  return presets.map((p) =>
    p.id === presetId
      ? { ...p, active: !p.active, updatedAt: new Date().toISOString() }
      : p
  );
}

export function movePreset(presets, presetId, direction) {
  const allPresets = getAllPresets(presets);
  const currentIndex = allPresets.findIndex((p) => p.id === presetId);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= allPresets.length) return presets;

  const target = allPresets[targetIndex];
  const current = allPresets[currentIndex];
  const tempOrder = current.sortOrder;
  const now = new Date().toISOString();

  return presets.map((p) => {
    if (p.id === current.id) return { ...p, sortOrder: target.sortOrder, updatedAt: now };
    if (p.id === target.id) return { ...p, sortOrder: tempOrder, updatedAt: now };
    return p;
  });
}

// ── Migrate Existing Presets ───────────────────────────────────────

export function migratePresets(existingPresets) {
  const now = new Date().toISOString();
  return existingPresets.map((p, i) => ({
    ...p,
    id: typeof p.id === 'number' ? generateId() : p.id,
    favorite: p.favorite ?? false,
    active: p.active !== false,
    sortOrder: p.sortOrder ?? i,
    createdAt: p.createdAt || now,
    updatedAt: p.updatedAt || now,
    deleted: p.deleted ?? false,
    source: p.source || 'default',
  }));
}
