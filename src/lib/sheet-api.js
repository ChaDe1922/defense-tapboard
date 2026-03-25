/**
 * Low-level client for communicating with the Google Apps Script Web App.
 *
 * The endpoint URL is read from the VITE_APPS_SCRIPT_URL environment variable.
 * If not configured, all calls gracefully return failure responses.
 *
 * Every write request now includes spreadsheetId + tabs from the active
 * sheet connection (user-configured in-app).
 */

const TIMEOUT_MS = 15000;

/**
 * Get the configured Apps Script endpoint URL.
 * @returns {string|null}
 */
export function getEndpointUrl() {
  try {
    const url = import.meta.env.VITE_APPS_SCRIPT_URL;
    return url && typeof url === 'string' && url.startsWith('http') ? url : null;
  } catch {
    return null;
  }
}

/**
 * Check whether the endpoint is configured.
 * @returns {boolean}
 */
export function isEndpointConfigured() {
  return Boolean(getEndpointUrl());
}

/**
 * Post a JSON body to the Apps Script endpoint.
 * The body is the full request object (action + spreadsheetId + tabs + payload etc).
 *
 * @param {object} body - Full request body
 * @returns {Promise<object>}
 */
export async function postToAppsScript(body) {
  const url = getEndpointUrl();
  if (!url) {
    return {
      ok: false,
      action: body.action || 'unknown',
      entityId: null,
      result: 'failed',
      message: 'Apps Script endpoint not configured',
      remoteWrittenAt: null,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        ok: false,
        action: body.action,
        result: 'failed',
        message: `HTTP ${response.status}: ${response.statusText}`,
        remoteWrittenAt: null,
      };
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return {
        ok: false,
        action: body.action,
        result: 'failed',
        message: 'Invalid JSON response from server',
        remoteWrittenAt: null,
      };
    }
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    return {
      ok: false,
      action: body.action,
      result: 'failed',
      message: isTimeout ? 'Request timed out' : (err.message || 'Network error'),
      remoteWrittenAt: null,
    };
  }
}

/**
 * Health check — GET to verify endpoint is live.
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function healthCheck() {
  const url = getEndpointUrl();
  if (!url) {
    return { ok: false, message: 'Endpoint not configured' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);

    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return { ok: Boolean(data.ok), message: data.message || 'Connected' };
  } catch (err) {
    return { ok: false, message: err.name === 'AbortError' ? 'Timeout' : (err.message || 'Network error') };
  }
}
