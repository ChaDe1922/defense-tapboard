/**
 * Sync orchestration layer.
 *
 * Coordinates pushing local records to Google Sheets via the Apps Script API.
 * All sync is fire-and-forget from the UI's perspective — local state is always
 * updated first, and sync results are applied asynchronously.
 *
 * Every sync function requires a connection config object that provides
 * spreadsheetId and tab names for the destination sheet.
 *
 * Sync status values: "queued" | "synced" | "failed"
 */

import { postToAppsScript, isEndpointConfigured } from './sheet-api';
import { buildTabsFromConfig, isConnectionReady } from './connection';
import { playTypes, blitzes, stunts, outcomes } from './defaults';

// ── Preflight check ─────────────────────────────────────────────────

function canSync(conn) {
  return isEndpointConfigured() && isConnectionReady(conn);
}

function noSyncResult(reason) {
  return { ok: false, message: reason || 'Sync not available', remoteWrittenAt: null };
}

// ── Request builder helper ──────────────────────────────────────────

function buildRequest(action, conn, payload) {
  return {
    action,
    spreadsheetId: conn.spreadsheetId,
    tabs: buildTabsFromConfig(conn),
    payload,
  };
}

// ── Payload builders ────────────────────────────────────────────────

export function buildGamePayload(session) {
  return {
    game_id: session.id,
    game_label: session.label,
    opponent: session.opponent,
    game_date: session.date,
    venue: session.venue || '',
    entered_by: session.enteredBy,
    status: session.status,
    quarter: session.quarter,
    current_play_number: session.currentPlayNumber,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    last_opened_at: session.lastOpenedAt || '',
    local_updated_at: session.updatedAt,
    sync_attempt_count: (session.syncAttemptCount || 0) + 1,
  };
}

export function buildPlayPayload(play, session) {
  return {
    play_id: play.id,
    game_id: play.sessionId,
    game_label: session ? session.label : '',
    opponent: session ? session.opponent : '',
    game_date: session ? session.date : '',
    play_number: play.playNumber,
    quarter: play.quarter,
    play_type: play.playType,
    blitz: play.blitz,
    line_stunt: play.lineStunt,
    outcome: play.outcome,
    preset_id: play.presetId != null ? String(play.presetId) : '',
    preset_name: play.presetName || '',
    preset_customized: Boolean(play.presetCustomized),
    entry_mode: play.entryMode || '',
    time_label: play.timeLabel || '',
    created_at: play.createdAt,
    updated_at: play.updatedAt || play.createdAt,
    local_updated_at: play.updatedAt || play.createdAt,
    sync_attempt_count: (play.syncAttemptCount || 0) + 1,
  };
}

export function buildPresetsPayload(presets) {
  return (presets || []).filter((p) => !p.deleted).map((p) => ({
    preset_id: String(p.id),
    preset_name: p.name,
    play_type: p.playType,
    blitz: p.blitz,
    line_stunt: p.lineStunt,
    favorite: Boolean(p.favorite),
    active: p.active !== false,
    sort_order: p.sortOrder ?? 0,
    source: p.source || 'default',
    deleted: Boolean(p.deleted),
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  }));
}

export function buildLookupsPayload(managedLookups) {
  // If managed lookups are provided, use them; otherwise fall back to seed defaults
  if (managedLookups && managedLookups.length > 0) {
    return managedLookups.filter((l) => !l.deleted).map((l) => ({
      lookup_id: String(l.id),
      lookup_type: l.lookupType,
      lookup_value: l.value,
      active: l.active,
      required: Boolean(l.required),
      protected: Boolean(l.protected),
      sort_order: l.sortOrder ?? 0,
      deleted: Boolean(l.deleted),
      created_at: l.createdAt || new Date().toISOString(),
      updated_at: l.updatedAt || new Date().toISOString(),
    }));
  }
  // Fallback: seed from hardcoded defaults
  const items = [];
  let order = 0;
  const addType = (type, values) => {
    values.forEach((v) => {
      items.push({ lookup_type: type, lookup_value: v, active: true, sort_order: order++ });
    });
  };
  addType('play_type', playTypes);
  addType('blitz', blitzes);
  addType('line_stunt', stunts);
  addType('outcome', outcomes);
  return items;
}

// ── Sync actions ────────────────────────────────────────────────────

/**
 * Sync a game session to the configured Google Sheet.
 * @param {object} session - GameSession
 * @param {object} conn - SheetConnection config
 */
export async function syncGame(session, conn) {
  if (!canSync(conn)) return noSyncResult('Connection not ready');
  const resp = await postToAppsScript(buildRequest('upsertGame', conn, buildGamePayload(session)));
  return { ok: resp.ok, remoteWrittenAt: resp.remoteWrittenAt || null, message: resp.message || '' };
}

/**
 * Sync a play to the configured Google Sheet.
 * @param {object} play - PlayRecord
 * @param {object} session - Parent GameSession
 * @param {object} conn - SheetConnection config
 */
export async function syncPlay(play, session, conn) {
  if (!canSync(conn)) return noSyncResult('Connection not ready');
  const resp = await postToAppsScript(buildRequest('upsertPlay', conn, buildPlayPayload(play, session)));
  return { ok: resp.ok, remoteWrittenAt: resp.remoteWrittenAt || null, message: resp.message || '' };
}

/**
 * Sync presets to the configured Google Sheet.
 * @param {object[]} presets
 * @param {object} conn - SheetConnection config
 */
export async function syncPresets(presets, conn) {
  if (!canSync(conn)) return noSyncResult('Connection not ready');
  const resp = await postToAppsScript(buildRequest('upsertPresets', conn, buildPresetsPayload(presets)));
  return { ok: resp.ok, message: resp.message || '' };
}

/**
 * Seed lookups to the configured Google Sheet.
 * @param {object} conn - SheetConnection config
 */
export async function seedLookups(conn) {
  if (!canSync(conn)) return noSyncResult('Connection not ready');
  const resp = await postToAppsScript(buildRequest('seedLookups', conn, buildLookupsPayload()));
  return { ok: resp.ok, message: resp.message || '' };
}
