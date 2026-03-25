/**
 * Phase 8: Correction Safety
 * 
 * Data models, helpers, and utilities for safe play editing,
 * soft delete, and audit trail functionality.
 */

import { generateId } from './id-utils';

// ── Correction Status Types ────────────────────────────────────────

export const CORRECTED_STATUS = {
  ORIGINAL: 'original',
  CORRECTED: 'corrected',
  DELETED: 'deleted',
};

export const AUDIT_ACTION_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  SOFT_DELETE: 'soft_delete',
  RESTORE: 'restore',
  INSERT: 'insert',
};

// ── Play Record Correction Fields ──────────────────────────────────

/**
 * Extends a play record with correction metadata.
 * Safe to call on existing plays without these fields.
 */
export function ensurePlayCorrectionFields(play) {
  return {
    ...play,
    edited: play.edited ?? false,
    correctedStatus: play.correctedStatus ?? CORRECTED_STATUS.ORIGINAL,
    deleted: play.deleted ?? false,
    deletedAt: play.deletedAt ?? null,
    deletedBy: play.deletedBy ?? null,
    lastCorrectedAt: play.lastCorrectedAt ?? null,
    lastCorrectedBy: play.lastCorrectedBy ?? null,
    correctionReason: play.correctionReason ?? null,
    inserted: play.inserted ?? false,
    insertedAt: play.insertedAt ?? null,
    revision: play.revision ?? 1,
  };
}

/**
 * Migrates an array of plays to include correction fields.
 */
export function migratePlaysForCorrections(plays) {
  if (!Array.isArray(plays)) return [];
  return plays.map(ensurePlayCorrectionFields);
}

// ── Audit Entry Creation ────────────────────────────────────────────

/**
 * Creates an audit entry for a correction action.
 */
export function createAuditEntry({
  entityType = 'play',
  entityId,
  sessionId,
  actionType,
  createdBy = 'user',
  reason = null,
  beforeSnapshot = null,
  afterSnapshot = null,
  fieldsChanged = [],
}) {
  return {
    auditId: generateId(),
    entityType,
    entityId,
    sessionId,
    actionType,
    createdAt: new Date().toISOString(),
    createdBy,
    reason,
    beforeSnapshot,
    afterSnapshot,
    fieldsChanged,
    syncStatus: 'queued',
  };
}

/**
 * Compares before/after play snapshots and returns changed field names.
 */
export function getChangedFields(before, after) {
  const fields = [];
  const keys = ['playType', 'blitz', 'lineStunt', 'outcome', 'quarter'];
  
  for (const key of keys) {
    if (before[key] !== after[key]) {
      fields.push(key);
    }
  }
  
  return fields;
}

// ── Play Editing ────────────────────────────────────────────────────

/**
 * Applies an edit to a play record, creating audit trail.
 */
export function editPlay(play, updates, reason = null) {
  const beforeSnapshot = {
    playType: play.playType,
    blitz: play.blitz,
    lineStunt: play.lineStunt,
    outcome: play.outcome,
    quarter: play.quarter,
  };

  const updatedPlay = {
    ...play,
    playType: updates.playType ?? play.playType,
    blitz: updates.blitz ?? play.blitz,
    lineStunt: updates.lineStunt ?? play.lineStunt,
    outcome: updates.outcome ?? play.outcome,
    quarter: updates.quarter ?? play.quarter,
    edited: true,
    correctedStatus: CORRECTED_STATUS.CORRECTED,
    lastCorrectedAt: new Date().toISOString(),
    lastCorrectedBy: 'user',
    correctionReason: reason,
    revision: (play.revision ?? 1) + 1,
    updatedAt: new Date().toISOString(),
    syncStatus: 'queued',
  };

  const afterSnapshot = {
    playType: updatedPlay.playType,
    blitz: updatedPlay.blitz,
    lineStunt: updatedPlay.lineStunt,
    outcome: updatedPlay.outcome,
    quarter: updatedPlay.quarter,
  };

  const fieldsChanged = getChangedFields(beforeSnapshot, afterSnapshot);

  const auditEntry = createAuditEntry({
    entityType: 'play',
    entityId: play.id,
    sessionId: play.sessionId,
    actionType: AUDIT_ACTION_TYPES.EDIT,
    reason,
    beforeSnapshot,
    afterSnapshot,
    fieldsChanged,
  });

  return { play: updatedPlay, auditEntry };
}

// ── Soft Delete ─────────────────────────────────────────────────────

/**
 * Soft deletes a play record, creating audit trail.
 */
export function softDeletePlay(play, reason = null) {
  const beforeSnapshot = {
    playType: play.playType,
    blitz: play.blitz,
    lineStunt: play.lineStunt,
    outcome: play.outcome,
    deleted: play.deleted ?? false,
  };

  const updatedPlay = {
    ...play,
    deleted: true,
    correctedStatus: CORRECTED_STATUS.DELETED,
    deletedAt: new Date().toISOString(),
    deletedBy: 'user',
    correctionReason: reason,
    revision: (play.revision ?? 1) + 1,
    updatedAt: new Date().toISOString(),
    syncStatus: 'queued',
  };

  const afterSnapshot = {
    playType: updatedPlay.playType,
    blitz: updatedPlay.blitz,
    lineStunt: updatedPlay.lineStunt,
    outcome: updatedPlay.outcome,
    deleted: true,
  };

  const auditEntry = createAuditEntry({
    entityType: 'play',
    entityId: play.id,
    sessionId: play.sessionId,
    actionType: AUDIT_ACTION_TYPES.SOFT_DELETE,
    reason,
    beforeSnapshot,
    afterSnapshot,
    fieldsChanged: ['deleted'],
  });

  return { play: updatedPlay, auditEntry };
}

// ── Restore Deleted Play ────────────────────────────────────────────

/**
 * Restores a soft-deleted play.
 */
export function restorePlay(play, reason = null) {
  const updatedPlay = {
    ...play,
    deleted: false,
    correctedStatus: play.edited ? CORRECTED_STATUS.CORRECTED : CORRECTED_STATUS.ORIGINAL,
    deletedAt: null,
    deletedBy: null,
    lastCorrectedAt: new Date().toISOString(),
    lastCorrectedBy: 'user',
    correctionReason: reason,
    revision: (play.revision ?? 1) + 1,
    updatedAt: new Date().toISOString(),
    syncStatus: 'queued',
  };

  const auditEntry = createAuditEntry({
    entityType: 'play',
    entityId: play.id,
    sessionId: play.sessionId,
    actionType: AUDIT_ACTION_TYPES.RESTORE,
    reason,
    beforeSnapshot: { deleted: true },
    afterSnapshot: { deleted: false },
    fieldsChanged: ['deleted'],
  });

  return { play: updatedPlay, auditEntry };
}

// ── Analytics Filtering ─────────────────────────────────────────────

/**
 * Filters plays for analytics - excludes deleted plays.
 */
export function getActivePlays(plays) {
  if (!Array.isArray(plays)) return [];
  return plays.filter(play => !play.deleted);
}

/**
 * Checks if a play should be included in analytics.
 */
export function isPlayActive(play) {
  return !play.deleted;
}

/**
 * Gets the display status for a play.
 */
export function getPlayDisplayStatus(play) {
  if (play.deleted) return 'deleted';
  if (play.edited) return 'corrected';
  if (play.inserted) return 'inserted';
  return 'original';
}
