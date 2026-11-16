import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Eye,
  ShoppingBag,
  LogIn,
  Activity,
  Smartphone,
  Laptop,
  Globe,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  CreditCard,
  Compass,
  Filter,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
  BarChart2,
  TrendingUp,
  MousePointerClick
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  RealAnalyticsEvent,
  getStoredEvents,
  clearAnalyticsLog,
  fetchPureRealAnalytics,
  GA_MEASUREMENT_ID
} from '../../../lib/analytics';
import { toast } from 'sonner';

type AnalyticsTab = 'all' | 'signins' | 'visitors' | 'pageviews' | 'product_clicks' | 'registered_users' | 'google_analytics';

export function AdminAnalytics() {
  const [events, setEvents] = useState<RealAnalyticsEvent[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load all real data from local log + Supabase
  const loadRealData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await fetchPureRealAnalytics();
      setEvents(data.events || []);
      setProfiles(data.profiles || []);
      setPayments(data.payments || []);
      setOrders(data.orders || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load real analytics:', err);
      toast.error('Failed to load real analytics data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRealData(true);

    // 1. Listen for local custom events (same window)
    const handleLocalEvent = (e: any) => {
      if (e.detail) {
        setEvents(prev => [e.detail, ...prev.filter(x => x.id !== e.detail.id)].slice(0, 500));
        setLastUpdated(new Date());
      } else {
        // Cleared
        setEvents([]);
      }
    };
    window.addEventListener('aanya:real_analytics_event', handleLocalEvent);

    // 2. Real-time Supabase Broadcast channel across all devices & sessions
    // Ensure any existing channel with this topic is cleaned up first
    const existing = supabase.getChannels().find(c => c.topic === 'realtime:aanya-live-analytics-stream');
    if (existing) {
      supabase.removeChannel(existing);
    }

    const liveChannel = supabase.channel('aanya-live-analytics-stream', {
      config: { broadcast: { self: true } }
    });

    liveChannel
      .on('broadcast', { event: 'real_analytics_event' }, ({ payload }) => {
        if (payload) {
          setEvents(prev => [payload, ...prev.filter(x => x.id !== payload.id)].slice(0, 500));
          setLastUpdated(new Date());
        }
      })
      .subscribe();

    // 3. PostgreSQL database changes on profiles, payments, and orders
    const dbChannel = supabase
      .channel('admin-analytics-db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadRealData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadRealData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadRealData(false);
      })
      .subscribe();

    // 4. Auto-refresh every 10 seconds for crisp real-time synchronization
    const interval = setInterval(() => {
      loadRealData(false);
    }, 10000);

    return () => {
      window.removeEventListener('aanya:real_analytics_event', handleLocalEvent);
      clearInterval(interval);
      supabase.removeChannel(liveChannel);
      supabase.removeChannel(dbChannel);
    };
  }, []);

  // Filter events based on active subtab, search query, and device
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // 1. Tab filter
      if (activeTab === 'signins' && e.type !== 'signin') return false;
      if (activeTab === 'visitors' && e.type !== 'visit') return false;
      if (activeTab === 'pageviews' && e.type !== 'pageview') return false;
      if (activeTab === 'product_clicks' && e.type !== 'product_click') return false;

      // 2. Device filter
      if (deviceFilter !== 'all' && e.client?.device?.toLowerCase() !== deviceFilter.toLowerCase()) {
        return false;
      }

      // 3. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const userName = (e.user?.name || '').toLowerCase();
      const userEmail = (e.user?.email || '').toLowerCase();
      const userPhone = (e.user?.phone || '').toLowerCase();
      const path = (e.details?.path || '').toLowerCase();
      const pageTitle = (e.details?.pageTitle || '').toLowerCase();
      const prodName = (e.details?.productName || '').toLowerCase();
      const prodCat = (e.details?.productCategory || '').toLowerCase();

      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        userPhone.includes(q) ||
        path.includes(q) ||
        pageTitle.includes(q) ||
        prodName.includes(q) ||
        prodCat.includes(q)
      );
    });
  }, [events, activeTab, searchQuery, deviceFilter]);

  // Specific event slices
  const signinEvents = useMemo(() => events.filter(e => e.type === 'signin'), [events]);
  const visitEvents = useMemo(() => events.filter(e => e.type === 'visit'), [events]);
  const pageviewEvents = useMemo(() => events.filter(e => e.type === 'pageview'), [events]);
  const productClickEvents = useMemo(() => events.filter(e => e.type === 'product_click'), [events]);

  // Product click aggregate ranking from pure real data
  const productClickRankings = useMemo(() => {
    const map = new Map<string, { id: string; name: string; category: string; price: number; image?: string; clicks: number; lastClicked: string }>();
    productClickEvents.forEach(e => {
      const pId = e.details?.productId || e.details?.productName || 'unknown';
      if (!map.has(pId)) {
        map.set(pId, {
          id: pId,
          name: e.details?.productName || 'Unnamed Product',
          category: e.details?.productCategory || 'Apparel',
          price: e.details?.productPrice || 0,
          image: e.details?.productImage,
          clicks: 0,
          lastClicked: e.timestamp,
        });
      }
      const item = map.get(pId)!;
      item.clicks += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.clicks - a.clicks);
  }, [productClickEvents]);

  // Page view aggregate ranking from pure real data
  const pageViewRankings = useMemo(() => {
    const map = new Map<string, { path: string; title: string; count: number; lastViewed: string }>();
    pageviewEvents.forEach(e => {
      const p = e.details?.path || '/';
      if (!map.has(p)) {
        map.set(p, {
          path: p,
          title: e.details?.pageTitle || p,
          count: 0,
          lastViewed: e.timestamp,
        });
      }
      const item = map.get(p)!;
      item.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [pageviewEvents]);

  // Total verified collected revenue from real payments
  const totalVerifiedRevenue = useMemo(() => {
    return payments
      .filter(p => p.status === 'Paid' || p.status === 'Completed' || p.status === 'success')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  // Real active visitors in the last 15 minutes (minimum 1 for current admin session)
  const activeRecentVisitorsCount = useMemo(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    const recentSessionIds = new Set<string>();
    events.forEach(e => {
      if (e.rawTime && e.rawTime >= cutoff && e.client?.sessionId) {
        recentSessionIds.add(e.client.sessionId);
      }
    });
    return Math.max(1, recentSessionIds.size);
  }, [events]);

  // Export pure real data to Excel CSV
  const handleExportCSV = () => {
    try {
      const records = filteredEvents.length > 0 ? filteredEvents : events;
      if (records.length === 0 && profiles.length === 0) {
        toast.error('No analytics events recorded yet to export');
        return;
      }

      const headers = [
        'Event ID',
        'Event Type',
        'Timestamp',
        'Customer / Visitor Name',
        'Email Address',
        'Phone Number',
        'User Role',
        'Is Authenticated',
        'Device',
        'Browser',
        'Traffic Source',
        'Referrer URL',
        'Page Path Opened',
        'Page Title',
        'Product Name Clicked',
        'Product Category',
        'Product Price (INR)',
        'Session ID'
      ];

      const csvRows = records.map(e => [
        e.id,
        e.type.toUpperCase(),
        e.timestamp,
        e.user?.name || 'Guest Visitor',
        e.user?.email || '—',
        e.user?.phone || '—',
        e.user?.role || 'guest',
        e.user?.isAuthenticated ? 'YES' : 'NO',
        e.client?.device || '—',
        e.client?.browser || '—',
        e.client?.trafficSource || 'Direct',
        e.client?.referrer || '—',
        e.details?.path || '—',
        e.details?.pageTitle || '—',
        e.details?.productName || '—',
        e.details?.productCategory || '—',
        e.details?.productPrice !== undefined ? e.details.productPrice : '—',
        e.client?.sessionId || '—'
      ]);

      const csvContent = '\uFEFF' + [
        headers.join(','),
        ...csvRows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Aanya_Fashions_Real_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${records.length} real analytics records to Excel!`);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to export real analytics');
    }
  };

  const handleClearLog = () => {
    if (confirm('Are you sure you want to clear the local activity log? Database records will remain intact.')) {
      clearAnalyticsLog();
      setEvents([]);
      toast.success('Local activity log cleared.');
    }
  };

  const getEventBadge = (type: AnalyticsEventType) => {
    switch (type) {
      case 'signin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <LogIn className="w-3 h-3 text-purple-600" />
            Sign In
          </span>
        );
      case 'visit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Globe className="w-3 h-3 text-blue-600" />
            Site Visit
          </span>
        );
      case 'pageview':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Eye className="w-3 h-3 text-teal-600" />
            Page Open
          </span>
        );
      case 'product_click':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Tag className="w-3 h-3 text-emerald-600" />
            Product Click
          </span>
        );
      case 'cart_add':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ShoppingBag className="w-3 h-3 text-amber-600" />
            Add To Cart
          </span>
        );
      case 'checkout':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <CreditCard className="w-3 h-3 text-orange-600" />
            Checkout
          </span>
        );
      case 'purchase':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Purchase
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {type}
          </span>
        );
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device?.toLowerCase() === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-[#698156]" />;
    return <Laptop className="w-3.5 h-3.5 text-blue-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Real-Time Website Analytics</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Real-Time Stream
            </span>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              Zero Mock Data
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Live audit of who signs in, who opens the website, which pages they browse, and what products they click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#698156] hover:bg-[#586e48] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Download full analytics data to Excel CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>

          <button
            onClick={() => loadRealData(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#698156]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleClearLog}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
            title="Clear local event logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* ─── 6 Authoritative Real-Time KPI Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Active Visitors Now */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Active Visitors</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{activeRecentVisitorsCount}</div>
          <p className="text-[10px] text-emerald-700/80 mt-0.5">Online right now</p>
        </div>

        {/* Real User Sign-Ins */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-purple-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Sign-Ins Logged</span>
            <LogIn className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700">{signinEvents.length}</div>
          <p className="text-[10px] text-purple-600/80 mt-0.5">Authenticated sessions</p>
        </div>

        {/* Registered DB Profiles */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-blue-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700">{profiles.length}</div>
          <p className="text-[10px] text-blue-600/80 mt-0.5">Real DB accounts</p>
        </div>

        {/* Page Views Logged */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pages Opened</span>
            <Eye className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{pageviewEvents.length}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Route views recorded</p>
        </div>

        {/* Product Clicks Logged */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Products Clicked</span>
            <Tag className="w-4 h-4 text-[#698156]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#698156]">{productClickEvents.length}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Customer clicks</p>
        </div>

        {/* Real Payments Collected */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Real Revenue</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900">₹{totalVerifiedRevenue.toLocaleString('en-IN')}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">{payments.length} verified transactions</p>
        </div>
      </div>

      {/* ─── Navigation Tabs & Filters Bar ─── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
        {/* Navigation Tabs Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-[#698156] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All Live Events ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('signins')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'signins'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Who Signed In ({signinEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'visitors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Who Opened Website ({visitEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pageviews')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'pageviews'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Which Pages Opened ({pageviewEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('product_clicks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'product_clicks'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>What Products Clicked ({productClickEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('registered_users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'registered_users'
                ? 'bg-gray-800 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registered Customers DB ({profiles.length})</span>
          </button>

          {/* Google Analytics Tab */}
          <button
            onClick={() => setActiveTab('google_analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'google_analytics'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
            </svg>
            <span>Google Analytics</span>
          </button>
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, email, page or product..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#698156]/30 focus:border-[#698156]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#698156]/30"
            >
              <option value="all">All Devices</option>
              <option value="mobile">Mobile Devices</option>
              <option value="desktop">Desktop Web</option>
            </select>

            <span className="text-xs text-gray-400 font-mono hidden md:inline">
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: LIVE ACTIVITY FEED (ALL EVENTS) ─── */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Live Customer Activity Audit Trail</h2>
              <p className="text-xs text-gray-500">Real-time log of every customer action streaming from the storefront</p>
            </div>
            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              {filteredEvents.length} Events Logged
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Listening for real-time customer actions...</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No mock data is displayed. When visitors sign in, browse pages, or click products in the store, events will immediately appear in this live feed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEvents.map(evt => (
                <div key={evt.id} className="p-4 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getEventBadge(evt.type)}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900">
                          {evt.user?.name || 'Guest Visitor'}
                        </span>
                        {evt.user?.email && (
                          <span className="text-[11px] text-gray-500 font-mono">
                            ({evt.user.email})
                          </span>
                        )}
                        {evt.user?.isAuthenticated && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified User
                          </span>
                        )}
                      </div>

                      {/* Event Context Description */}
                      <p className="text-xs text-gray-600 mt-0.5">
                        {evt.type === 'signin' && (
                          <span>Signed in to customer account.</span>
                        )}
                        {evt.type === 'visit' && (
                          <span>Opened store website via <strong>{evt.client?.trafficSource}</strong>.</span>
                        )}
                        {evt.type === 'pageview' && (
                          <span>
                            Opened page <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] text-gray-800">{evt.details?.path}</code>
                            {evt.details?.pageTitle && ` — "${evt.details.pageTitle}"`}
                          </span>
                        )}
                        {evt.type === 'product_click' && (
                          <span>
                            Clicked product <strong>{evt.details?.productName}</strong>
                            {evt.details?.productPrice ? ` (₹${evt.details.productPrice})` : ''} in category {evt.details?.productCategory}.
                          </span>
                        )}
                        {evt.type === 'cart_add' && (
                          <span>Added <strong>{evt.details?.productName}</strong> to shopping cart.</span>
                        )}
                        {evt.type === 'checkout' && (
                          <span>Initiated checkout with order amount ₹{evt.details?.amount || 0}.</span>
                        )}
                        {evt.type === 'purchase' && (
                          <span>Completed purchase order <strong>#{evt.details?.orderId}</strong> for ₹{evt.details?.amount || 0}.</span>
                        )}
                      </p>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          {getDeviceIcon(evt.client?.device)} {evt.client?.device} • {evt.client?.browser}
                        </span>
                        {evt.client?.trafficSource && (
                          <span>Source: {evt.client.trafficSource}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:self-center shrink-0">
                    <span className="text-xs font-mono text-gray-500 block">{evt.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: WHO SIGNED IN (USER LOGINS) ─── */}
      {activeTab === 'signins' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Who Signed In (User Logins)</h2>
              <p className="text-xs text-gray-500">Real-time audit log of customer and administrator sign-in events</p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {signinEvents.length} Sign-In Events
            </span>
          </div>

          {signinEvents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No sign-in events recorded in this active stream</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Whenever a customer or admin signs in via email/password, their exact identity, email, phone, timestamp, and device appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-700">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <tr>
                    <th className="p-4 text-left">Customer Name</th>
                    <th className="p-4 text-left">Email Address</th>
                    <th className="p-4 text-left">Phone</th>
                    <th className="p-4 text-left">Role</th>
                    <th className="p-4 text-left">Device & Browser</th>
                    <th className="p-4 text-right">Sign-In Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {signinEvents.map(evt => (
                    <tr key={evt.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {(evt.user?.name || 'U').charAt(0)}
                        </div>
                        <span>{evt.user?.name || 'Customer'}</span>
                      </td>
                      <td className="p-4 font-mono text-gray-700">{evt.user?.email || '—'}</td>
                      <td className="p-4 font-mono text-gray-500">{evt.user?.phone || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.user?.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {evt.user?.role?.toUpperCase() || 'CUSTOMER'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <span className="flex items-center gap-1.5">
                          {getDeviceIcon(evt.client?.device)} {evt.client?.device} • {evt.client?.browser}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-gray-500">{evt.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: WHO OPENED WEBSITE (VISITOR SESSIONS) ─── */}
      {activeTab === 'visitors' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Who Opened the Website (Visitor Sessions)</h2>
              <p className="text-xs text-gray-500">Real-time log of customer site visits, entry sources, and hardware</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {visitEvents.length} Visits Logged
            </span>
          </div>

          {visitEvents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No site visits captured in this session yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                When a user opens the store, their session origin (Google Organic, Instagram/FB, Direct) and hardware details are captured and shown here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-700">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <tr>
                    <th className="p-4 text-left">Visitor Identity</th>
                    <th className="p-4 text-left">Discovery Traffic Source</th>
                    <th className="p-4 text-left">Device</th>
                    <th className="p-4 text-left">Browser</th>
                    <th className="p-4 text-left">Landing Page</th>
                    <th className="p-4 text-right">Visit Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visitEvents.map(evt => (
                    <tr key={evt.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <div>
                            <span className="font-bold">{evt.user?.name || 'Guest Visitor'}</span>
                            {evt.user?.email && <div className="text-[10px] font-mono text-gray-400">{evt.user.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {evt.client?.trafficSource}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 font-medium">
                          {getDeviceIcon(evt.client?.device)} {evt.client?.device}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{evt.client?.browser}</td>
                      <td className="p-4 font-mono text-gray-600">
                        <code className="bg-gray-50 px-1 py-0.5 rounded text-[11px]">{evt.details?.path || '/'}</code>
                      </td>
                      <td className="p-4 text-right font-mono text-gray-500">{evt.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: WHICH PAGES THEY OPEN (PAGE VIEWS) ─── */}
      {activeTab === 'pageviews' && (
        <div className="space-y-6">
          {/* Page Rankings Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Most Opened Pages (Real Traffic Ranking)</h3>
            <p className="text-xs text-gray-500 mb-4">Frequency ranking calculated directly from real visitor page opens</p>

            {pageViewRankings.length === 0 ? (
              <p className="text-xs text-gray-400">No page views recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {pageViewRankings.slice(0, 8).map((p, idx) => (
                  <div key={p.path} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <code className="font-bold text-gray-900">{p.path}</code>
                        <span className="text-[11px] text-gray-400 ml-2 hidden sm:inline">({p.title})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-[#698156] bg-white px-2 py-0.5 rounded-md border border-gray-200">
                        {p.count} views
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono hidden md:inline">{p.lastViewed}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Stream of Page Views */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Individual Page Opens Audit</h3>
                <p className="text-xs text-gray-500">Every single page opened by real visitors and customers</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {pageviewEvents.length} Pageviews
              </span>
            </div>

            {pageviewEvents.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                No page views recorded yet. Navigate between pages in the storefront to see them appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-700">
                  <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <tr>
                      <th className="p-4 text-left">Page Path</th>
                      <th className="p-4 text-left">Page Title</th>
                      <th className="p-4 text-left">Visitor / Customer</th>
                      <th className="p-4 text-left">Device</th>
                      <th className="p-4 text-right">Opened At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageviewEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-4 font-mono font-bold text-gray-900">
                          <code className="bg-gray-50 px-1.5 py-0.5 rounded text-xs border border-gray-100">{evt.details?.path}</code>
                        </td>
                        <td className="p-4 text-gray-600 truncate max-w-xs">{evt.details?.pageTitle || '—'}</td>
                        <td className="p-4">
                          <span className="font-semibold text-gray-800">{evt.user?.name || 'Guest Visitor'}</span>
                          {evt.user?.email && <div className="text-[10px] font-mono text-gray-400">{evt.user.email}</div>}
                        </td>
                        <td className="p-4 text-gray-600">
                          <span className="flex items-center gap-1.5">
                            {getDeviceIcon(evt.client?.device)} {evt.client?.device}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-gray-500">{evt.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: WHAT PRODUCTS THEY CLICK ─── */}
      {activeTab === 'product_clicks' && (
        <div className="space-y-6">
          {/* Product Click Ranking */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-1">Most Clicked Products (Real Customer Demand)</h3>
            <p className="text-xs text-gray-500 mb-4">Rankings derived directly from real user clicks on storefront product cards</p>

            {productClickRankings.length === 0 ? (
              <p className="text-xs text-gray-400">No product clicks recorded yet in this stream.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {productClickRankings.slice(0, 6).map((prod, idx) => (
                  <div key={prod.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} className="w-12 h-14 rounded-lg object-cover object-top border border-gray-200 shrink-0" />
                    ) : (
                      <div className="w-12 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                        <Tag className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-[#698156] uppercase tracking-wider">{prod.category}</span>
                        <span className="text-xs font-bold font-mono text-[#698156] bg-white px-2 py-0.5 rounded border border-gray-200">
                          {prod.clicks} clicks
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 truncate mt-0.5">{prod.name}</h4>
                      <div className="text-[11px] font-bold text-gray-700 mt-0.5">₹{prod.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Click Log */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Live Product Clicks Audit Stream</h3>
                <p className="text-xs text-gray-500">Log of every product clicked by store customers</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {productClickEvents.length} Product Clicks
              </span>
            </div>

            {productClickEvents.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500">
                No product clicks captured yet. Click on any product in the store catalog to see it register here in real-time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-700">
                  <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <tr>
                      <th className="p-4 text-left">Product</th>
                      <th className="p-4 text-left">Category</th>
                      <th className="p-4 text-left">Price</th>
                      <th className="p-4 text-left">Clicked By</th>
                      <th className="p-4 text-left">Device</th>
                      <th className="p-4 text-right">Click Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productClickEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-4 font-bold text-gray-900 flex items-center gap-2.5">
                          {evt.details?.productImage ? (
                            <img src={evt.details.productImage} alt="" className="w-8 h-10 rounded object-cover object-top border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-8 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                              <Tag className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="truncate max-w-xs">{evt.details?.productName || 'Product'}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            {evt.details?.productCategory || 'Apparel'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          ₹{evt.details?.productPrice !== undefined ? evt.details.productPrice : '—'}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-gray-800">{evt.user?.name || 'Guest Visitor'}</span>
                          {evt.user?.email && <div className="text-[10px] font-mono text-gray-400">{evt.user.email}</div>}
                        </td>
                        <td className="p-4 text-gray-600">
                          <span className="flex items-center gap-1.5">
                            {getDeviceIcon(evt.client?.device)} {evt.client?.device}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-gray-500">{evt.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 6: REGISTERED CUSTOMERS DATABASE (12 REAL PROFILES) ─── */}
      {activeTab === 'registered_users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Registered Customers Database ({profiles.length})</h2>
              <p className="text-xs text-gray-500">Real customer accounts registered in Supabase database</p>
            </div>
            <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
              Supabase Verified
            </span>
          </div>

          {profiles.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">
              No registered profiles found in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-700">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <tr>
                    <th className="p-4 text-left">Customer Name</th>
                    <th className="p-4 text-left">Email Address</th>
                    <th className="p-4 text-left">Phone Number</th>
                    <th className="p-4 text-left">Role</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Account Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profiles.map(prof => (
                    <tr key={prof.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#698156]/10 text-[#698156] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {(prof.full_name || prof.email || 'U').charAt(0)}
                        </div>
                        <span>{prof.full_name || 'Customer'}</span>
                      </td>
                      <td className="p-4 font-mono text-gray-700">{prof.email || '—'}</td>
                      <td className="p-4 font-mono text-gray-600">{prof.phone || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prof.role === 'admin'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {prof.role?.toUpperCase() || 'CUSTOMER'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          {prof.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-gray-500 whitespace-nowrap">
                        {prof.created_at ? new Date(prof.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: GOOGLE ANALYTICS ─── */}
      {activeTab === 'google_analytics' && (
        <div className="space-y-5">

          {/* Header Card */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
                  <path d="M44 24C44 35.046 35.046 44 24 44S4 35.046 4 24 12.954 4 24 4s20 8.954 20 20z" fill="#E8F0FE"/>
                  <path fill="#4285F4" d="M24 10a14 14 0 100 28A14 14 0 0024 10zm0 22a8 8 0 110-16 8 8 0 010 16z"/>
                  <path fill="#EA4335" d="M24 4v6a14 14 0 00-9.9 4.1L9.9 9.9A20 20 0 0124 4z"/>
                  <path fill="#FBBC05" d="M44 24h-6a14 14 0 00-4.1-9.9l4.2-4.2A20 20 0 0144 24z"/>
                  <path fill="#34A853" d="M24 44v-6a14 14 0 009.9-4.1l4.2 4.2A20 20 0 0124 44z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  Google Analytics 4
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    Connected
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Measurement ID: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 text-orange-700 font-bold">G-CR84KB4TS4</code>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Property: Aanya Fashions — aanyafashions.com</p>
              </div>
            </div>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
            >
              Open Google Analytics Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Quick-Access Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Realtime Report',
                desc: 'See users on your site right now — pages they browse, events firing live.',
                href: 'https://analytics.google.com/analytics/web/#/realtime/rt-overview',
                colorClass: 'bg-emerald-50 border-emerald-100 text-emerald-700',
                icon: <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              },
              {
                title: 'Audience Overview',
                desc: 'Demographics, devices, locations and behaviour of your visitors.',
                href: 'https://analytics.google.com/analytics/web/#/audience/overview',
                colorClass: 'bg-blue-50 border-blue-100 text-blue-700',
                icon: <Users className="w-4 h-4" />
              },
              {
                title: 'Traffic Acquisition',
                desc: 'Where your visitors come from — Organic, Social, Direct, Referral.',
                href: 'https://analytics.google.com/analytics/web/#/acquisition/overview',
                colorClass: 'bg-purple-50 border-purple-100 text-purple-700',
                icon: <Globe className="w-4 h-4" />
              },
              {
                title: 'Ecommerce / Conversions',
                desc: 'Purchase events, revenue, add-to-cart and checkout funnel.',
                href: 'https://analytics.google.com/analytics/web/#/ecommerce/overview',
                colorClass: 'bg-amber-50 border-amber-100 text-amber-700',
                icon: <CreditCard className="w-4 h-4" />
              },
              {
                title: 'Pages & Screens',
                desc: 'Which pages get the most views — homepage, products, categories.',
                href: 'https://analytics.google.com/analytics/web/#/engagement/pagesscreens',
                colorClass: 'bg-teal-50 border-teal-100 text-teal-700',
                icon: <Eye className="w-4 h-4" />
              },
              {
                title: 'Events Report',
                desc: 'All custom events: page_view, login, select_item, add_to_cart, purchase.',
                href: 'https://analytics.google.com/analytics/web/#/engagement/events',
                colorClass: 'bg-rose-50 border-rose-100 text-rose-700',
                icon: <Activity className="w-4 h-4" />
              }
            ].map(card => (
              <a
                key={card.title}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all group flex flex-col gap-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border ${card.colorClass}`}>
                    {card.icon}
                    {card.title}
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{card.desc}</p>
              </a>
            ))}
          </div>

          {/* Events Tracked */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#698156]" />
              <h3 className="text-sm font-bold text-gray-900">GA4 Events Auto-Tracked from Aanya Fashions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { event: 'page_view', label: 'Page Views', colorClass: 'bg-teal-50 border-teal-100 text-teal-700', desc: 'Every page navigation' },
                { event: 'login', label: 'Login', colorClass: 'bg-purple-50 border-purple-100 text-purple-700', desc: 'Customer sign-ins' },
                { event: 'select_item', label: 'Product Click', colorClass: 'bg-emerald-50 border-emerald-100 text-emerald-700', desc: 'Product card clicks' },
                { event: 'view_item', label: 'Product View', colorClass: 'bg-blue-50 border-blue-100 text-blue-700', desc: 'Product detail open' },
                { event: 'add_to_cart', label: 'Add to Cart', colorClass: 'bg-amber-50 border-amber-100 text-amber-700', desc: 'Cart additions' },
                { event: 'purchase', label: 'Purchase', colorClass: 'bg-rose-50 border-rose-100 text-rose-700', desc: 'Completed orders' },
              ].map(ev => (
                <div key={ev.event} className={`border rounded-xl p-3 flex flex-col gap-1 ${ev.colorClass}`}>
                  <code className="text-[10px] font-mono font-bold break-all">{ev.event}</code>
                  <span className="text-[11px] font-bold text-gray-800">{ev.label}</span>
                  <span className="text-[10px] text-gray-500">{ev.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Status Checklist */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#698156]" />
              <h3 className="text-sm font-bold text-gray-900">Setup Status & Verification Checklist</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'GA4 Script injected in <head>', done: true, note: 'index.html — loads async on every page visit' },
                { label: 'Measurement ID configured', done: true, note: 'G-CR84KB4TS4 active in index.html, .env & .env.production' },
                { label: 'page_view events firing', done: true, note: 'trackPageView() sends window.gtag("event","page_view") on every route change' },
                { label: 'E-commerce events wired', done: true, note: 'login, select_item, view_item, add_to_cart, begin_checkout, purchase — all firing via gtag()' },
                { label: 'Verify in GA4 → Realtime → Events', done: false, note: 'Open aanyafashions.com in a tab, then check GA4 Realtime — events should appear within 1 minute' },
                { label: 'Enable Enhanced Measurement in GA4', done: false, note: 'GA4 Admin → Data Streams → your stream → Enhanced Measurement → toggle ON' },
              ].map(step => (
                <div key={step.label} className={`flex items-start gap-3 p-3 rounded-xl border ${step.done ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="mt-0.5 shrink-0">
                    {step.done
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <AlertCircle className="w-4 h-4 text-amber-600" />
                    }
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${step.done ? 'text-green-800' : 'text-amber-800'}`}>{step.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}