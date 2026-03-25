/**
 * Defense Tapboard — Google Apps Script Web App (Phase 4)
 *
 * Generic endpoint that writes to USER-CONFIGURED Google Sheets.
 * Every write request includes a spreadsheetId + tab names.
 * Sheets must be REGISTERED before writes are allowed.
 *
 * Registry: stored in Apps Script PropertiesService (ScriptProperties).
 * Registration key: set via ADMIN_REGISTRATION_KEY in Script Properties.
 *
 * Supported actions:
 *   healthCheck, registerSheet, testSheetAccess, initializeSheet,
 *   upsertGame, upsertPlay, upsertPresets, seedLookups (Phase 7: managed config)
 */

// ══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════

/**
 * Get the admin registration key from Script Properties.
 * Set this in: Project Settings → Script properties → Add:
 *   Key: ADMIN_REGISTRATION_KEY   Value: <your-secret>
 */
function getAdminKey() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_REGISTRATION_KEY') || '';
}

// ══════════════════════════════════════════════════════════════════════
// ENTRY POINTS
// ══════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    var request = parseRequest(e);
    if (!request || !request.action) {
      return buildErrorResponse('unknown', null, null, 'Missing action field');
    }

    switch (request.action) {
      case 'healthCheck':
        return handleHealthCheck();
      case 'registerSheet':
        return handleRegisterSheet(request);
      case 'testSheetAccess':
        return handleTestSheetAccess(request);
      case 'initializeSheet':
        return handleInitializeSheet(request);
      case 'upsertGame':
        return handleUpsertGame(request);
      case 'upsertPlay':
        return handleUpsertPlay(request);
      case 'upsertPresets':
        return handleUpsertPresets(request);
      case 'seedLookups':
        return handleSeedLookups(request);
      default:
        return buildErrorResponse(request.action, null, null, 'Unknown action: ' + request.action);
    }
  } catch (err) {
    return buildErrorResponse('unknown', null, null, 'Server error: ' + err.message);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, action: 'healthCheck', message: 'Defense Tapboard API is running', timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════════════════
// REQUEST PARSING
// ══════════════════════════════════════════════════════════════════════

function parseRequest(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  try { return JSON.parse(e.postData.contents); }
  catch (_) { return null; }
}

// ══════════════════════════════════════════════════════════════════════
// REGISTRY — PropertiesService-backed registered sheet list
// ══════════════════════════════════════════════════════════════════════

/**
 * Registry is stored as a JSON object in ScriptProperties under key
 * 'REGISTERED_SHEETS'. Shape: { [spreadsheetId]: { ...metadata } }
 */
function getRegistry() {
  var raw = PropertiesService.getScriptProperties().getProperty('REGISTERED_SHEETS');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { return {}; }
}

function saveRegistry(registry) {
  PropertiesService.getScriptProperties().setProperty('REGISTERED_SHEETS', JSON.stringify(registry));
}

function isSheetRegistered(spreadsheetId) {
  var reg = getRegistry();
  return reg.hasOwnProperty(spreadsheetId) && reg[spreadsheetId].active !== false;
}

function validateRegistrationKey(key) {
  var adminKey = getAdminKey();
  if (!adminKey) return false; // No admin key configured — reject all
  return String(key) === String(adminKey);
}

// ══════════════════════════════════════════════════════════════════════
// SHEET HELPERS
// ══════════════════════════════════════════════════════════════════════

function getSpreadsheetById(spreadsheetId) {
  return SpreadsheetApp.openById(spreadsheetId);
}

function getOrCreateSheet(spreadsheet, tabName) {
  var sheet = spreadsheet.getSheetByName(tabName);
  if (!sheet) sheet = spreadsheet.insertSheet(tabName);
  return sheet;
}

function getHeaderMap(sheet, defaultHeaders) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0 && defaultHeaders && defaultHeaders.length > 0) {
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    SpreadsheetApp.flush();
    lastCol = defaultHeaders.length;
  }
  if (lastCol === 0) return {};
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    if (headers[i]) map[String(headers[i])] = i + 1;
  }
  return map;
}

function findRowById(sheet, headerMap, idColumnName, entityId) {
  var col = headerMap[idColumnName];
  if (!col) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var values = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(entityId)) return i + 2;
  }
  return -1;
}

function upsertRow(sheet, headerMap, rowObject, idColumnName) {
  var entityId = rowObject[idColumnName];
  var existingRow = findRowById(sheet, headerMap, idColumnName, entityId);
  if (existingRow > 0) {
    for (var key in rowObject) {
      if (headerMap[key]) sheet.getRange(existingRow, headerMap[key]).setValue(rowObject[key]);
    }
    return { result: 'updated', row: existingRow };
  } else {
    var maxCol = 0;
    for (var k in headerMap) { if (headerMap[k] > maxCol) maxCol = headerMap[k]; }
    var newRow = [];
    for (var c = 0; c < maxCol; c++) newRow.push('');
    for (var key2 in rowObject) {
      if (headerMap[key2]) newRow[headerMap[key2] - 1] = rowObject[key2];
    }
    sheet.appendRow(newRow);
    return { result: 'created', row: sheet.getLastRow() };
  }
}

function ensureSheetHeaders(spreadsheet, tabName, headers) {
  var sheet = getOrCreateSheet(spreadsheet, tabName);
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    SpreadsheetApp.flush();
  }
  return sheet;
}

// ══════════════════════════════════════════════════════════════════════
// RESPONSE BUILDERS
// ══════════════════════════════════════════════════════════════════════

function buildSuccessResponse(action, entityId, sheetName, result, message) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true, action: action, entityId: entityId || null,
    sheet: sheetName || null, result: result || 'synced',
    message: message || 'Success', remoteWrittenAt: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function buildErrorResponse(action, entityId, sheetName, message) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: false, action: action, entityId: entityId || null,
    sheet: sheetName || null, result: 'failed',
    message: message || 'Unknown error', remoteWrittenAt: null
  })).setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════════════════════════════════════

var AUDIT_HEADERS = [
  'audit_id', 'entity_type', 'entity_id', 'game_id', 'action_type',
  'status', 'message', 'attempt_count', 'created_at', 'completed_at',
  'request_payload_summary', 'response_summary'
];

function appendAuditLog(spreadsheet, auditTabName, entry) {
  try {
    var sheet = ensureSheetHeaders(spreadsheet, auditTabName, AUDIT_HEADERS);
    var headerMap = getHeaderMap(sheet, AUDIT_HEADERS);
    var now = new Date().toISOString();
    var row = {
      audit_id: Utilities.getUuid(),
      entity_type: entry.entityType || '',
      entity_id: entry.entityId || '',
      game_id: entry.gameId || '',
      action_type: entry.actionType || '',
      status: entry.status || '',
      message: entry.message || '',
      attempt_count: entry.attemptCount || 0,
      created_at: now,
      completed_at: entry.status === 'synced' ? now : '',
      request_payload_summary: entry.requestSummary || '',
      response_summary: entry.responseSummary || ''
    };
    var maxCol = 0;
    for (var k in headerMap) { if (headerMap[k] > maxCol) maxCol = headerMap[k]; }
    var rowArr = [];
    for (var c = 0; c < maxCol; c++) rowArr.push('');
    for (var key in row) {
      if (headerMap[key]) rowArr[headerMap[key] - 1] = row[key];
    }
    sheet.appendRow(rowArr);
  } catch (err) {
    Logger.log('Audit log error: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════════════════
// REQUEST VALIDATION HELPERS
// ══════════════════════════════════════════════════════════════════════

/** Extracts and validates spreadsheetId + tabs from a request. */
function extractSheetContext(request) {
  var ssId = request.spreadsheetId;
  var tabs = request.tabs || {};
  if (!ssId) return { error: 'Missing spreadsheetId' };
  return {
    spreadsheetId: ssId,
    games: tabs.games || 'Games',
    plays: tabs.plays || 'Plays',
    presets: tabs.presets || 'Presets',
    lookups: tabs.lookups || 'Lookups',
    audit: tabs.audit || 'Audit_Log'
  };
}

/** Gate: spreadsheetId must be registered. Returns error response or null. */
function requireRegistered(action, ctx) {
  if (!isSheetRegistered(ctx.spreadsheetId)) {
    return buildErrorResponse(action, null, null, 'Spreadsheet is not registered. Register it first via the app.');
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER: healthCheck
// ══════════════════════════════════════════════════════════════════════

function handleHealthCheck() {
  return buildSuccessResponse('healthCheck', null, null, 'ok', 'Defense Tapboard API is running');
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER: registerSheet
// ══════════════════════════════════════════════════════════════════════

function handleRegisterSheet(request) {
  var key = request.registrationKey;
  if (!validateRegistrationKey(key)) {
    return buildErrorResponse('registerSheet', null, null, 'Invalid registration key');
  }

  var ctx = extractSheetContext(request);
  if (ctx.error) return buildErrorResponse('registerSheet', null, null, ctx.error);

  // Verify we can open the spreadsheet
  try {
    var ss = getSpreadsheetById(ctx.spreadsheetId);
    ss.getName(); // force access check
  } catch (err) {
    return buildErrorResponse('registerSheet', ctx.spreadsheetId, null,
      'Cannot access spreadsheet. Share it with the Apps Script service account. Error: ' + err.message);
  }

  var registry = getRegistry();
  var now = new Date().toISOString();
  registry[ctx.spreadsheetId] = {
    spreadsheet_id: ctx.spreadsheetId,
    connection_label: request.connectionLabel || '',
    games_tab: ctx.games,
    plays_tab: ctx.plays,
    presets_tab: ctx.presets,
    lookups_tab: ctx.lookups,
    audit_tab: ctx.audit,
    registered_at: now,
    registered_by: 'admin_key',
    active: true,
    last_verified_at: now
  };
  saveRegistry(registry);

  return buildSuccessResponse('registerSheet', ctx.spreadsheetId, null, 'registered',
    'Spreadsheet registered successfully');
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER: testSheetAccess
// ══════════════════════════════════════════════════════════════════════

function handleTestSheetAccess(request) {
  var ctx = extractSheetContext(request);
  if (ctx.error) return buildErrorResponse('testSheetAccess', null, null, ctx.error);

  try {
    var ss = getSpreadsheetById(ctx.spreadsheetId);
    var name = ss.getName();
    var registered = isSheetRegistered(ctx.spreadsheetId);
    return buildSuccessResponse('testSheetAccess', ctx.spreadsheetId, null, 'ok',
      'Accessible: "' + name + '". Registered: ' + (registered ? 'yes' : 'no'));
  } catch (err) {
    return buildErrorResponse('testSheetAccess', ctx.spreadsheetId, null,
      'Cannot access spreadsheet: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER: initializeSheet
// ══════════════════════════════════════════════════════════════════════

var GAME_HEADERS = [
  'game_id', 'game_label', 'opponent', 'game_date', 'venue', 'entered_by',
  'status', 'quarter', 'current_play_number', 'created_at', 'updated_at',
  'last_opened_at', 'sync_source', 'sync_status', 'local_updated_at', 'remote_written_at'
];

var PLAY_HEADERS = [
  'play_id', 'game_id', 'game_label', 'opponent', 'game_date',
  'play_number', 'quarter', 'play_type', 'blitz', 'line_stunt',
  'outcome', 'preset_id', 'preset_name', 'preset_customized', 'entry_mode',
  'time_label', 'created_at', 'updated_at', 'local_updated_at',
  'sync_status', 'sync_attempt_count', 'remote_written_at',
  'edited', 'corrected_status', 'deleted', 'deleted_at', 'last_corrected_at',
  'correction_reason', 'inserted', 'revision'
];

var PRESET_HEADERS = [
  'preset_id', 'preset_name', 'play_type', 'blitz', 'line_stunt',
  'favorite', 'active', 'sort_order', 'source', 'deleted',
  'created_at', 'updated_at', 'sync_status', 'remote_written_at'
];

var LOOKUP_HEADERS = [
  'lookup_id', 'lookup_type', 'lookup_value', 'active', 'required', 'protected',
  'sort_order', 'deleted', 'created_at', 'updated_at', 'remote_written_at'
];

function handleInitializeSheet(request) {
  var ctx = extractSheetContext(request);
  if (ctx.error) return buildErrorResponse('initializeSheet', null, null, ctx.error);

  var regErr = requireRegistered('initializeSheet', ctx);
  if (regErr) return regErr;

  try {
    var ss = getSpreadsheetById(ctx.spreadsheetId);
    ensureSheetHeaders(ss, ctx.games, GAME_HEADERS);
    ensureSheetHeaders(ss, ctx.plays, PLAY_HEADERS);
    ensureSheetHeaders(ss, ctx.presets, PRESET_HEADERS);
    ensureSheetHeaders(ss, ctx.lookups, LOOKUP_HEADERS);
    ensureSheetHeaders(ss, ctx.audit, AUDIT_HEADERS);

    appendAuditLog(ss, ctx.audit, {
      entityType: 'system', actionType: 'initialize_sheet',
      status: 'synced', message: 'All tabs initialized with headers'
    });

    return buildSuccessResponse('initializeSheet', ctx.spreadsheetId, null, 'initialized',
      'All 5 tabs created/verified with headers');
  } catch (err) {
    return buildErrorResponse('initializeSheet', ctx.spreadsheetId, null,
      'Initialization failed: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER: upsertGame
// ══════════════════════════════════════════════════════════════════════

function handleUpsertGame(request) {
  var ctx = extractSheetContext(request);
  if (ctx.error) return buildErrorResponse('upsertGame', null, null, ctx.error);
  var regErr = requireRegistered('upsertGame', ctx);
  if (regErr) return regErr;

  var payload = request.payload;
  if (!payload || !payload.game_id) {
    return buildErrorResponse('upsertGame', null, ctx.games, 'Missing game_id in payload');
  }

  try {
    var ss = getSpreadsheetById(ctx.spreadsheetId);
    var sheet = ensureSheetHeaders(ss, ctx.games, GAME_HEADERS);
    var headerMap = getHeaderMap(sheet, GAME_HEADERS);
    var now = new Date().toISOString();

    var row = {
      game_id: payload.game_id,
      game_label: payload.game_label || '',
      opponent: payload.opponent || '',
      game_date: payload.game_date || '',
      venue: payload.venue || '',
      entered_by: payload.entered_by || '',
      status: payload.status || 'open',
      quarter: payload.quarter || 'Q1',
      current_play_number: payload.current_play_number || 1,
      created_at: payload.created_at || now,
      updated_at: payload.updated_at || now,
      last_opened_at: payload.last_opened_at || '',
      sync_source: 'app',
      sync_status: 'synced',
      local_updated_at: payload.local_updated_at || now,
      remote_written_at: now
    };

    var result = upsertRow(sheet, headerMap, row, 'game_id');

    appendAuditLog(ss, ctx.audit, {
      entityType: 'game', entityId: payload.game_id, gameId: payload.game_id,
      actionType: result.result === 'created' ? 'create_game' : 'update_game',
      status: 'synced',
      message: 'Game ' + result.result + ' at row ' + result.row,
      requestSummary: payload.game_label + ' vs ' + payload.opponent
    });

    return buildSuccessResponse('upsertGame', payload.game_id, ctx.games,
      result.result, 'Game ' + result.result + ' successfully');
  } catch (err) {
    return buildErrorResponse('upsertGame', payload.game_id, ctx.games,
      'Write failed: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER: upsertPlay
// ══════════════════════════════════════════════════════════════════════

function handleUpsertPlay(request) {
  var ctx = extractSheetContext(request);
  if (ctx.error) return buildErrorResponse('upsertPlay', null, null, ctx.error);
  var regErr = requireRegistered('upsertPlay', ctx);
  if (regErr) return regErr;

  var payload = request.payload;
  if (!payload || !payload.play_id) {
    return buildErrorResponse('upsertPlay', null, ctx.plays, 'Missing play_id in payload');
  }

  try {
    var ss = getSpreadsheetById(ctx.spreadsheetId);
    var sheet = ensureSheetHeaders(ss, ctx.plays, PLAY_HEADERS);
    var headerMap = getHeaderMap(sheet, PLAY_HEADERS);
    var now = new Date().toISOString();

    var row = {
      play_id: payload.play_id,
      game_id: payload.game_id || '',
      game_label: payload.game_label || '',
      opponent: payload.opponent || '',
      game_date: payload.game_date || '',
      play_number: payload.play_number || 0,
      quarter: payload.quarter || '',
      play_type: payload.play_type || '',
      blitz: payload.blitz || '',
      line_stunt: payload.line_stunt || '',
      outcome: payload.outcome || '',
      preset_id: payload.preset_id != null ? String(payload.preset_id) : '',
      preset_name: payload.preset_name || '',
      preset_customized: payload.preset_customized ? 'TRUE' : 'FALSE',
      entry_mode: payload.entry_mode || '',
      time_label: payload.time_label || '',
      created_at: payload.created_at || now,
      updated_at: payload.updated_at || now,
      local_updated_at: payload.local_updated_at || now,
      sync_status: 'synced',
      sync_attempt_count: payload.sync_attempt_count || 1,
      remote_written_at: now,
      edited: payload.edited ? 'TRUE' : 'FALSE',
      corrected_status: payload.correctedStatus || payload.corrected_status || 'original',
      deleted: payload.deleted ? 'TRUE' : 'FALSE',
      deleted_at: payload.deletedAt || payload.deleted_at || '',
      last_corrected_at: payload.lastCorrectedAt || payload.last_corrected_at || '',
      correction_reason: payload.correctionReason || payload.correction_reason || '',
      inserted: payload.inserted ? 'TRUE' : 'FALSE',
      revision: payload.revision || 1
    };

    var result = upsertRow(sheet, headerMap, row, 'play_id');

    appendAuditLog(ss, ctx.audit, {
      entityType: 'play', entityId: payload.play_id, gameId: payload.game_id,
      actionType: result.result === 'created' ? 'create_play' : 'update_play',
      status: 'synced',
      message: 'Play #' + payload.play_number + ' ' + result.result,
      requestSummary: payload.play_type + '/' + payload.blitz + '/' + payload.line_stunt + ' → ' + payload.outcome
    });

    return buildSuccessResponse('upsertPlay', payload.play_id, ctx.plays,
      result.result, 'Play ' + result.result + ' successfully');
  } catch (err) {
    return buildErrorResponse('upsertPlay', payload.play_id, ctx.plays,
      'Write failed: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER: upsertPresets
// ══════════════════════════════════════════════════════════════════════

function handleUpsertPresets(request) {
  var ctx = extractSheetContext(request);
  if (ctx.error) return buildErrorResponse('upsertPresets', null, null, ctx.error);
  var regErr = requireRegistered('upsertPresets', ctx);
  if (regErr) return regErr;

  var payload = request.payload;
  if (!payload || !Array.isArray(payload) || payload.length === 0) {
    return buildErrorResponse('upsertPresets', null, ctx.presets, 'Payload must be a non-empty array');
  }

  try {
    var ss = getSpreadsheetById(ctx.spreadsheetId);
    var sheet = ensureSheetHeaders(ss, ctx.presets, PRESET_HEADERS);
    var headerMap = getHeaderMap(sheet, PRESET_HEADERS);
    var now = new Date().toISOString();
    var results = [];

    for (var i = 0; i < payload.length; i++) {
      var p = payload[i];
      var row = {
        preset_id: String(p.preset_id || p.id || ''),
        preset_name: p.preset_name || p.name || '',
        play_type: p.play_type || p.playType || '',
        blitz: p.blitz || '',
        line_stunt: p.line_stunt || p.lineStunt || '',
        favorite: p.favorite ? 'TRUE' : 'FALSE',
        active: (p.active !== false) ? 'TRUE' : 'FALSE',
        sort_order: p.sort_order != null ? p.sort_order : (p.sortOrder != null ? p.sortOrder : i),
        created_at: p.created_at || now,
        updated_at: now,
        sync_status: 'synced',
        remote_written_at: now
      };
      var r = upsertRow(sheet, headerMap, row, 'preset_id');
      results.push(r.result);
    }

    appendAuditLog(ss, ctx.audit, {
      entityType: 'preset', entityId: 'batch', actionType: 'seed_presets',
      status: 'synced', message: payload.length + ' presets upserted',
      requestSummary: results.join(', ')
    });

    return buildSuccessResponse('upsertPresets', 'batch', ctx.presets,
      'synced', payload.length + ' presets upserted');
  } catch (err) {
    return buildErrorResponse('upsertPresets', null, ctx.presets,
      'Write failed: ' + err.message);
  }
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER: seedLookups
// ══════════════════════════════════════════════════════════════════════

function handleSeedLookups(request) {
  var ctx = extractSheetContext(request);
  if (ctx.error) return buildErrorResponse('seedLookups', null, null, ctx.error);
  var regErr = requireRegistered('seedLookups', ctx);
  if (regErr) return regErr;

  var payload = request.payload;
  if (!payload || !Array.isArray(payload) || payload.length === 0) {
    return buildErrorResponse('seedLookups', null, ctx.lookups, 'Payload must be a non-empty array');
  }

  try {
    var ss = getSpreadsheetById(ctx.spreadsheetId);
    var sheet = ensureSheetHeaders(ss, ctx.lookups, LOOKUP_HEADERS);
    var headerMap = getHeaderMap(sheet, LOOKUP_HEADERS);
    var now = new Date().toISOString();
    var upserted = 0;
    var hasLookupId = payload[0] && payload[0].lookup_id;

    for (var i = 0; i < payload.length; i++) {
      var item = payload[i];
      var row = {
        lookup_id: item.lookup_id || '',
        lookup_type: item.lookup_type || '',
        lookup_value: item.lookup_value || '',
        active: (item.active !== false) ? 'TRUE' : 'FALSE',
        required: item.required ? 'TRUE' : 'FALSE',
        protected: item.protected ? 'TRUE' : 'FALSE',
        sort_order: item.sort_order != null ? item.sort_order : i,
        deleted: item.deleted ? 'TRUE' : 'FALSE',
        created_at: item.created_at || now,
        updated_at: now,
        remote_written_at: now
      };

      if (hasLookupId && item.lookup_id) {
        // Phase 7: upsert by lookup_id
        upsertRow(sheet, headerMap, row, 'lookup_id');
        upserted++;
      } else {
        // Legacy: seed by type+value (skip if exists)
        var exists = false;
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          var typeCol = headerMap['lookup_type'];
          var valCol = headerMap['lookup_value'];
          if (typeCol && valCol) {
            var types = sheet.getRange(2, typeCol, lastRow - 1, 1).getValues();
            var vals = sheet.getRange(2, valCol, lastRow - 1, 1).getValues();
            for (var r = 0; r < types.length; r++) {
              if (String(types[r][0]) === String(item.lookup_type) && String(vals[r][0]) === String(item.lookup_value)) {
                exists = true; break;
              }
            }
          }
        }
        if (!exists) {
          var maxCol = 0;
          for (var k in headerMap) { if (headerMap[k] > maxCol) maxCol = headerMap[k]; }
          var rowArr = [];
          for (var c = 0; c < maxCol; c++) rowArr.push('');
          for (var key in row) {
            if (headerMap[key]) rowArr[headerMap[key] - 1] = row[key];
          }
          sheet.appendRow(rowArr);
          upserted++;
        }
      }
    }

    appendAuditLog(ss, ctx.audit, {
      entityType: 'lookup', entityId: 'batch', actionType: 'seed_lookups',
      status: 'synced', message: upserted + ' lookups upserted of ' + payload.length + ' total',
      requestSummary: 'Upserted ' + upserted + ' lookups'
    });

    return buildSuccessResponse('seedLookups', 'batch', ctx.lookups,
      'synced', upserted + ' lookups upserted');
  } catch (err) {
    return buildErrorResponse('seedLookups', null, ctx.lookups,
      'Seed failed: ' + err.message);
  }
}
