import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  Calendar,
  Clock,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  VideoRequest,
  fetchVideoRequests,
  updateVideoRequestStatus,
  buildWhatsAppLink
} from '../../../lib/videoRequests';
import { toast } from 'sonner';

export function AdminVideoRequests() {
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Accepted' | 'Rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // Purge any legacy mock demo samples from localStorage
      try {
        const raw = localStorage.getItem('aanya_video_requests_cache_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter((r: any) => r && r.id && !String(r.id).startsWith('vid_req_sample_'));
            localStorage.setItem('aanya_video_requests_cache_v1', JSON.stringify(clean));
          }
        }
      } catch {}

      const data = await fetchVideoRequests();
      setRequests(data.filter((r: any) => r && !String(r.id).startsWith('vid_req_sample_')));
    } catch (err: any) {
      console.error('Failed to load video requests:', err);
      toast.error('Failed to load video requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);

    // 1. Local event listener (instant same-window sync)
    const handleLocalNew = (e: any) => {
      if (e.detail) {
        setRequests(prev => [e.detail, ...prev.filter(r => r.id !== e.detail.id)]);
        toast.info(`New video call requested by ${e.detail.customer_name}!`);
      }
    };
    const handleLocalUpdate = (e: any) => {
      if (e.detail?.id) {
        setRequests(prev =>
          prev.map(r => r.id === e.detail.id ? { ...r, status: e.detail.status } : r)
        );
      }
    };
    window.addEventListener('aanya:new_video_request', handleLocalNew);
    window.addEventListener('aanya:video_request_updated', handleLocalUpdate);

    // 2. Supabase Realtime broadcast channel across all devices & admin panels
    const channel = supabase.channel('aanya-video-requests-stream', {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'video_request_created' }, ({ payload }) => {
        if (payload) {
          setRequests(prev => [payload, ...prev.filter(r => r.id !== payload.id)]);
          toast.success(`Live: New Video Call Request from ${payload.customer_name}!`);
        }
      })
      .on('broadcast', { event: 'video_request_status_changed' }, ({ payload }) => {
        if (payload?.id) {
          setRequests(prev =>
            prev.map(r => r.id === payload.id ? { ...r, status: payload.status } : r)
          );
        }
      })
      .subscribe();

    // 3. PostgreSQL database changes on video_requests table
    const dbChannel = supabase
      .channel('admin-video-requests-db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_requests' }, () => {
        loadData(false);
      })
      .subscribe();

    // 4. Auto-refresh fallback every 15 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 15000);

    return () => {
      window.removeEventListener('aanya:new_video_request', handleLocalNew);
      window.removeEventListener('aanya:video_request_updated', handleLocalUpdate);
      clearInterval(interval);
      supabase.removeChannel(channel);
      supabase.removeChannel(dbChannel);
    };
  }, []);

  const handleAccept = async (req: VideoRequest) => {
    setActionLoadingId(req.id);
    try {
      await updateVideoRequestStatus(req.id, 'Accepted');
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Accepted' } : r));
      toast.success(`Video request for ${req.customer_name} accepted! Tap WhatsApp to send message.`);
    } catch (err: any) {
      toast.error('Failed to accept request: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (req: VideoRequest) => {
    setActionLoadingId(req.id);
    try {
      await updateVideoRequestStatus(req.id, 'Rejected');
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Rejected' } : r));
      toast.info(`Video request for ${req.customer_name} rejected. Tap WhatsApp to inform.`);
    } catch (err: any) {
      toast.error('Failed to reject request: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter requests
  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        r.customer_name.toLowerCase().includes(q) ||
        r.whatsapp_number.includes(q) ||
        r.product_name.toLowerCase().includes(q) ||
        (r.reason && r.reason.toLowerCase().includes(q))
      );
    });
  }, [requests, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'Pending').length,
      accepted: requests.filter(r => r.status === 'Accepted').length,
      rejected: requests.filter(r => r.status === 'Rejected').length,
    };
  }, [requests]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── Header & Top Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Customer Video Requests</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Real-Time Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review live saree demo bookings, scheduled dates & times, accept/reject, and WhatsApp customers directly with prefilled details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#698156]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Metric KPI Badges ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all' ? 'bg-purple-50/50 border-purple-300 shadow-xs' : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Bookings</div>
          <div className="mt-1.5 text-2xl font-bold text-gray-900">{counts.all}</div>
          <p className="text-[10px] text-gray-500 mt-0.5">All customer requests</p>
        </div>

        <div
          onClick={() => setStatusFilter('Pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Pending' ? 'bg-amber-50/60 border-amber-300 shadow-xs' : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Awaiting Review</div>
          <div className="mt-1.5 text-2xl font-bold text-amber-600">{counts.pending}</div>
          <p className="text-[10px] text-amber-600/80 mt-0.5">Needs accept / reject</p>
        </div>

        <div
          onClick={() => setStatusFilter('Accepted')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Accepted' ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Accepted Calls</div>
          <div className="mt-1.5 text-2xl font-bold text-emerald-600">{counts.accepted}</div>
          <p className="text-[10px] text-emerald-600/80 mt-0.5">Ready for WhatsApp call</p>
        </div>

        <div
          onClick={() => setStatusFilter('Rejected')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Rejected' ? 'bg-rose-50/60 border-rose-300 shadow-xs' : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Declined</div>
          <div className="mt-1.5 text-2xl font-bold text-rose-600">{counts.rejected}</div>
          <p className="text-[10px] text-rose-600/80 mt-0.5">Rejected appointments</p>
        </div>
      </div>

      {/* ─── Filters & Search Bar ─── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, WhatsApp number, or saree name..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#698156]/20 focus:border-[#698156]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['all', 'Pending', 'Accepted', 'Rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'all' ? 'All' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── List of Video Requests ─── */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#698156] mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">Loading video call requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Video Requests Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No requests match your current filters. Try resetting search or filter.'
              : 'When customers request a video demo on product pages, their requests will appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map(req => {
            const isPending = req.status === 'Pending';
            const isAccepted = req.status === 'Accepted';
            const isRejected = req.status === 'Rejected';

            return (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Product & Customer Info */}
                  <div className="flex items-start gap-3.5 sm:gap-4 flex-1">
                    {/* Product Thumbnail */}
                    <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      {req.product_image ? (
                        <img
                          src={req.product_image}
                          alt={req.product_name}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPending
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : isAccepted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                          {isAccepted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                          {req.status}
                        </span>

                        <span className="text-[11px] text-gray-400">
                          Requested {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                          at {new Date(req.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2">
                        {req.product_name}
                      </h3>

                      {req.product_price && (
                        <div className="text-xs font-semibold text-[#698156]">
                          ₹{Number(req.product_price).toLocaleString('en-IN')}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-gray-600">
                        {/* Customer Name */}
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-900 truncate">{req.customer_name}</span>
                        </div>

                        {/* WhatsApp Number */}
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono text-gray-900">+91 {req.whatsapp_number}</span>
                        </div>

                        {/* Scheduled Date & Time */}
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{req.scheduled_date}</span>
                          <Clock className="w-3.5 h-3.5 text-purple-600 ml-1 shrink-0" />
                          <span>{req.scheduled_time}</span>
                        </div>
                      </div>

                      {req.reason && (
                        <div className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg inline-block border border-gray-100 mt-1">
                          <span className="font-semibold text-gray-700">Reason:</span> {req.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Dynamic Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                    {/* When Pending: Show Accept & Reject buttons */}
                    {isPending && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleAccept(req)}
                          disabled={actionLoadingId === req.id}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>

                        <button
                          onClick={() => handleReject(req)}
                          disabled={actionLoadingId === req.id}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {/* When Accepted: Button turns into WhatsApp Tap to Send Message */}
                    {isAccepted && (
                      <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                        <a
                          href={buildWhatsAppLink(req, 'Accepted')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
                        >
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>Tap to Message (WhatsApp)</span>
                        </a>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          ✓ Prepares confirmation for {req.scheduled_date} at {req.scheduled_time}
                        </p>
                      </div>
                    )}

                    {/* When Rejected: Button turns into WhatsApp Tap to Message Notice */}
                    {isRejected && (
                      <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                        <a
                          href={buildWhatsAppLink(req, 'Rejected')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black tracking-wide rounded-xl shadow-md transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Tap to Message (Send Rejection)</span>
                        </a>
                        <p className="text-[10px] text-rose-600 font-medium">
                          Informs customer on WhatsApp of rejection
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

