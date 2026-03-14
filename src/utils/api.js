/**
 * Shared API utilities for consistent error handling and data export.
 */

/**
 * Fetch JSON from an API endpoint with standardized error extraction.
 *
 * @param {string} url - The endpoint URL.
 * @param {RequestInit} [options] - Fetch options (method, headers, body, signal, etc.)
 * @returns {Promise<any>} Parsed JSON response data.
 * @throws {Error} With a user-friendly error message extracted from the response.
 */
export async function fetchJSON(url, options = {}) {
  const { headers: customHeaders, ...restOptions } = options;
  const response = await fetch(url, {
    ...restOptions,
    headers: { 'Content-Type': 'application/json', ...customHeaders },
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errData = await response.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      // Response was not JSON (e.g. proxy error page)
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Download a JavaScript object as a JSON file.
 *
 * @param {any} data - The data to export.
 * @param {string} filenamePrefix - Prefix for the downloaded file (date will be appended).
 */
export function downloadJSON(data, filenamePrefix) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
