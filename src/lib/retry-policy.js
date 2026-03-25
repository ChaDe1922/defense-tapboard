/**
 * Retry policy for Phase 5 background sync.
 * 
 * Implements exponential backoff with caps to avoid hammering the endpoint.
 */

/**
 * Calculate next retry timestamp based on attempt count.
 * 
 * Strategy:
 * - Attempt 1: immediate
 * - Attempt 2: after 5s
 * - Attempt 3: after 15s
 * - Attempt 4: after 30s
 * - Attempt 5+: cap at 60s
 * 
 * @param {number} attemptCount - Number of previous attempts
 * @returns {string} ISO timestamp for next retry
 */
export function calculateNextRetryAt(attemptCount) {
  const now = Date.now();
  let delayMs = 0;

  if (attemptCount === 0) {
    delayMs = 0; // Immediate
  } else if (attemptCount === 1) {
    delayMs = 5 * 1000; // 5s
  } else if (attemptCount === 2) {
    delayMs = 15 * 1000; // 15s
  } else if (attemptCount === 3) {
    delayMs = 30 * 1000; // 30s
  } else {
    delayMs = 60 * 1000; // 60s cap
  }

  return new Date(now + delayMs).toISOString();
}

/**
 * Check if a job is ready to retry based on nextRetryAt.
 * @param {import('./queue-types').SyncJob} job
 * @returns {boolean}
 */
export function isReadyToRetry(job) {
  if (!job.nextRetryAt) return true; // No retry time set, ready now
  const now = Date.now();
  const retryTime = new Date(job.nextRetryAt).getTime();
  return now >= retryTime;
}

/**
 * Check if a job should be retried based on attempt count.
 * @param {import('./queue-types').SyncJob} job
 * @param {number} maxAttempts - Maximum retry attempts (default 10)
 * @returns {boolean}
 */
export function shouldRetry(job, maxAttempts = 10) {
  return job.attemptCount < maxAttempts;
}

/**
 * Get delay in milliseconds for next retry.
 * @param {number} attemptCount
 * @returns {number}
 */
export function getRetryDelayMs(attemptCount) {
  if (attemptCount === 0) return 0;
  if (attemptCount === 1) return 5 * 1000;
  if (attemptCount === 2) return 15 * 1000;
  if (attemptCount === 3) return 30 * 1000;
  return 60 * 1000; // Cap at 60s
}
