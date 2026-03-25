/**
 * Sheet connection configuration management.
 *
 * Handles parsing Google Sheet URLs, persisting connection config locally,
 * and sending register/test/initialize requests to the Apps Script endpoint.
 */

import { postToAppsScript, isEndpointConfigured } from './sheet-api';
import { generateId } from './defaults';

// ── Local storage key ───────────────────────────────────────────────

const CONNECTION_STORAGE_KEY = 'defense_tapboard_sheet_connection';

// ── URL parsing ─────────────────────────────────────────────────────

/**
 * Extract spreadsheetId from a Google Sheets URL.
 * Supports:
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID
 *
 * @param {string} url
 * @returns {string|null}
 */
export function parseSpreadsheetIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Validate that a URL looks like a Google Sheets URL.
 * @param {string} url
 * @returns {{ valid: boolean, spreadsheetId: string|null, error?: string }}
 */
export function validateSheetUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, spreadsheetId: null, error: 'URL is empty' };
  }
  if (!url.includes('docs.google.com/spreadsheets')) {
    return { valid: false, spreadsheetId: null, error: 'Not a Google Sheets URL' };
  }
  const id = parseSpreadsheetIdFromUrl(url);
  if (!id) {
    return { valid: false, spreadsheetId: null, error: 'Could not parse spreadsheet ID from URL' };
  }
  return { valid: true, spreadsheetId: id };
}

// ── Default connection template ─────────────────────────────────────

export function createBlankConnection() {
  return {
    id: generateId(),
    connectionLabel: '',
    spreadsheetUrl: '',
    spreadsheetId: '',
    gamesTab: 'Games',
    playsTab: 'Plays',
    presetsTab: 'Presets',
    lookupsTab: 'Lookups',
    auditTab: 'Audit_Log',
    registrationKey: '',
    isRegistered: false,
    registeredAt: null,
    lastConnectionCheckAt: null,
    lastConnectionCheckStatus: null, // 'passed' | 'failed' | null
    lastConnectionCheckMessage: null,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Persistence ─────────────────────────────────────────────────────

/**
 * Load saved connection config from localStorage.
 * @returns {object|null}
 */
export function loadConnectionConfig() {
  try {
    const raw = localStorage.getItem(CONNECTION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save connection config to localStorage.
 * @param {object} config
 */
export function saveConnectionConfig(config) {
  try {
    const payload = { ...config, updatedAt: new Date().toISOString() };
    localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch (err) {
    console.warn('[connection] Failed to save config:', err);
    return config;
  }
}

/**
 * Clear saved connection config.
 */
export function clearConnectionConfig() {
  try {
    localStorage.removeItem(CONNECTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Tabs object builder ─────────────────────────────────────────────

/**
 * Build the tabs object for API requests from a connection config.
 */
export function buildTabsFromConfig(config) {
  return {
    games: config.gamesTab || 'Games',
    plays: config.playsTab || 'Plays',
    presets: config.presetsTab || 'Presets',
    lookups: config.lookupsTab || 'Lookups',
    audit: config.auditTab || 'Audit_Log',
  };
}

// ── API actions ─────────────────────────────────────────────────────

/**
 * Test connection to a spreadsheet.
 * Does NOT require registration — just checks if the Apps Script can access the sheet.
 */
export async function testSheetConnection(config) {
  if (!isEndpointConfigured()) {
    return { ok: false, message: 'Apps Script endpoint not configured' };
  }
  if (!config.spreadsheetId) {
    return { ok: false, message: 'No spreadsheet ID configured' };
  }

  const resp = await postToAppsScript({
    action: 'testSheetAccess',
    spreadsheetId: config.spreadsheetId,
    tabs: buildTabsFromConfig(config),
  });

  return { ok: resp.ok, message: resp.message || '' };
}

/**
 * Register a spreadsheet with the Apps Script endpoint.
 * Requires a valid registration key.
 */
export async function registerSheet(config) {
  if (!isEndpointConfigured()) {
    return { ok: false, message: 'Apps Script endpoint not configured' };
  }
  if (!config.spreadsheetId) {
    return { ok: false, message: 'No spreadsheet ID configured' };
  }
  if (!config.registrationKey) {
    return { ok: false, message: 'Registration key is required' };
  }

  const resp = await postToAppsScript({
    action: 'registerSheet',
    spreadsheetId: config.spreadsheetId,
    connectionLabel: config.connectionLabel || '',
    tabs: buildTabsFromConfig(config),
    registrationKey: config.registrationKey,
  });

  return { ok: resp.ok, message: resp.message || '', remoteWrittenAt: resp.remoteWrittenAt };
}

/**
 * Initialize sheet tabs with headers.
 * Requires the sheet to already be registered.
 */
export async function initializeSheet(config) {
  if (!isEndpointConfigured()) {
    return { ok: false, message: 'Apps Script endpoint not configured' };
  }
  if (!config.spreadsheetId) {
    return { ok: false, message: 'No spreadsheet ID configured' };
  }

  const resp = await postToAppsScript({
    action: 'initializeSheet',
    spreadsheetId: config.spreadsheetId,
    tabs: buildTabsFromConfig(config),
  });

  return { ok: resp.ok, message: resp.message || '' };
}

// ── Connection readiness check ──────────────────────────────────────

/**
 * Determine the overall connection status from a config object.
 * @returns {'not_configured'|'configured'|'unregistered'|'registered'|'connection_failed'}
 */
export function getConnectionStatus(config) {
  if (!config || !config.spreadsheetId) return 'not_configured';
  if (!config.isRegistered) return 'unregistered';
  if (config.lastConnectionCheckStatus === 'failed') return 'connection_failed';
  return 'registered';
}

/**
 * Check if a connection is ready for writes.
 */
export function isConnectionReady(config) {
  return Boolean(
    config &&
    config.spreadsheetId &&
    config.isRegistered &&
    config.active
  );
}
