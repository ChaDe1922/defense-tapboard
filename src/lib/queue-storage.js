/**
 * Queue persistence layer for Phase 5 offline-first sync.
 * 
 * Stores sync jobs in localStorage with versioning and safe recovery.
 * Separate from main app state to keep concerns clean.
 */

const QUEUE_STORAGE_KEY = 'defense_tapboard_sync_queue';
const QUEUE_VERSION = 1;

/**
 * Create a fresh queue state.
 * @returns {import('./queue-types').QueueState}
 */
export function createFreshQueueState() {
  return {
    version: QUEUE_VERSION,
    jobs: [],
    isProcessing: false,
    processingStartedAt: null,
    lastProcessedAt: null,
    lastSuccessfulSyncAt: null,
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Safely parse JSON with fallback.
 * @param {string} raw
 * @returns {object|null}
 */
function safelyParseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('[queue-storage] Failed to parse queue JSON — will reset.');
    return null;
  }
}

/**
 * Load queue state from localStorage.
 * Returns fresh state if missing, malformed, or version-mismatched.
 * @returns {import('./queue-types').QueueState}
 */
export function loadQueueState() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return createFreshQueueState();

    const parsed = safelyParseJSON(raw);
    if (!parsed || typeof parsed !== 'object') return createFreshQueueState();

    // Version check
    if (parsed.version !== QUEUE_VERSION) {
      console.warn(
        `[queue-storage] Version mismatch: stored=${parsed.version}, expected=${QUEUE_VERSION}. Migrating or resetting.`
      );
      return migrateQueueState(parsed);
    }

    // Ensure required fields exist
    return {
      ...createFreshQueueState(),
      ...parsed,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  } catch (err) {
    console.warn('[queue-storage] Unexpected error loading queue:', err);
    return createFreshQueueState();
  }
}

/**
 * Migrate queue state from older versions.
 * @param {object} oldState
 * @returns {import('./queue-types').QueueState}
 */
function migrateQueueState(oldState) {
  // For now, if version doesn't match, start fresh
  // In future, add migration logic here
  console.warn('[queue-storage] No migration path available, starting with fresh queue.');
  return createFreshQueueState();
}

/**
 * Save queue state to localStorage.
 * @param {import('./queue-types').QueueState} state
 */
export function saveQueueState(state) {
  try {
    const payload = {
      ...state,
      version: QUEUE_VERSION,
      lastUpdatedAt: new Date().toISOString(),
    };
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[queue-storage] Failed to persist queue state:', err);
  }
}

/**
 * Clear all queue state.
 */
export function clearQueueState() {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (err) {
    console.warn('[queue-storage] Failed to clear queue state:', err);
  }
}

/**
 * Remove synced jobs older than a threshold to prevent unbounded growth.
 * @param {import('./queue-types').QueueState} state
 * @param {number} maxAgeMs - Max age in milliseconds (default 7 days)
 * @returns {import('./queue-types').QueueState}
 */
export function pruneOldSyncedJobs(state, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const cutoff = now - maxAgeMs;

  const jobs = state.jobs.filter((job) => {
    if (job.status !== 'synced') return true; // Keep non-synced jobs
    const jobTime = new Date(job.updatedAt).getTime();
    return jobTime > cutoff; // Keep recent synced jobs
  });

  return {
    ...state,
    jobs,
  };
}

export { QUEUE_VERSION };
