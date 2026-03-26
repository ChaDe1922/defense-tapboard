/**
 * Low-level localStorage abstraction with versioning and safe parsing.
 *
 * Storage key: 'defense_tapboard_state'
 * All persisted app data lives under one key as a versioned JSON blob.
 * This keeps the footprint small and migration straightforward.
 */

const STORAGE_KEY = 'defense_tapboard_state';
const PERSISTENCE_VERSION = 5;

/**
 * Safely parse a JSON string. Returns null on failure.
 * @param {string} raw
 * @returns {object|null}
 */
export function safelyParseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('[storage] Failed to parse persisted JSON — will reset.');
    return null;
  }
}

/**
 * Load the full persisted state from localStorage.
 * Returns null if missing, malformed, or version-mismatched.
 * @returns {import('./types.js').PersistedAppState|null}
 */
export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = safelyParseJSON(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    // Version check — allow stored versions that hydrateInitialState can migrate.
    // Only reset if version is missing or higher than expected (corrupt/future data).
    if (!parsed.version || parsed.version > PERSISTENCE_VERSION) {
      console.warn(
        `[storage] Version issue: stored=${parsed.version}, max=${PERSISTENCE_VERSION}. Resetting.`
      );
      clearPersistedState();
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[storage] Unexpected error loading state:', err);
    return null;
  }
}

/**
 * Save the full app state to localStorage.
 * Automatically stamps version and lastUpdatedAt.
 * @param {import('./types.js').PersistedAppState} state
 */
export function savePersistedState(state) {
  try {
    const payload = {
      ...state,
      version: PERSISTENCE_VERSION,
      lastUpdatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[storage] Failed to persist state:', err);
  }
}

/**
 * Remove all persisted state.
 */
export function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[storage] Failed to clear state:', err);
  }
}

export { PERSISTENCE_VERSION };
