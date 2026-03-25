/**
 * Queue manager for Phase 5 offline-first sync.
 * 
 * Manages sync job lifecycle: enqueue, dedupe, process, retry, mark status.
 * Sequential processing with lock to avoid race conditions.
 */

import { generateId } from './defaults';
import { calculateNextRetryAt, isReadyToRetry, shouldRetry } from './retry-policy';
import { postToAppsScript } from './sheet-api';
import { buildTabsFromConfig } from './connection';

/**
 * Create a sync job.
 * @param {object} params
 * @param {string} params.entityType
 * @param {string} params.actionType
 * @param {string} params.entityId
 * @param {string} [params.sessionId]
 * @param {string} params.spreadsheetId
 * @param {object} params.tabs
 * @param {object} params.payload
 * @param {number} [params.priority]
 * @returns {import('./queue-types').SyncJob}
 */
export function createSyncJob(params) {
  const now = new Date().toISOString();
  const dedupeKey = buildDedupeKey(params.entityType, params.actionType, params.entityId);

  return {
    jobId: generateId(),
    entityType: params.entityType,
    actionType: params.actionType,
    entityId: params.entityId,
    sessionId: params.sessionId || null,
    spreadsheetId: params.spreadsheetId,
    tabs: params.tabs,
    payload: params.payload,
    status: 'queued',
    attemptCount: 0,
    lastAttemptAt: null,
    nextRetryAt: null,
    createdAt: now,
    updatedAt: now,
    lastError: null,
    priority: params.priority ?? getPriorityForEntityType(params.entityType),
    dedupeKey,
    remoteWrittenAt: null,
  };
}

/**
 * Build stable dedupe key for a job.
 * @param {string} entityType
 * @param {string} actionType
 * @param {string} entityId
 * @returns {string}
 */
function buildDedupeKey(entityType, actionType, entityId) {
  return `${entityType}:${actionType}:${entityId}`;
}

/**
 * Get default priority for entity type.
 * Lower number = higher priority.
 * @param {string} entityType
 * @returns {number}
 */
function getPriorityForEntityType(entityType) {
  switch (entityType) {
    case 'system': return 0;
    case 'game': return 10;
    case 'play': return 20;
    case 'preset': return 30;
    default: return 50;
  }
}

/**
 * Enqueue a job with deduplication.
 * If a job with the same dedupeKey exists and is queued/failed, update it instead.
 * @param {import('./queue-types').QueueState} state
 * @param {import('./queue-types').SyncJob} newJob
 * @returns {import('./queue-types').QueueState}
 */
export function enqueueJob(state, newJob) {
  const existingIndex = state.jobs.findIndex((j) => j.dedupeKey === newJob.dedupeKey);

  if (existingIndex >= 0) {
    const existing = state.jobs[existingIndex];
    
    // If already synced and payload hasn't changed, skip
    if (existing.status === 'synced') {
      // For now, always update to allow re-sync if needed
      // In future, could add payload comparison
    }

    // If queued or failed, update the job
    if (existing.status === 'queued' || existing.status === 'failed') {
      const updated = {
        ...existing,
        payload: newJob.payload,
        tabs: newJob.tabs,
        spreadsheetId: newJob.spreadsheetId,
        status: 'queued',
        updatedAt: new Date().toISOString(),
        lastError: null,
      };

      const jobs = [...state.jobs];
      jobs[existingIndex] = updated;

      return { ...state, jobs };
    }

    // If in_flight, don't interfere
    if (existing.status === 'in_flight') {
      return state;
    }
  }

  // No existing job, add new one
  return {
    ...state,
    jobs: [...state.jobs, newJob],
  };
}

/**
 * Mark a job as in-flight.
 * @param {import('./queue-types').QueueState} state
 * @param {string} jobId
 * @returns {import('./queue-types').QueueState}
 */
export function markJobInFlight(state, jobId) {
  const now = new Date().toISOString();
  const jobs = state.jobs.map((job) =>
    job.jobId === jobId
      ? {
          ...job,
          status: 'in_flight',
          attemptCount: job.attemptCount + 1,
          lastAttemptAt: now,
          updatedAt: now,
        }
      : job
  );

  return { ...state, jobs };
}

/**
 * Mark a job as synced.
 * @param {import('./queue-types').QueueState} state
 * @param {string} jobId
 * @param {object} metadata
 * @param {string} [metadata.remoteWrittenAt]
 * @returns {import('./queue-types').QueueState}
 */
export function markJobSynced(state, jobId, metadata = {}) {
  const now = new Date().toISOString();
  const jobs = state.jobs.map((job) =>
    job.jobId === jobId
      ? {
          ...job,
          status: 'synced',
          updatedAt: now,
          remoteWrittenAt: metadata.remoteWrittenAt || now,
          lastError: null,
        }
      : job
  );

  return {
    ...state,
    jobs,
    lastSuccessfulSyncAt: now,
  };
}

/**
 * Mark a job as failed.
 * @param {import('./queue-types').QueueState} state
 * @param {string} jobId
 * @param {string} error
 * @returns {import('./queue-types').QueueState}
 */
export function markJobFailed(state, jobId, error) {
  const now = new Date().toISOString();
  const jobs = state.jobs.map((job) => {
    if (job.jobId !== jobId) return job;

    const nextRetryAt = shouldRetry(job)
      ? calculateNextRetryAt(job.attemptCount)
      : null;

    return {
      ...job,
      status: 'failed',
      updatedAt: now,
      lastError: error,
      nextRetryAt,
    };
  });

  return { ...state, jobs };
}

/**
 * Get queued jobs ready to process.
 * @param {import('./queue-types').QueueState} state
 * @returns {import('./queue-types').SyncJob[]}
 */
export function getQueuedJobs(state) {
  return state.jobs
    .filter((job) => job.status === 'queued')
    .sort((a, b) => {
      // Sort by priority first, then createdAt
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

/**
 * Get failed jobs ready to retry.
 * @param {import('./queue-types').QueueState} state
 * @returns {import('./queue-types').SyncJob[]}
 */
export function getFailedJobs(state) {
  return state.jobs
    .filter((job) => job.status === 'failed' && isReadyToRetry(job) && shouldRetry(job))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

/**
 * Get all pending jobs (queued + retryable failed).
 * @param {import('./queue-types').QueueState} state
 * @returns {import('./queue-types').SyncJob[]}
 */
export function getPendingJobs(state) {
  return [...getQueuedJobs(state), ...getFailedJobs(state)];
}

/**
 * Get queue summary statistics.
 * @param {import('./queue-types').QueueState} state
 * @param {string} [sessionId] - Optional filter by session
 * @returns {import('./queue-types').QueueSummary}
 */
export function getQueueSummary(state, sessionId = null) {
  const jobs = sessionId
    ? state.jobs.filter((j) => j.sessionId === sessionId)
    : state.jobs;

  const queuedCount = jobs.filter((j) => j.status === 'queued').length;
  const inFlightCount = jobs.filter((j) => j.status === 'in_flight').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const syncedCount = jobs.filter((j) => j.status === 'synced').length;

  const playJobs = jobs.filter((j) => j.entityType === 'play');
  const queuedPlayCount = playJobs.filter((j) => j.status === 'queued').length;
  const failedPlayCount = playJobs.filter((j) => j.status === 'failed').length;

  const queuedJobs = jobs.filter((j) => j.status === 'queued');
  const oldestQueuedJobAt = queuedJobs.length > 0
    ? queuedJobs.reduce((oldest, job) => {
        const jobTime = new Date(job.createdAt).getTime();
        const oldestTime = new Date(oldest).getTime();
        return jobTime < oldestTime ? job.createdAt : oldest;
      }, queuedJobs[0].createdAt)
    : null;

  return {
    totalJobs: jobs.length,
    queuedCount,
    inFlightCount,
    failedCount,
    syncedCount,
    queuedPlayCount,
    failedPlayCount,
    pendingPlayCount: queuedPlayCount + failedPlayCount,
    lastSuccessfulSyncAt: state.lastSuccessfulSyncAt || null,
    oldestQueuedJobAt,
  };
}

/**
 * Process a single sync job.
 * @param {import('./queue-types').SyncJob} job
 * @returns {Promise<{ok: boolean, remoteWrittenAt?: string, message?: string}>}
 */
export async function processSyncJob(job) {
  try {
    const request = {
      action: job.actionType,
      spreadsheetId: job.spreadsheetId,
      tabs: job.tabs,
      payload: job.payload,
    };

    const response = await postToAppsScript(request);

    return {
      ok: response.ok,
      remoteWrittenAt: response.remoteWrittenAt || null,
      message: response.message || '',
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'Unknown error',
    };
  }
}

/**
 * Get count of pending jobs for a session.
 * @param {import('./queue-types').QueueState} state
 * @param {string} sessionId
 * @returns {number}
 */
export function getPendingCountForSession(state, sessionId) {
  return state.jobs.filter(
    (j) => j.sessionId === sessionId && (j.status === 'queued' || j.status === 'failed')
  ).length;
}

/**
 * Remove old synced jobs to prevent unbounded growth.
 * @param {import('./queue-types').QueueState} state
 * @param {number} maxSyncedJobs - Maximum synced jobs to keep
 * @returns {import('./queue-types').QueueState}
 */
export function pruneOldSyncedJobs(state, maxSyncedJobs = 100) {
  const syncedJobs = state.jobs
    .filter((j) => j.status === 'synced')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (syncedJobs.length <= maxSyncedJobs) return state;

  const jobsToKeep = new Set(syncedJobs.slice(0, maxSyncedJobs).map((j) => j.jobId));
  const jobs = state.jobs.filter((j) => j.status !== 'synced' || jobsToKeep.has(j.jobId));

  return { ...state, jobs };
}
