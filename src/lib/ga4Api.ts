import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GA4ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | { code: number; message: string; status: string };
  configured?: boolean;
  cached?: boolean;
  timestamp?: string;
  message?: string;
}

export interface GA4StatusResponse {
  configured: boolean;
  propertyId: string;
  note: string;
}

export interface GA4DimensionValue {
  value: string;
}

export interface GA4MetricValue {
  value: string;
}

export interface GA4Row {
  dimensionValues: GA4DimensionValue[];
  metricValues: GA4MetricValue[];
}

export interface GA4ReportResponse {
  rows?: GA4Row[];
  rowCount?: number;
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type?: string }>;
  totals?: GA4Row[];
  metadata?: Record<string, unknown>;
  reports?: GA4ReportResponse[];
}

export interface GA4BatchResponse {
  reports?: GA4ReportResponse[];
}

export type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'last28' | 'last90';

export interface DateRange {
  startDate: string;
  endDate: string;
}

// ─── Date Range Presets ───────────────────────────────────────────────────────

export const DATE_RANGE_PRESETS: Record<DateRangePreset, DateRange> = {
  today: { startDate: 'today', endDate: 'today' },
  yesterday: { startDate: 'yesterday', endDate: 'yesterday' },
  last7: { startDate: '7daysAgo', endDate: 'today' },
  last28: { startDate: '28daysAgo', endDate: 'today' },
  last90: { startDate: '90daysAgo', endDate: 'today' },
};

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 Days',
  last28: 'Last 28 Days',
  last90: 'Last 90 Days',
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  let token: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch (e) {}

  if (!token) {
    try {
      const rawAdminInfo = localStorage.getItem('admin_info');
      if (rawAdminInfo) {
        const parsed = JSON.parse(rawAdminInfo);
        token = parsed?.token;
      }
    } catch (e) {}
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  headers['x-admin-role'] = 'admin';
  return headers;
}

// ─── Core Fetcher ─────────────────────────────────────────────────────────────

async function fetchGA4<T = unknown>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<GA4ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders();
    const qs = new URLSearchParams(params).toString();
    const url = `/api/analytics/${endpoint}${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers });
    const json = await res.json() as GA4ApiResponse<T>;
    return json;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message, configured: undefined };
  }
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function checkGA4Status(): Promise<GA4ApiResponse<GA4StatusResponse>> {
  return fetchGA4<GA4StatusResponse>('status');
}

export async function fetchRealtime(): Promise<GA4ApiResponse<GA4ReportResponse>> {
  return fetchGA4<GA4ReportResponse>('realtime');
}

export async function fetchOverview(
  dateRange: DateRange
): Promise<GA4ApiResponse<GA4ReportResponse>> {
  return fetchGA4<GA4ReportResponse>('overview', {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
}

export async function fetchTraffic(
  dateRange: DateRange
): Promise<GA4ApiResponse<GA4ReportResponse>> {
  return fetchGA4<GA4ReportResponse>('traffic', {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
}

export async function fetchPages(
  dateRange: DateRange,
  limit = 20
): Promise<GA4ApiResponse<GA4ReportResponse>> {
  return fetchGA4<GA4ReportResponse>('pages', {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit: String(limit),
  });
}

export async function fetchGeography(
  dateRange: DateRange
): Promise<GA4ApiResponse<GA4ReportResponse>> {
  return fetchGA4<GA4ReportResponse>('geography', {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
}

export async function fetchDevices(
  dateRange: DateRange
): Promise<GA4ApiResponse<GA4ReportResponse>> {
  return fetchGA4<GA4ReportResponse>('devices', {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
}

export async function fetchAcquisition(
  dateRange: DateRange
): Promise<GA4ApiResponse<GA4ReportResponse>> {
  return fetchGA4<GA4ReportResponse>('acquisition', {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
}

export async function fetchEcommerce(
  dateRange: DateRange
): Promise<GA4ApiResponse<GA4ReportResponse>> {
  return fetchGA4<GA4ReportResponse>('ecommerce', {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
}
