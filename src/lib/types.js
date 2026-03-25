/**
 * @typedef {Object} GameSession
 * @property {string} id - Unique session id (crypto.randomUUID or fallback)
 * @property {string} label - Display label, e.g. "DC 3/28"
 * @property {string} opponent
 * @property {string} date - Game date string
 * @property {string} [venue] - Optional venue
 * @property {string} enteredBy
 * @property {"open"|"closed"|"archived"} status
 * @property {string} quarter - Current quarter, e.g. "Q1"
 * @property {number} currentPlayNumber
 * @property {string} createdAt - ISO string
 * @property {string} updatedAt - ISO string
 * @property {string} [lastOpenedAt] - ISO string
 * @property {string} [notes]
 * @property {string} [teamName]
 * @property {"queued"|"synced"|"failed"} [syncStatus]
 * @property {number} [syncAttemptCount]
 * @property {string} [lastSyncAttemptAt]
 * @property {string} [remoteWrittenAt]
 * @property {boolean} [needsSync]
 */

/**
 * @typedef {Object} PlayRecord
 * @property {string} id - Unique play id
 * @property {string} sessionId - Parent session id
 * @property {number} playNumber
 * @property {string} playType
 * @property {string} blitz
 * @property {string} lineStunt
 * @property {string} outcome
 * @property {string} quarter
 * @property {string} [timeLabel]
 * @property {string|number|null} [presetId]
 * @property {string|null} [presetName]
 * @property {boolean} presetCustomized
 * @property {"preset"|"manual"|"repeat"} [entryMode]
 * @property {string} createdAt - ISO string
 * @property {string} [updatedAt]
 * @property {"queued"|"synced"|"failed"} [syncStatus]
 * @property {number} [syncAttemptCount]
 * @property {string} [lastSyncAttemptAt]
 * @property {string} [remoteWrittenAt]
 * @property {boolean} [needsSync]
 */

/**
 * @typedef {Object} CurrentEntryState
 * @property {string|number|null} selectedPresetId
 * @property {string} selectedPlayType
 * @property {string} selectedBlitz
 * @property {string} selectedLineStunt
 * @property {string|null} selectedOutcome
 * @property {boolean} presetCustomized
 */

/**
 * @typedef {Object} Preset
 * @property {number} id
 * @property {string} name
 * @property {string} playType
 * @property {string} blitz
 * @property {string} lineStunt
 * @property {boolean} favorite
 * @property {boolean} [active]
 * @property {number} [sortOrder]
 * @property {"queued"|"synced"|"failed"} [syncStatus]
 * @property {number} [syncAttemptCount]
 * @property {string} [remoteWrittenAt]
 */

/**
 * @typedef {Object} PersistedAppState
 * @property {number} version
 * @property {string|null} activeSessionId
 * @property {GameSession[]} sessions
 * @property {Record<string, PlayRecord[]>} playsBySessionId
 * @property {Record<string, CurrentEntryState>} currentEntryBySessionId
 * @property {Preset[]} presets
 * @property {string} lastUpdatedAt - ISO string
 * @property {boolean} [presetsSynced] - Whether presets have been synced at least once
 * @property {boolean} [lookupsSynced] - Whether lookups have been seeded at least once
 */

/**
 * @typedef {Object} SheetConnection
 * @property {string} id
 * @property {string} connectionLabel
 * @property {string} spreadsheetUrl
 * @property {string} spreadsheetId
 * @property {string} gamesTab
 * @property {string} playsTab
 * @property {string} presetsTab
 * @property {string} lookupsTab
 * @property {string} auditTab
 * @property {string} registrationKey - Stored locally for convenience; not sent on write requests
 * @property {boolean} isRegistered
 * @property {string|null} registeredAt
 * @property {string|null} lastConnectionCheckAt
 * @property {"passed"|"failed"|null} lastConnectionCheckStatus
 * @property {string|null} lastConnectionCheckMessage
 * @property {boolean} active
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {};
