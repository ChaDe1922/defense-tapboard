/**
 * Network status tracker for Phase 5 offline-first sync.
 * 
 * Tracks browser online/offline status and connection readiness.
 */

import { isEndpointConfigured } from './sheet-api';
import { isConnectionReady } from './connection';

/**
 * Create initial network status.
 * @returns {import('./queue-types').NetworkStatus}
 */
export function createNetworkStatus() {
  return {
    networkOnline: navigator.onLine,
    endpointStatus: 'unknown',
    connectionReady: false,
    syncMode: 'unconfigured',
    lastCheckedAt: new Date().toISOString(),
  };
}

/**
 * Determine sync mode based on network and connection state.
 * @param {boolean} networkOnline
 * @param {boolean} endpointConfigured
 * @param {boolean} connectionReady
 * @returns {"online"|"offline"|"degraded"|"unconfigured"}
 */
export function determineSyncMode(networkOnline, endpointConfigured, connectionReady) {
  if (!endpointConfigured || !connectionReady) return 'unconfigured';
  if (!networkOnline) return 'offline';
  return 'online';
}

/**
 * Update network status based on current conditions.
 * @param {import('./queue-types').SheetConnection} [connection]
 * @returns {import('./queue-types').NetworkStatus}
 */
export function updateNetworkStatus(connection) {
  const networkOnline = navigator.onLine;
  const endpointConfigured = isEndpointConfigured();
  const connectionReady = connection ? isConnectionReady(connection) : false;

  const syncMode = determineSyncMode(networkOnline, endpointConfigured, connectionReady);

  return {
    networkOnline,
    endpointStatus: endpointConfigured ? 'unknown' : 'unreachable',
    connectionReady,
    syncMode,
    lastCheckedAt: new Date().toISOString(),
  };
}

/**
 * Check if sync should be allowed based on network status.
 * @param {import('./queue-types').NetworkStatus} status
 * @returns {boolean}
 */
export function canAttemptSync(status) {
  // Allow sync if network is online and connection is ready
  // Don't require syncMode === 'online' as that's derived from these same checks
  return status.networkOnline && status.connectionReady;
}

/**
 * Setup browser online/offline event listeners.
 * @param {Function} onOnline - Callback when browser goes online
 * @param {Function} onOffline - Callback when browser goes offline
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupNetworkListeners(onOnline, onOffline) {
  const handleOnline = () => {
    console.log('[network-status] Browser online');
    onOnline();
  };

  const handleOffline = () => {
    console.log('[network-status] Browser offline');
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
