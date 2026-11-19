/**
 * Analytics Routes — GA4 Data API Endpoints
 * Aanya Fashions Admin Backend
 *
 * All routes require `protect` + `admin` middleware.
 * Rate-limited to 60 requests/minute per IP.
 * Responses are cached in-memory (5 min historical, 30 s realtime).
 *
 * Mount point: /api/analytics  (registered in server/index.js)
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  runReport,
  runRealtimeReport,
  batchRunReports,
  isConfigured
} from '../services/ga4Service.js';

const router = Router();

// ─── Rate Limiter (60 req / min per IP) ───────────────────────────────────────
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Analytics rate limit exceeded. Maximum 60 requests per minute.'
    }
  }
});

// Apply rate limiter + auth guards to all analytics routes
router.use(analyticsLimiter);
router.use(protect, admin);

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
const cache = new Map();

const CACHE_TTL_HISTORICAL_MS = 5 * 60 * 1000;  // 5 minutes
const CACHE_TTL_REALTIME_MS   = 30 * 1000;       // 30 seconds

function getCacheKey(routeName, params = {}) {
  return `${routeName}:${JSON.stringify(params)}`;
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Shared response helpers ──────────────────────────────────────────────────

function notConfigured(res) {
  return res.status(503).json({
    success: false,
    configured: false,
    message: 'GA4 service account not configured. Set GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY, GA4_PROPERTY_ID in environment variables.'
  });
}

function ga4Error(res, err) {
  return res.status(502).json({
    success: false,
    error: {
      code:    err.code    || 500,
      message: err.message || 'Unknown GA4 API error',
      status:  err.status  || 'UNKNOWN'
    }
  });
}

function success(res, data, cached = false) {
  return res.json({
    success: true,
    data,
    cached,
    timestamp: new Date().toISOString()
  });
}

function dateParams(req) {
  return {
    startDate: req.query.startDate || '7daysAgo',
    endDate:   req.query.endDate   || 'today'
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/analytics/status
router.get('/status', (req, res) => {
  const configured = isConfigured();
  res.json({
    configured,
    propertyId: '561727316',
    note: configured
      ? 'GA4 service account credentials are present.'
      : 'Set GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY, and GA4_PROPERTY_ID to enable analytics.'
  });
});

// GET /api/analytics/realtime
router.get('/realtime', async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const cacheKey = getCacheKey('realtime');
  const cached   = getFromCache(cacheKey);
  if (cached) return success(res, cached, true);

  try {
    const data = await runRealtimeReport({
      dimensions: [
        { name: 'minutesAgo' },
        { name: 'country' },
        { name: 'deviceCategory' },
        { name: 'unifiedScreenName' }
      ],
      metrics: [
        { name: 'activeUsers' }
      ],
      minuteRanges: [
        { name: 'last30min', startMinutesAgo: 29, endMinutesAgo: 0 }
      ]
    });
    setCache(cacheKey, data, CACHE_TTL_REALTIME_MS);
    return success(res, data);
  } catch (err) {
    return ga4Error(res, err);
  }
});

// GET /api/analytics/overview?startDate=7daysAgo&endDate=today
router.get('/overview', async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { startDate, endDate } = dateParams(req);
  const cacheKey = getCacheKey('overview', { startDate, endDate });
  const cached   = getFromCache(cacheKey);
  if (cached) return success(res, cached, true);

  try {
    const dateRange = { startDate, endDate };

    // Compare previous equivalent period for context
    const data = await batchRunReports({
      requests: [
        // Current period
        {
          dateRanges: [dateRange],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'engagedSessions' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'eventCount' }
          ]
        },
        // Previous period (same window, shifted back)
        {
          dateRanges: [{ startDate: '14daysAgo', endDate: '7daysAgo' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
            { name: 'bounceRate' }
          ]
        }
      ]
    });

    setCache(cacheKey, data, CACHE_TTL_HISTORICAL_MS);
    return success(res, data);
  } catch (err) {
    return ga4Error(res, err);
  }
});

// GET /api/analytics/traffic?startDate=7daysAgo&endDate=today
router.get('/traffic', async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { startDate, endDate } = dateParams(req);
  const cacheKey = getCacheKey('traffic', { startDate, endDate });
  const cached   = getFromCache(cacheKey);
  if (cached) return success(res, cached, true);

  try {
    const data = await runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'newUsers' },
        { name: 'engagedSessions' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
    });
    setCache(cacheKey, data, CACHE_TTL_HISTORICAL_MS);
    return success(res, data);
  } catch (err) {
    return ga4Error(res, err);
  }
});

// GET /api/analytics/pages?startDate=7daysAgo&endDate=today&limit=20
router.get('/pages', async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { startDate, endDate } = dateParams(req);
  const limit   = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const cacheKey = getCacheKey('pages', { startDate, endDate, limit });
  const cached   = getFromCache(cacheKey);
  if (cached) return success(res, cached, true);

  try {
    const data = await runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'pageTitle' },
        { name: 'pagePath' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'averageSessionDuration' },
        { name: 'engagementRate' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit
    });
    setCache(cacheKey, data, CACHE_TTL_HISTORICAL_MS);
    return success(res, data);
  } catch (err) {
    return ga4Error(res, err);
  }
});

// GET /api/analytics/geography?startDate=7daysAgo&endDate=today
router.get('/geography', async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { startDate, endDate } = dateParams(req);
  const cacheKey = getCacheKey('geography', { startDate, endDate });
  const cached   = getFromCache(cacheKey);
  if (cached) return success(res, cached, true);

  try {
    const data = await runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'country' },
        { name: 'city' }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' }
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 50
    });
    setCache(cacheKey, data, CACHE_TTL_HISTORICAL_MS);
    return success(res, data);
  } catch (err) {
    return ga4Error(res, err);
  }
});

// GET /api/analytics/devices?startDate=7daysAgo&endDate=today
router.get('/devices', async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { startDate, endDate } = dateParams(req);
  const cacheKey = getCacheKey('devices', { startDate, endDate });
  const cached   = getFromCache(cacheKey);
  if (cached) return success(res, cached, true);

  try {
    const data = await runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'deviceCategory' },
        { name: 'browser' },
        { name: 'operatingSystem' }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' }
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }]
    });
    setCache(cacheKey, data, CACHE_TTL_HISTORICAL_MS);
    return success(res, data);
  } catch (err) {
    return ga4Error(res, err);
  }
});

// GET /api/analytics/acquisition?startDate=7daysAgo&endDate=today
router.get('/acquisition', async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { startDate, endDate } = dateParams(req);
  const cacheKey = getCacheKey('acquisition', { startDate, endDate });
  const cached   = getFromCache(cacheKey);
  if (cached) return success(res, cached, true);

  try {
    const data = await runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'sessionSourceMedium' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'engagedSessions' }
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
    });
    setCache(cacheKey, data, CACHE_TTL_HISTORICAL_MS);
    return success(res, data);
  } catch (err) {
    return ga4Error(res, err);
  }
});

// GET /api/analytics/ecommerce?startDate=7daysAgo&endDate=today
router.get('/ecommerce', async (req, res) => {
  if (!isConfigured()) return notConfigured(res);

  const { startDate, endDate } = dateParams(req);
  const cacheKey = getCacheKey('ecommerce', { startDate, endDate });
  const cached   = getFromCache(cacheKey);
  if (cached) return success(res, cached, true);

  try {
    const data = await runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'itemName' },
        { name: 'itemCategory' }
      ],
      metrics: [
        { name: 'ecommercePurchases' },
        { name: 'purchaseRevenue' },
        { name: 'addToCarts' },
        { name: 'checkouts' }
      ],
      orderBys: [{ metric: { metricName: 'purchaseRevenue' }, desc: true }],
      limit: 50
    });
    setCache(cacheKey, data, CACHE_TTL_HISTORICAL_MS);
    return success(res, data);
  } catch (err) {
    // GA4 may return INVALID_ARGUMENT when ecommerce tracking is not set up
    // Treat it as a soft "not supported" rather than a hard error
    if (
      err.status === 'INVALID_ARGUMENT' ||
      (err.message && err.message.toLowerCase().includes('not support'))
    ) {
      return res.json({
        success: true,
        data: null,
        configured: true,
        note: 'Ecommerce tracking is not enabled or not supported for this GA4 property.',
        timestamp: new Date().toISOString()
      });
    }
    return ga4Error(res, err);
  }
});

export default router;
