/**
 * GA4 Data API Backend Service — Aanya Fashions
 *
 * Uses Google Analytics Data API v1 (REST) authenticated via a service account JWT.
 * All credentials are read from environment variables — NEVER from client-side code.
 *
 * Required env vars:
 *   GA4_PROPERTY_ID   – numeric GA4 property ID (e.g. 561727316)
 *   GA4_CLIENT_EMAIL  – service account email
 *   GA4_PRIVATE_KEY   – RSA private key (may contain literal \n from env)
 *   GA4_CLIENT_ID     – numeric service account client ID (optional but recommended)
 */

import crypto from 'crypto';

// ─── Constants ───────────────────────────────────────────────────────────────
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '561727316';
const TOKEN_ENDPOINT  = 'https://oauth2.googleapis.com/token';
const SCOPE           = 'https://www.googleapis.com/auth/analytics.readonly';
const BASE_URL        = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}`;
const TOKEN_TTL_MS    = 55 * 60 * 1000; // 55 minutes (tokens expire at 60)
const FETCH_TIMEOUT_MS = 10_000;        // 10-second network timeout

// ─── Token Cache ──────────────────────────────────────────────────────────────
let _cachedToken    = null;
let _tokenExpiresAt = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true only if all required env vars are present. */
function isConfigured() {
  return !!(
    process.env.GA4_CLIENT_EMAIL &&
    process.env.GA4_PRIVATE_KEY &&
    process.env.GA4_PROPERTY_ID
  );
}

/**
 * Base64-URL encode a Buffer or string (RFC 4648 §5, no padding).
 */
function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf-8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Build and sign a Google service-account JWT, then exchange it for an
 * OAuth2 access token. Tokens are cached for 55 minutes.
 *
 * @returns {Promise<string>} Bearer access token
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (_cachedToken && Date.now() < _tokenExpiresAt) {
    return _cachedToken;
  }

  if (!isConfigured()) {
    throw new Error(
      'GA4 service account not configured. ' +
      'Set GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY, and GA4_PROPERTY_ID in environment variables.'
    );
  }

  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  // Replace literal \n (from .env file) with actual newlines
  const privateKey  = process.env.GA4_PRIVATE_KEY.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  // ── Build JWT Header + Payload ────────────────────────────────────────────
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: expiry,
    ...(process.env.GA4_CLIENT_ID ? { cid: process.env.GA4_CLIENT_ID } : {})
  }));

  const signingInput = `${header}.${payload}`;

  // ── Sign with RSA-SHA256 ──────────────────────────────────────────────────
  let signature;
  try {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    signature = b64url(signer.sign(privateKey));
  } catch (signErr) {
    throw new Error(`Failed to sign GA4 JWT (check GA4_PRIVATE_KEY format): ${signErr.message}`);
  }

  const jwt = `${signingInput}.${signature}`;

  // ── Exchange JWT for access token ─────────────────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let tokenResponse;
  try {
    tokenResponse = await globalThis.fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth2:grant-type:jwt-bearer',
        assertion: jwt
      }).toString(),
      signal: controller.signal
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw new Error('GA4 token exchange timed out after 10 seconds.');
    }
    throw new Error(`GA4 token exchange network error: ${fetchErr.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      `GA4 token exchange failed (${tokenResponse.status}): ` +
      (tokenData.error_description || tokenData.error || JSON.stringify(tokenData))
    );
  }

  // Cache the token
  _cachedToken    = tokenData.access_token;
  _tokenExpiresAt = Date.now() + TOKEN_TTL_MS;

  return _cachedToken;
}

/**
 * Generic helper to call any GA4 Data API endpoint.
 *
 * @param {string} endpoint  Full URL to POST to
 * @param {object} body      Request body (will be JSON-serialised)
 * @returns {Promise<object>} Parsed GA4 JSON response
 */
async function _callGA4(endpoint, body) {
  const token = await getAccessToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await globalThis.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw new Error('GA4 API request timed out after 10 seconds.');
    }
    throw new Error(`GA4 API network error: ${fetchErr.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json();

  if (!response.ok) {
    // Parse GA4 error envelope: { error: { code, message, status } }
    const ga4Error = data?.error || {};
    const err = new Error(
      ga4Error.message ||
      `GA4 API error (HTTP ${response.status})`
    );
    err.code   = ga4Error.code   || response.status;
    err.status = ga4Error.status || 'UNKNOWN';
    throw err;
  }

  return data;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run a standard GA4 report.
 * @param {object} body  GA4 RunReportRequest body
 */
async function runReport(body) {
  return _callGA4(`${BASE_URL}:runReport`, body);
}

/**
 * Run a GA4 real-time report.
 * @param {object} body  GA4 RunRealtimeReportRequest body
 */
async function runRealtimeReport(body) {
  return _callGA4(`${BASE_URL}:runRealtimeReport`, body);
}

/**
 * Run a GA4 batch report (multiple sub-reports in one call).
 * @param {object} body  GA4 BatchRunReportsRequest body
 */
async function batchRunReports(body) {
  return _callGA4(`${BASE_URL}:batchRunReports`, body);
}

export { runReport, runRealtimeReport, batchRunReports, isConfigured };
