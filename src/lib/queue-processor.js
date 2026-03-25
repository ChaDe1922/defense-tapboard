/**
 * Queue processor for Phase 5 offline-first sync.
 * 
 * Orchestrates sequential processing of sync jobs with locking to prevent
 * concurrent processing and duplicate attempts.
 */

import {
  getPendingJobs,
  markJobInFlight,
  markJobSynced,
  markJobFailed,
  processSyncJob,
  pruneOldSyncedJobs,
} from './queue-manager';
import { canAttemptSync } from './network-status';

/**
 * Process the queue sequentially.
 * Returns updated queue state and processing results.
 * 
 * @param {import('./queue-types').QueueState} queueState
 * @param {import('./queue-types').NetworkStatus} networkStatus
 * @param {object} options
 * @param {number} [options.maxJobsPerRun] - Max jobs to process in one run
 * @param {Function} [options.onJobStart] - Callback when job starts
 * @param {Function} [options.onJobComplete] - Callback when job completes
 * @param {Function} [options.onJobFailed] - Callback when job fails
 * @returns {Promise<{state: import('./queue-types').QueueState, processed: number, succeeded: number, failed: number}>}
 */
export async function processQueue(queueState, networkStatus, options = {}) {
  const {
    maxJobsPerRun = 10,
    onJobStart = () => {},
    onJobComplete = () => {},
    onJobFailed = () => {},
  } = options;

  // Check if already processing
  if (queueState.isProcessing) {
    console.log('[queue-processor] Queue already processing, skipping');
    return {
      state: queueState,
      processed: 0,
      succeeded: 0,
      failed: 0,
    };
  }

  // Check if we can sync
  if (!canAttemptSync(networkStatus)) {
    console.log('[queue-processor] Cannot attempt sync, network/connection not ready');
    return {
      state: queueState,
      processed: 0,
      succeeded: 0,
      failed: 0,
    };
  }

  // Get pending jobs
  const pendingJobs = getPendingJobs(queueState);
  if (pendingJobs.length === 0) {
    console.log('[queue-processor] No pending jobs');
    return {
      state: queueState,
      processed: 0,
      succeeded: 0,
      failed: 0,
    };
  }

  // Mark as processing
  let state = {
    ...queueState,
    isProcessing: true,
    processingStartedAt: new Date().toISOString(),
  };

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  // Process jobs sequentially
  const jobsToProcess = pendingJobs.slice(0, maxJobsPerRun);

  for (const job of jobsToProcess) {
    console.log(`[queue-processor] Processing job ${job.jobId} (${job.entityType}:${job.actionType})`);

    // Mark in-flight
    state = markJobInFlight(state, job.jobId);
    onJobStart(job);

    try {
      // Process the job
      const result = await processSyncJob(job);

      if (result.ok) {
        // Mark synced
        state = markJobSynced(state, job.jobId, {
          remoteWrittenAt: result.remoteWrittenAt,
        });
        succeeded++;
        onJobComplete(job, result);
        console.log(`[queue-processor] Job ${job.jobId} succeeded`);
      } else {
        // Mark failed
        state = markJobFailed(state, job.jobId, result.message || 'Unknown error');
        failed++;
        onJobFailed(job, result.message);
        console.warn(`[queue-processor] Job ${job.jobId} failed:`, result.message);
      }
    } catch (err) {
      // Mark failed
      state = markJobFailed(state, job.jobId, err.message || 'Unknown error');
      failed++;
      onJobFailed(job, err.message);
      console.error(`[queue-processor] Job ${job.jobId} error:`, err);
    }

    processed++;
  }

  // Prune old synced jobs
  state = pruneOldSyncedJobs(state, 100);

  // Mark as not processing
  state = {
    ...state,
    isProcessing: false,
    processingStartedAt: null,
    lastProcessedAt: new Date().toISOString(),
  };

  console.log(`[queue-processor] Processed ${processed} jobs: ${succeeded} succeeded, ${failed} failed`);

  return {
    state,
    processed,
    succeeded,
    failed,
  };
}

/**
 * Process a single job immediately (for manual retry).
 * @param {import('./queue-types').QueueState} queueState
 * @param {string} jobId
 * @returns {Promise<{state: import('./queue-types').QueueState, ok: boolean, message: string}>}
 */
export async function processSingleJob(queueState, jobId) {
  const job = queueState.jobs.find((j) => j.jobId === jobId);
  if (!job) {
    return {
      state: queueState,
      ok: false,
      message: 'Job not found',
    };
  }

  let state = markJobInFlight(queueState, jobId);

  try {
    const result = await processSyncJob(job);

    if (result.ok) {
      state = markJobSynced(state, jobId, {
        remoteWrittenAt: result.remoteWrittenAt,
      });
      return {
        state,
        ok: true,
        message: result.message || 'Synced successfully',
      };
    } else {
      state = markJobFailed(state, jobId, result.message || 'Unknown error');
      return {
        state,
        ok: false,
        message: result.message || 'Sync failed',
      };
    }
  } catch (err) {
    state = markJobFailed(state, jobId, err.message || 'Unknown error');
    return {
      state,
      ok: false,
      message: err.message || 'Sync failed',
    };
  }
}
