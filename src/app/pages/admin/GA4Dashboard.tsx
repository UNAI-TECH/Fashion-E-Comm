import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { RefreshCw, AlertCircle, Settings, Globe, Monitor, Smartphone, Tablet, BarChart2, ShoppingBag } from 'lucide-react';
import {
  checkGA4Status,
  fetchRealtime,
  fetchOverview,
  fetchTraffic,
  fetchPages,
  fetchGeography,
  fetchDevices,
  fetchAcquisition,
  fetchEcommerce,
  DATE_RANGE_PRESETS,
  DATE_RANGE_LABELS,
  type DateRangePreset,
  type DateRange,
  type GA4Row,
  type GA4ReportResponse,
  type GA4ApiResponse,
} from '../../../lib/ga4Api';

// ─── Utility helpers ──────────────────────────────────────────────────────────

function toIST(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }) + ' IST';
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function safeNum(val: string | undefined): number {
  const n = parseFloat(val ?? '0');
  return isNaN(n) ? 0 : n;
}

function formatGA4Date(raw: string): string {
  // "YYYYMMDD" → "DD MMM"
  if (raw.length !== 8) return raw;
  const y = parseInt(raw.slice(0, 4), 10);
  const m = parseInt(raw.slice(4, 6), 10) - 1;
  const d = parseInt(raw.slice(6, 8), 10);
  return new Date(y, m, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ─── Error card ───────────────────────────────────────────────────────────────

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-800">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Async state type ─────────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initialState<T>(): AsyncState<T> {
  return { data: null, loading: false, error: null };
}

function loadingState<T>(): AsyncState<T> {
  return { data: null, loading: true, error: null };
}

function doneState<T>(data: T): AsyncState<T> {
  return { data, loading: false, error: null };
}

function errState<T>(error: string): AsyncState<T> {
  return { data: null, loading: false, error };
}

function extractError(res: GA4ApiResponse): string {
  if (typeof res.error === 'string') return res.error;
  if (res.error && typeof res.error === 'object') return res.error.message;
  if (res.message) return res.message;
  return 'Unknown error';
}

// ─── Realtime data types ──────────────────────────────────────────────────────

interface RealtimeState {
  data: GA4ReportResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ─── Pie chart colors ─────────────────────────────────────────────────────────

const COLORS = ['#698156', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#10b981'];

// ─── GA4 parsing helpers ──────────────────────────────────────────────────────

function getMetricValue(report: GA4ReportResponse | undefined, metricName: string, fallbackIdx: number): string {
  if (!report?.rows || report.rows.length === 0) return '0';
  const headers = report.metricHeaders ?? [];
  const idx = headers.findIndex(h => h.name === metricName);
  const actualIdx = idx !== -1 ? idx : fallbackIdx;
  return report.rows[0]?.metricValues?.[actualIdx]?.value ?? '0';
}

function parseRealtimeActiveUsers(rows: GA4Row[] | undefined): number {
  if (!rows || rows.length === 0) return 0;
  let total = 0;
  for (const row of rows) {
    total += safeNum(row.metricValues?.[0]?.value);
  }
  return total;
}

interface RealtimeCountry {
  country: string;
  users: number;
}

function parseRealtimeByCountry(rows: GA4Row[] | undefined): RealtimeCountry[] {
  if (!rows) return [];
  const map = new Map<string, number>();
  for (const row of rows) {
    const country = row.dimensionValues?.[1]?.value ?? 'Unknown';
    const users = safeNum(row.metricValues?.[0]?.value);
    map.set(country, (map.get(country) ?? 0) + users);
  }
  return Array.from(map.entries())
    .map(([country, users]) => ({ country, users }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 5);
}

interface RealtimeDevice {
  device: string;
  users: number;
}

function parseRealtimeByDevice(rows: GA4Row[] | undefined): RealtimeDevice[] {
  if (!rows) return [];
  const map = new Map<string, number>();
  for (const row of rows) {
    const device = row.dimensionValues?.[2]?.value ?? 'Unknown';
    const users = safeNum(row.metricValues?.[0]?.value);
    map.set(device, (map.get(device) ?? 0) + users);
  }
  return Array.from(map.entries()).map(([device, users]) => ({ device, users }));
}

interface TrafficChartPoint {
  date: string;
  totalUsers: number;
  sessions: number;
  pageViews: number;
}

function parseTrafficChart(report: GA4ReportResponse | undefined): TrafficChartPoint[] {
  if (!report?.rows) return [];
  const headers = report.metricHeaders ?? [];
  const sessionsIdx = headers.findIndex(h => h.name === 'sessions');
  const usersIdx = headers.findIndex(h => h.name === 'totalUsers');
  const viewsIdx = headers.findIndex(h => h.name === 'screenPageViews');

  const sIdx = sessionsIdx !== -1 ? sessionsIdx : 0;
  const uIdx = usersIdx !== -1 ? usersIdx : 1;
  const vIdx = viewsIdx !== -1 ? viewsIdx : 2;

  return report.rows.map(row => ({
    date: formatGA4Date(row.dimensionValues?.[0]?.value ?? ''),
    totalUsers: safeNum(row.metricValues?.[uIdx]?.value),
    sessions: safeNum(row.metricValues?.[sIdx]?.value),
    pageViews: safeNum(row.metricValues?.[vIdx]?.value),
  }));
}

interface PageRow {
  title: string;
  path: string;
  views: number;
  users: number;
  avgDuration: number;
}

function parsePages(rows: GA4Row[] | undefined): PageRow[] {
  if (!rows) return [];
  return rows.map(row => ({
    title: row.dimensionValues?.[0]?.value ?? '—',
    path: row.dimensionValues?.[1]?.value ?? '—',
    views: safeNum(row.metricValues?.[0]?.value),
    users: safeNum(row.metricValues?.[1]?.value),
    avgDuration: safeNum(row.metricValues?.[2]?.value),
  }));
}

interface GeoCountry {
  country: string;
  users: number;
  sessions: number;
}

interface GeoCity {
  city: string;
  users: number;
  sessions: number;
}

function parseGeo(rows: GA4Row[] | undefined): { countries: GeoCountry[]; cities: GeoCity[] } {
  if (!rows) return { countries: [], cities: [] };
  const countryMap = new Map<string, { users: number; sessions: number }>();
  const cityMap = new Map<string, { users: number; sessions: number }>();
  for (const row of rows) {
    const country = row.dimensionValues?.[0]?.value ?? 'Unknown';
    const city = row.dimensionValues?.[1]?.value ?? 'Unknown';
    const users = safeNum(row.metricValues?.[0]?.value);
    const sessions = safeNum(row.metricValues?.[1]?.value);
    const existing = countryMap.get(country) ?? { users: 0, sessions: 0 };
    countryMap.set(country, { users: existing.users + users, sessions: existing.sessions + sessions });
    const existingCity = cityMap.get(city) ?? { users: 0, sessions: 0 };
    cityMap.set(city, { users: existingCity.users + users, sessions: existingCity.sessions + sessions });
  }
  return {
    countries: Array.from(countryMap.entries()).map(([country, v]) => ({ country, ...v })).sort((a, b) => b.users - a.users).slice(0, 10),
    cities: Array.from(cityMap.entries()).map(([city, v]) => ({ city, ...v })).sort((a, b) => b.users - a.users).slice(0, 10),
  };
}

interface DeviceChartItem {
  name: string;
  value: number;
}

function parseDevices(rows: GA4Row[] | undefined): {
  deviceTypes: DeviceChartItem[];
  browsers: DeviceChartItem[];
  operatingSystems: DeviceChartItem[];
} {
  if (!rows) return { deviceTypes: [], browsers: [], operatingSystems: [] };
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();
  for (const row of rows) {
    const device = row.dimensionValues?.[0]?.value ?? 'Unknown';
    const browser = row.dimensionValues?.[1]?.value ?? 'Unknown';
    const os = row.dimensionValues?.[2]?.value ?? 'Unknown';
    const users = safeNum(row.metricValues?.[0]?.value);
    deviceMap.set(device, (deviceMap.get(device) ?? 0) + users);
    browserMap.set(browser, (browserMap.get(browser) ?? 0) + users);
    osMap.set(os, (osMap.get(os) ?? 0) + users);
  }
  const toArr = (m: Map<string, number>) =>
    Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  return { deviceTypes: toArr(deviceMap), browsers: toArr(browserMap), operatingSystems: toArr(osMap) };
}

interface AcquisitionRow {
  channel: string;
  sessions: number;
  users: number;
  newUsers: number;
  engagedSessions: number;
}

function parseAcquisition(rows: GA4Row[] | undefined): AcquisitionRow[] {
  if (!rows) return [];
  const map = new Map<string, AcquisitionRow>();
  for (const row of rows) {
    const channel = row.dimensionValues?.[0]?.value ?? 'Unknown';
    const sessions = safeNum(row.metricValues?.[0]?.value);
    const users = safeNum(row.metricValues?.[1]?.value);
    const newUsers = safeNum(row.metricValues?.[2]?.value);
    const engagedSessions = safeNum(row.metricValues?.[3]?.value);
    const existing = map.get(channel);
    if (existing) {
      existing.sessions += sessions;
      existing.users += users;
      existing.newUsers += newUsers;
      existing.engagedSessions += engagedSessions;
    } else {
      map.set(channel, { channel, sessions, users, newUsers, engagedSessions });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.sessions - a.sessions);
}

// ─── Sub-tab types ────────────────────────────────────────────────────────────

type DetailTab = 'pages' | 'geography' | 'devices' | 'acquisition' | 'ecommerce';

// ─── Device icon helper ───────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: string }) {
  const d = device.toLowerCase();
  if (d.includes('mobile')) return <Smartphone className="w-3.5 h-3.5" />;
  if (d.includes('tablet')) return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GA4Dashboard() {
  // ── Status
  const [ga4Status, setGa4Status] = useState<{ configured: boolean; loading: boolean }>({
    configured: false,
    loading: true,
  });

  // ── Date range
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('last7');
  const dateRange: DateRange = DATE_RANGE_PRESETS[dateRangePreset];

  // ── Data states
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });
  const [overviewState, setOverviewState] = useState<AsyncState<GA4ReportResponse>>(initialState());
  const [trafficState, setTrafficState] = useState<AsyncState<GA4ReportResponse>>(initialState());
  const [pagesState, setPagesState] = useState<AsyncState<GA4ReportResponse>>(initialState());
  const [geoState, setGeoState] = useState<AsyncState<GA4ReportResponse>>(initialState());
  const [deviceState, setDeviceState] = useState<AsyncState<GA4ReportResponse>>(initialState());
  const [acquisitionState, setAcquisitionState] = useState<AsyncState<GA4ReportResponse>>(initialState());
  const [ecommerceState, setEcommerceState] = useState<AsyncState<GA4ReportResponse>>(initialState());

  // ── Detail sub-tab
  const [detailTab, setDetailTab] = useState<DetailTab>('pages');

  // ── Realtime interval ref
  const realtimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load realtime
  const loadRealtime = useCallback(async () => {
    setRealtimeState(prev => ({ ...prev, loading: true, error: null }));
    const res = await fetchRealtime();
    if (res.success && res.data) {
      setRealtimeState({ data: res.data, loading: false, error: null, lastUpdated: new Date() });
    } else {
      setRealtimeState(prev => ({
        ...prev,
        loading: false,
        error: extractError(res),
        lastUpdated: new Date(),
      }));
    }
  }, []);

  // ── Load historical data
  const loadHistoricalData = useCallback(async (dr: DateRange) => {
    // Kick off all in parallel
    setOverviewState(loadingState());
    setTrafficState(loadingState());
    setPagesState(loadingState());
    setGeoState(loadingState());
    setDeviceState(loadingState());
    setAcquisitionState(loadingState());
    setEcommerceState(loadingState());

    const [overviewRes, trafficRes, pagesRes, geoRes, devicesRes, acquisitionRes, ecommerceRes] =
      await Promise.all([
        fetchOverview(dr),
        fetchTraffic(dr),
        fetchPages(dr),
        fetchGeography(dr),
        fetchDevices(dr),
        fetchAcquisition(dr),
        fetchEcommerce(dr),
      ]);

    setOverviewState(overviewRes.success && overviewRes.data ? doneState(overviewRes.data) : errState(extractError(overviewRes)));
    setTrafficState(trafficRes.success && trafficRes.data ? doneState(trafficRes.data) : errState(extractError(trafficRes)));
    setPagesState(pagesRes.success && pagesRes.data ? doneState(pagesRes.data) : errState(extractError(pagesRes)));
    setGeoState(geoRes.success && geoRes.data ? doneState(geoRes.data) : errState(extractError(geoRes)));
    setDeviceState(devicesRes.success && devicesRes.data ? doneState(devicesRes.data) : errState(extractError(devicesRes)));
    setAcquisitionState(acquisitionRes.success && acquisitionRes.data ? doneState(acquisitionRes.data) : errState(extractError(acquisitionRes)));
    setEcommerceState(ecommerceRes.success && ecommerceRes.data ? doneState(ecommerceRes.data) : errState(extractError(ecommerceRes)));
  }, []);

  // ── Check status on mount
  const checkStatus = useCallback(async () => {
    setGa4Status({ configured: false, loading: true });
    const res = await checkGA4Status();
    const configured = res.success && (res.data?.configured ?? false);
    setGa4Status({ configured, loading: false });
    if (configured) {
      loadRealtime();
      loadHistoricalData(DATE_RANGE_PRESETS['last7']);
    }
  }, [loadRealtime, loadHistoricalData]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // ── Realtime interval
  useEffect(() => {
    if (!ga4Status.configured) return;
    realtimeIntervalRef.current = setInterval(() => {
      loadRealtime();
    }, 45000);
    return () => {
      if (realtimeIntervalRef.current) clearInterval(realtimeIntervalRef.current);
    };
  }, [ga4Status.configured, loadRealtime]);

  // ── Date range change
  const handleDateRangeChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    loadHistoricalData(DATE_RANGE_PRESETS[preset]);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Loading status
  // ─────────────────────────────────────────────────────────────────────────────

  if (ga4Status.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Not configured
  // ─────────────────────────────────────────────────────────────────────────────

  if (!ga4Status.configured) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">GA4 Service Account Not Configured</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              The backend GA4 service account credentials are missing. Follow the steps below to connect.
            </p>
          </div>
        </div>

        <ol className="space-y-3">
          {[
            {
              step: '1',
              title: 'Create a Google Cloud Service Account',
              body: 'In Google Cloud Console, create a service account with the Analytics Viewer role on GA4 property 561727316.',
            },
            {
              step: '2',
              title: 'Grant Viewer Access in GA4',
              body: 'Open GA4 Admin → Property Access Management → Add Users. Enter the service account email and assign the Viewer role.',
            },
            {
              step: '3',
              title: 'Download the JSON Key File',
              body: (
                <span>
                  Download the key file, then set these env vars in your server <code className="font-mono bg-gray-100 px-1 rounded text-xs">.env</code>:
                  <pre className="mt-2 p-3 bg-gray-50 rounded-xl text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">
{`GA4_PROPERTY_ID=561727316
GA4_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`}
                  </pre>
                </span>
              ),
            },
            {
              step: '4',
              title: 'Restart the Server',
              body: 'Restart your Node.js server to pick up the new environment variables, then click "Retry Connection" below.',
            },
          ].map(item => (
            <li key={item.step} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-[#698156] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <div className="text-xs text-gray-500 mt-0.5">{item.body}</div>
              </div>
            </li>
          ))}
        </ol>

        <button
          onClick={checkStatus}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#698156] hover:bg-[#586e48] rounded-xl transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Configured — full dashboard
  // ─────────────────────────────────────────────────────────────────────────────

  // Parse data for sub-sections
  const overviewReport: GA4ReportResponse | undefined =
    overviewState.data?.reports?.[0] ?? overviewState.data ?? undefined;
  const trafficPoints = parseTrafficChart(trafficState.data ?? undefined);
  const pages = parsePages(pagesState.data?.rows);
  const geo = parseGeo(geoState.data?.rows);
  const devices = parseDevices(deviceState.data?.rows);
  const acquisition = parseAcquisition(acquisitionState.data?.rows);
  const realtimeActiveUsers = parseRealtimeActiveUsers(realtimeState.data?.rows);
  const realtimeCountries = parseRealtimeByCountry(realtimeState.data?.rows);
  const realtimeDevices = parseRealtimeByDevice(realtimeState.data?.rows);
  const ecommerceRows = ecommerceState.data?.rows ?? [];

  return (
    <div className="space-y-6">

      {/* ── Section A: Date Range Selector ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Google Analytics 4 — Live Data Dashboard</h2>
            <p className="text-xs text-gray-500 mt-0.5">Property 561727316 · G-CR84KB4TS4</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(DATE_RANGE_PRESETS) as DateRangePreset[]).map(preset => (
              <button
                key={preset}
                onClick={() => handleDateRangeChange(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateRangePreset === preset
                    ? 'bg-[#698156] text-white shadow-sm'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {DATE_RANGE_LABELS[preset]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section B: Live Visitors (Realtime) ────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE
            </span>
            <h3 className="text-sm font-bold text-gray-900">Active Visitors (Last 30 min)</h3>
          </div>
          <div className="flex items-center gap-2">
            {realtimeState.lastUpdated && (
              <span className="text-[11px] text-gray-400 font-mono hidden sm:block">
                Updated {toIST(realtimeState.lastUpdated)}
              </span>
            )}
            <button
              onClick={loadRealtime}
              disabled={realtimeState.loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${realtimeState.loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {realtimeState.error ? (
          <ErrorCard message={`Realtime data unavailable — ${realtimeState.error}`} onRetry={loadRealtime} />
        ) : realtimeState.loading && !realtimeState.data ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Active Users */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-bold text-emerald-700">{realtimeActiveUsers}</div>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Active Users</p>
              <p className="text-[11px] text-emerald-500 mt-0.5">on site right now</p>
            </div>

            {/* By Country */}
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#698156]" /> By Country
              </p>
              {realtimeCountries.length === 0 ? (
                <p className="text-xs text-gray-400">No data</p>
              ) : (
                <div className="space-y-1.5">
                  {realtimeCountries.map(c => (
                    <div key={c.country} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate">{c.country}</span>
                      <span className="font-bold text-gray-900 ml-2">{c.users}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Device */}
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[#698156]" /> By Device
              </p>
              {realtimeDevices.length === 0 ? (
                <p className="text-xs text-gray-400">No data</p>
              ) : (
                <div className="space-y-1.5">
                  {realtimeDevices.map(d => (
                    <div key={d.device} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <DeviceIcon device={d.device} />
                        {d.device}
                      </span>
                      <span className="font-bold text-gray-900">{d.users}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Section C: Overview KPI Cards ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          Overview — {DATE_RANGE_LABELS[dateRangePreset]}
        </h3>
        {overviewState.error ? (
          <ErrorCard
            message={overviewState.error}
            onRetry={() => loadHistoricalData(dateRange)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total Users', metricName: 'totalUsers', fallbackIdx: 1, format: (v: string) => parseInt(v, 10).toLocaleString('en-IN') },
              { label: 'Active Users', metricName: 'activeUsers', fallbackIdx: 3, format: (v: string) => parseInt(v, 10).toLocaleString('en-IN') },
              { label: 'New Users', metricName: 'newUsers', fallbackIdx: 2, format: (v: string) => parseInt(v, 10).toLocaleString('en-IN') },
              { label: 'Total Sessions', metricName: 'sessions', fallbackIdx: 0, format: (v: string) => parseInt(v, 10).toLocaleString('en-IN') },
              { label: 'Page Views', metricName: 'screenPageViews', fallbackIdx: 4, format: (v: string) => parseInt(v, 10).toLocaleString('en-IN') },
              { label: 'Engaged Sessions', metricName: 'engagedSessions', fallbackIdx: 5, format: (v: string) => parseInt(v, 10).toLocaleString('en-IN') },
              { label: 'Engagement Rate', metricName: 'engagementRate', fallbackIdx: 6, format: (v: string) => formatPct(safeNum(v)) },
              { label: 'Avg Session Duration', metricName: 'averageSessionDuration', fallbackIdx: 7, format: (v: string) => formatDuration(safeNum(v)) },
              { label: 'Bounce Rate', metricName: 'bounceRate', fallbackIdx: 8, format: (v: string) => formatPct(safeNum(v)) },
              { label: 'Event Count', metricName: 'eventCount', fallbackIdx: 9, format: (v: string) => parseInt(v, 10).toLocaleString('en-IN') },
            ].map((metric) => {
              const rawValue = getMetricValue(overviewReport, metric.metricName, metric.fallbackIdx);
              return (
                <div key={metric.label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col gap-1">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                    {metric.label}
                  </p>
                  {overviewState.loading ? (
                    <Skeleton className="h-6 w-20 mt-1" />
                  ) : (
                    <p className="text-xl font-bold text-gray-900">
                      {metric.format(rawValue)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section D: Traffic Chart ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          Traffic Over Time — {DATE_RANGE_LABELS[dateRangePreset]}
        </h3>
        <p className="text-xs text-gray-400 mb-4">Daily breakdown of users, sessions, and page views</p>

        {trafficState.error ? (
          <ErrorCard message={trafficState.error} onRetry={() => loadHistoricalData(dateRange)} />
        ) : trafficState.loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : trafficPoints.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No data available for this date range</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trafficPoints} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="totalUsers"
                name="Users"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="#698156"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pageViews"
                name="Page Views"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Section E: Detail Sub-tabs ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Sub-tab bar */}
        <div className="flex items-center gap-1 p-3 border-b border-gray-100 overflow-x-auto scrollbar-none">
          {(
            [
              { key: 'pages', label: 'Pages' },
              { key: 'geography', label: 'Geography' },
              { key: 'devices', label: 'Devices' },
              { key: 'acquisition', label: 'Acquisition' },
              { key: 'ecommerce', label: 'E-commerce' },
            ] as Array<{ key: DetailTab; label: string }>
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setDetailTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                detailTab === tab.key
                  ? 'bg-[#698156] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* Pages */}
          {detailTab === 'pages' && (
            <>
              {pagesState.error ? (
                <ErrorCard message={pagesState.error} onRetry={() => loadHistoricalData(dateRange)} />
              ) : pagesState.loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
                </div>
              ) : pages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No data available for this date range</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-gray-700">
                    <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      <tr>
                        <th className="p-3 text-left">Page Title</th>
                        <th className="p-3 text-left">Path</th>
                        <th className="p-3 text-right">Views</th>
                        <th className="p-3 text-right">Users</th>
                        <th className="p-3 text-right">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pages.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-3 font-medium text-gray-900 max-w-[200px] truncate">{p.title}</td>
                          <td className="p-3 font-mono text-gray-500 max-w-[180px] truncate">{p.path}</td>
                          <td className="p-3 text-right font-bold text-gray-900">{p.views.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-gray-700">{p.users.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-gray-500">{formatDuration(p.avgDuration)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Geography */}
          {detailTab === 'geography' && (
            <>
              {geoState.error ? (
                <ErrorCard message={geoState.error} onRetry={() => loadHistoricalData(dateRange)} />
              ) : geoState.loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-48 rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Countries */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#698156]" /> Top Countries
                    </h4>
                    {geo.countries.length === 0 ? (
                      <p className="text-xs text-gray-400">No data</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="text-[10px] text-gray-400 uppercase font-bold">
                          <tr>
                            <th className="pb-2 text-left">Country</th>
                            <th className="pb-2 text-right">Users</th>
                            <th className="pb-2 text-right">Sessions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {geo.countries.map((c, i) => (
                            <tr key={i}>
                              <td className="py-2 text-gray-800">{c.country}</td>
                              <td className="py-2 text-right font-bold text-gray-900">{c.users.toLocaleString('en-IN')}</td>
                              <td className="py-2 text-right text-gray-500">{c.sessions.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {/* Cities */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-[#698156]" /> Top Cities
                    </h4>
                    {geo.cities.length === 0 ? (
                      <p className="text-xs text-gray-400">No data</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="text-[10px] text-gray-400 uppercase font-bold">
                          <tr>
                            <th className="pb-2 text-left">City</th>
                            <th className="pb-2 text-right">Users</th>
                            <th className="pb-2 text-right">Sessions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {geo.cities.map((c, i) => (
                            <tr key={i}>
                              <td className="py-2 text-gray-800">{c.city}</td>
                              <td className="py-2 text-right font-bold text-gray-900">{c.users.toLocaleString('en-IN')}</td>
                              <td className="py-2 text-right text-gray-500">{c.sessions.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Devices */}
          {detailTab === 'devices' && (
            <>
              {deviceState.error ? (
                <ErrorCard message={deviceState.error} onRetry={() => loadHistoricalData(dateRange)} />
              ) : deviceState.loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Device Type', data: devices.deviceTypes },
                    { label: 'Browser', data: devices.browsers },
                    { label: 'Operating System', data: devices.operatingSystems },
                  ].map(chart => (
                    <div key={chart.label}>
                      <h4 className="text-xs font-bold text-gray-700 mb-3">{chart.label}</h4>
                      {chart.data.length === 0 ? (
                        <p className="text-xs text-gray-400">No data</p>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie
                                data={chart.data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={65}
                                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                labelLine={false}
                                fontSize={10}
                              >
                                {chart.data.map((_, idx) => (
                                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="space-y-1 mt-2">
                            {chart.data.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                  />
                                  <span className="text-gray-700 truncate">{item.name}</span>
                                </span>
                                <span className="font-bold text-gray-900 ml-2">{item.value.toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Acquisition */}
          {detailTab === 'acquisition' && (
            <>
              {acquisitionState.error ? (
                <ErrorCard message={acquisitionState.error} onRetry={() => loadHistoricalData(dateRange)} />
              ) : acquisitionState.loading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : acquisition.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No data available for this date range</p>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={acquisition.slice(0, 8)} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="channel" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="sessions" name="Sessions" fill="#698156" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-gray-700">
                      <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        <tr>
                          <th className="p-3 text-left">Channel</th>
                          <th className="p-3 text-right">Sessions</th>
                          <th className="p-3 text-right">Users</th>
                          <th className="p-3 text-right">New Users</th>
                          <th className="p-3 text-right">Engaged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {acquisition.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                            <td className="p-3 font-medium text-gray-900">{row.channel}</td>
                            <td className="p-3 text-right font-bold text-gray-900">{row.sessions.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-gray-700">{row.users.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-gray-500">{row.newUsers.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-gray-500">{row.engagedSessions.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* E-commerce */}
          {detailTab === 'ecommerce' && (
            <>
              {ecommerceState.error ? (
                <ErrorCard message={ecommerceState.error} onRetry={() => loadHistoricalData(dateRange)} />
              ) : ecommerceState.loading ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : ecommerceRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-800">E-commerce tracking not fully configured</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      No purchase or add-to-cart data returned from GA4. Ensure e-commerce events (purchase, add_to_cart) are firing and Enhanced Ecommerce is enabled in your GA4 property.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-gray-700">
                    <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      <tr>
                        <th className="p-3 text-left">Item Name</th>
                        <th className="p-3 text-left">Category</th>
                        <th className="p-3 text-right">Purchases</th>
                        <th className="p-3 text-right">Revenue (₹)</th>
                        <th className="p-3 text-right">Add to Cart</th>
                        <th className="p-3 text-right">Checkouts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ecommerceRows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-3 font-medium text-gray-900 max-w-[180px] truncate">
                            {row.dimensionValues?.[0]?.value ?? '—'}
                          </td>
                          <td className="p-3 text-gray-500">
                            {row.dimensionValues?.[1]?.value ?? '—'}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            {safeNum(row.metricValues?.[0]?.value).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-bold text-[#698156]">
                            ₹{safeNum(row.metricValues?.[1]?.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            {safeNum(row.metricValues?.[2]?.value).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            {safeNum(row.metricValues?.[3]?.value).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
