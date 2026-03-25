/**
 * Queue and reliability types for Phase 5 offline-first sync.
 *
 * @typedef {Object} SyncJob
 * @property {string} jobId - Unique job identifier
 * @property {"game"|"play"|"preset"|"system"} entityType
 * @property {"upsertGame"|"upsertPlay"|"upsertPresets"|"seedLookups"|"registerSheet"|"initializeSheet"} actionType
 * @property {string} entityId - Stable entity ID (gameId, playId, etc.)
 * @property {string} [sessionId] - Parent session ID for plays
 * @property {string} spreadsheetId - Target spreadsheet ID
 * @property {TabConfig} tabs - Tab names snapshot
 * @property {object} payload - Sync payload
 * @property {"queued"|"in_flight"|"synced"|"failed"} status
 * @property {number} attemptCount - Number of sync attempts
 * @property {string} [lastAttemptAt] - ISO timestamp of last attempt
 * @property {string} [nextRetryAt] - ISO timestamp when next retry should occur
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 * @property {string} [lastError] - Error message from last failed attempt
 * @property {number} priority - Lower number = higher priority (0-100)
 * @property {string} [connectionFingerprint] - Hash of connection config
 * @property {string} dedupeKey - Stable key for deduplication
 * @property {string} [remoteWrittenAt] - ISO timestamp from successful remote write
 */

/**
 * @typedef {Object} TabConfig
 * @property {string} games
 * @property {string} plays
 * @property {string} presets
 * @property {string} lookups
 * @property {string} audit
 */

/**
 * @typedef {Object} QueueState
 * @property {number} version - Queue state version for migrations
 * @property {SyncJob[]} jobs - All sync jobs
 * @property {boolean} isProcessing - Whether queue is currently processing
 * @property {string} [processingStartedAt] - ISO timestamp
 * @property {string} [lastProcessedAt] - ISO timestamp
 * @property {string} [lastSuccessfulSyncAt] - ISO timestamp of last successful sync
 * @property {string} lastUpdatedAt - ISO timestamp
 */

/**
 * @typedef {Object} NetworkStatus
 * @property {boolean} networkOnline - Browser online status
 * @property {"reachable"|"unreachable"|"unknown"} endpointStatus
 * @property {boolean} connectionReady - Whether connection is configured and registered
 * @property {"online"|"offline"|"degraded"|"unconfigured"} syncMode
 * @property {string} lastCheckedAt - ISO timestamp
 */

/**
 * @typedef {Object} QueueSummary
 * @property {number} totalJobs - Total jobs in queue
 * @property {number} queuedCount - Jobs with status "queued"
 * @property {number} inFlightCount - Jobs with status "in_flight"
 * @property {number} failedCount - Jobs with status "failed"
 * @property {number} syncedCount - Jobs with status "synced"
 * @property {number} queuedPlayCount - Queued play jobs
 * @property {number} failedPlayCount - Failed play jobs
 * @property {number} pendingPlayCount - Queued + failed play jobs
 * @property {string} [lastSuccessfulSyncAt] - ISO timestamp
 * @property {string} [oldestQueuedJobAt] - ISO timestamp of oldest queued job
 */

export {};
