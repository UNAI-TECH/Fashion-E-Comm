import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  IndianRupee, 
  HandCoins, 
  Loader2, 
  Building2, 
  ArrowUpRight, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Eye,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export interface PaymentTransaction {
  id: string;
  order_id: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  gateway_txn_id?: string;
  payer_vpa?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded' | string;
  date: string;
  time: string;
  raw_date: string;
  gateway_response?: any;
  metadata?: any;
  shipping_address?: any;
}

export function AdminPayments() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Real-time subscription and initial fetch
  useEffect(() => {
    loadTransactions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadTransactions(false);
    }, 30000);

    // Supabase Real-time listener on payments and orders
    const payChannel = supabase
      .channel('admin-payments-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadTransactions(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadTransactions(false);
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(payChannel);
    };
  }, []);

  const loadTransactions = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch real payments records from public.payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch orders to join address, customer info, and any orders that placed payments
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          total_amount,
          payment_method,
          payment_status,
          status,
          created_at,
          razorpay_order_id,
          razorpay_payment_id,
          shipping_address,
          payment_result
        `)
        .order('created_at', { ascending: false });

      const ordersMap = new Map<string, any>();
      (ordersData || []).forEach((o: any) => {
        ordersMap.set(o.id, o);
        if (o.razorpay_order_id) ordersMap.set(o.razorpay_order_id, o);
      });

      // Build unified transaction list
      const txnsList: PaymentTransaction[] = [];
      const seenPaymentKeys = new Set<string>();

      // A. Process records from public.payments
      if (paymentsData && paymentsData.length > 0) {
        paymentsData.forEach((p: any) => {
          const linkedOrder = ordersMap.get(p.order_id) || (p.razorpay_order_id ? ordersMap.get(p.razorpay_order_id) : null);
          const shipAddr = linkedOrder?.shipping_address || {};

          const customerName = p.customer_name || shipAddr.full_name || [shipAddr.first_name, shipAddr.last_name].filter(Boolean).join(' ') || 'Customer';
          const customerPhone = p.customer_phone || shipAddr.phone || '';
          const customerEmail = shipAddr.email || p.metadata?.customer_email || '';

          const createdDate = new Date(p.created_at || linkedOrder?.created_at || Date.now());

          // Standardize status
          let cleanStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded' = 'Pending';
          const rawStatus = (p.status || linkedOrder?.payment_status || 'Pending').toLowerCase();
          if (rawStatus === 'paid' || rawStatus === 'success' || rawStatus === 'completed' || rawStatus === 'captured') {
            cleanStatus = 'Paid';
          } else if (rawStatus === 'failed') {
            cleanStatus = 'Failed';
          } else if (rawStatus === 'refunded') {
            cleanStatus = 'Refunded';
          }

          const rzpPayId = p.razorpay_payment_id || p.payment_id || p.gateway_txn_id || linkedOrder?.razorpay_payment_id;
          const rzpOrdId = p.razorpay_order_id || linkedOrder?.razorpay_order_id;

          const txnItem: PaymentTransaction = {
            id: p.id,
            order_id: p.order_id || linkedOrder?.id || 'N/A',
            razorpay_order_id: rzpOrdId || undefined,
            razorpay_payment_id: rzpPayId || undefined,
            gateway_txn_id: rzpPayId || '—',
            payer_vpa: p.payer_vpa || (p.method === 'UPI' ? 'UPI' : 'Razorpay'),
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            payment_method: p.payment_method || p.method || linkedOrder?.payment_method || 'Razorpay',
            amount: Number(p.amount || linkedOrder?.total_amount || 0),
            currency: p.currency || 'INR',
            status: cleanStatus,
            date: createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            raw_date: p.created_at || linkedOrder?.created_at,
            gateway_response: p.gateway_response || p.metadata,
            shipping_address: shipAddr
          };

          const dedupKey = `${txnItem.order_id}_${txnItem.razorpay_payment_id || txnItem.id}`;
          seenPaymentKeys.add(dedupKey);
          seenPaymentKeys.add(txnItem.order_id);
          txnsList.push(txnItem);
        });
      }

      // B. Process orders that don't have a payments row yet (e.g. COD or pre-existing orders)
      if (ordersData && ordersData.length > 0) {
        ordersData.forEach((o: any) => {
          if (!seenPaymentKeys.has(o.id)) {
            const shipAddr = o.shipping_address || {};
            const customerName = shipAddr.full_name || [shipAddr.first_name, shipAddr.last_name].filter(Boolean).join(' ') || 'Customer';
            const customerPhone = shipAddr.phone || '';
            const customerEmail = shipAddr.email || '';

            const createdDate = new Date(o.created_at || Date.now());

            let cleanStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded' = 'Pending';
            const rawStatus = (o.payment_status || 'Pending').toLowerCase();
            if (rawStatus === 'paid' || rawStatus === 'success' || rawStatus === 'completed') {
              cleanStatus = 'Paid';
            } else if (rawStatus === 'failed') {
              cleanStatus = 'Failed';
            } else if (rawStatus === 'refunded') {
              cleanStatus = 'Refunded';
            }

            const txnItem: PaymentTransaction = {
              id: `TXN-${o.id}`,
              order_id: o.id,
              razorpay_order_id: o.razorpay_order_id || undefined,
              razorpay_payment_id: o.razorpay_payment_id || undefined,
              gateway_txn_id: o.razorpay_payment_id || '—',
              payer_vpa: o.payment_method === 'COD' ? 'Cash on Delivery' : 'Online Payment',
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              payment_method: o.payment_method || (o.razorpay_order_id ? 'Razorpay' : 'COD'),
              amount: Number(o.total_amount || 0),
              currency: 'INR',
              status: cleanStatus,
              date: createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              time: createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
              raw_date: o.created_at,
              gateway_response: o.payment_result,
              shipping_address: shipAddr
            };

            txnsList.push(txnItem);
          }
        });
      }

      // Sort newest transactions first
      txnsList.sort((a, b) => new Date(b.raw_date).getTime() - new Date(a.raw_date).getTime());

      setTransactions(txnsList);
    } catch (error: any) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments: ' + (error?.message || ''));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadTransactions(false);
    toast.info('Refreshing payment records...');
  };

  // Filter calculations
  const filteredTransactions = transactions.filter(t => {
    // 1. Search Query Filter
    const searchLower = searchQuery.trim().toLowerCase();
    const matchesSearch = !searchLower ||
      t.order_id.toLowerCase().includes(searchLower) ||
      (t.razorpay_payment_id && t.razorpay_payment_id.toLowerCase().includes(searchLower)) ||
      (t.razorpay_order_id && t.razorpay_order_id.toLowerCase().includes(searchLower)) ||
      t.customer_name.toLowerCase().includes(searchLower) ||
      (t.customer_phone && t.customer_phone.includes(searchLower)) ||
      (t.customer_email && t.customer_email.toLowerCase().includes(searchLower));

    // 2. Status Filter
    const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();

    // 3. Method Filter
    let matchesMethod = true;
    if (methodFilter !== 'all') {
      const m = t.payment_method.toLowerCase();
      if (methodFilter === 'razorpay') matchesMethod = m.includes('razorpay') || m.includes('online');
      else if (methodFilter === 'upi') matchesMethod = m.includes('upi');
      else if (methodFilter === 'cod') matchesMethod = m.includes('cod') || m.includes('cash');
      else if (methodFilter === 'cards') matchesMethod = m.includes('card');
    }

    // 4. Date Range Filter
    let matchesDate = true;
    if (dateRangeFilter !== 'all') {
      const txnTime = new Date(t.raw_date).getTime();
      const now = Date.now();
      if (dateRangeFilter === 'today') {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        matchesDate = txnTime >= todayStart;
      } else if (dateRangeFilter === '7days') {
        matchesDate = txnTime >= now - 7 * 24 * 60 * 60 * 1000;
      } else if (dateRangeFilter === '30days') {
        matchesDate = txnTime >= now - 30 * 24 * 60 * 60 * 1000;
      }
    }

    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  // Calculate Authoritative Summary Figures strictly from actual DB records
  const totalTransactionsCount = transactions.length;
  const successfulPaymentsCount = transactions.filter(t => t.status === 'Paid').length;
  const pendingPaymentsCount = transactions.filter(t => t.status === 'Pending').length;
  const failedPaymentsCount = transactions.filter(t => t.status === 'Failed').length;
  
  // Total Revenue: ONLY successful/paid payments (never pending or failed)
  const totalRevenueAmount = transactions
    .filter(t => t.status === 'Paid')
    .reduce((sum, t) => sum + t.amount, 0);

  // Refunded Amount
  const totalRefundedAmount = transactions
    .filter(t => t.status === 'Refunded')
    .reduce((sum, t) => sum + t.amount, 0);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Paid
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Failed
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#698156]" />
        <p className="text-sm font-medium text-gray-500">Loading payment transactions from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Payments & Transactions</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Razorpay Live Verified
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time audit log of all customer transactions, UPI QR payments, and gateway settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-xs transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#698156]' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── 6 Authoritative Summary Metric Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Transactions */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Txns</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">{totalTransactionsCount}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">All records</p>
        </div>

        {/* Successful Payments */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-emerald-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Successful</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{successfulPaymentsCount}</div>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">Paid orders</p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-amber-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending</span>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingPaymentsCount}</div>
          <p className="text-[10px] text-amber-600/70 mt-0.5">Awaiting capture</p>
        </div>

        {/* Failed Payments */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-rose-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Failed</span>
          <div className="mt-2 text-2xl font-bold text-rose-600">{failedPaymentsCount}</div>
          <p className="text-[10px] text-rose-600/70 mt-0.5">Declined txns</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between col-span-2 sm:col-span-1 lg:col-span-1">
          <span className="text-[11px] font-semibold text-[#698156] uppercase tracking-wider">Total Revenue</span>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(totalRevenueAmount)}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Verified collected</p>
        </div>

        {/* Refunded Amount */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Refunded</span>
          <div className="mt-2 text-2xl font-bold text-gray-700">{formatCurrency(totalRefundedAmount)}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Returned funds</p>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search Order ID, Pay ID, Name, Phone..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#698156] focus:bg-white transition-all"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#698156] text-gray-700"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid (Successful)</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={e => { setMethodFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#698156] text-gray-700"
            >
              <option value="all">All Payment Methods</option>
              <option value="razorpay">Razorpay (Online)</option>
              <option value="upi">UPI / QR</option>
              <option value="cards">Cards</option>
              <option value="cod">Cash on Delivery (COD)</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={dateRangeFilter}
              onChange={e => { setDateRangeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#698156] text-gray-700"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Transactions Table ─── */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Internal Order ID</th>
                <th className="px-5 py-3.5">Razorpay Order ID</th>
                <th className="px-5 py-3.5">Payment ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Order ID */}
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                      {txn.order_id}
                    </td>

                    {/* Razorpay Order ID */}
                    <td className="px-5 py-3.5 font-mono text-gray-500">
                      {txn.razorpay_order_id ? (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">{txn.razorpay_order_id}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Razorpay Payment ID */}
                    <td className="px-5 py-3.5 font-mono text-gray-700">
                      {txn.razorpay_payment_id ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                          {txn.razorpay_payment_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{txn.customer_name}</div>
                      <div className="text-gray-400 text-[11px]">
                        {txn.customer_phone || txn.customer_email || '—'}
                      </div>
                    </td>

                    {/* Method */}
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-800">{txn.payment_method}</span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {formatCurrency(txn.amount)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getStatusBadge(txn.status)}
                    </td>

                    {/* Date & Time */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500">
                      <div>{txn.date}</div>
                      <div className="text-[10px] text-gray-400">{txn.time}</div>
                    </td>

                    {/* Action: View Modal */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedTxn(txn)}
                        className="p-1.5 text-gray-400 hover:text-[#698156] hover:bg-[#698156]/10 rounded-lg transition-colors inline-block"
                        title="View Transaction Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                    <CreditCard className="w-9 h-9 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">No payment transactions found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search query or filters.' : 'Transactions will appear here automatically when orders are placed.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Controls ─── */}
        {filteredTransactions.length > pageSize && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <span className="px-2 font-bold text-gray-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Transaction Details Modal ─── */}
      <AnimatePresence>
        {selectedTxn && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={() => setSelectedTxn(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-gray-900">Transaction Details</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{selectedTxn.order_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Transaction Amount</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedTxn.amount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Payment Status</span>
                    <div className="mt-0.5">{getStatusBadge(selectedTxn.status)}</div>
                  </div>
                </div>

                <div className="space-y-2.5 divide-y divide-gray-100">
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Internal Order ID:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedTxn.order_id}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Razorpay Order ID:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedTxn.razorpay_order_id || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Razorpay Payment ID:</span>
                    <span className="font-mono font-bold text-emerald-700">{selectedTxn.razorpay_payment_id || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-bold text-gray-900">{selectedTxn.payment_method}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Customer Name:</span>
                    <span className="font-medium text-gray-900">{selectedTxn.customer_name}</span>
                  </div>
                  {selectedTxn.customer_phone && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">Customer Phone:</span>
                      <span className="text-gray-900">{selectedTxn.customer_phone}</span>
                    </div>
                  )}
                  {selectedTxn.customer_email && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray-500">Customer Email:</span>
                      <span className="text-gray-900">{selectedTxn.customer_email}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Transaction Time:</span>
                    <span className="text-gray-900">{selectedTxn.date} at {selectedTxn.time}</span>
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedTxn.shipping_address && Object.keys(selectedTxn.shipping_address).length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-1">Delivery Address</h4>
                    <p className="text-gray-600 leading-relaxed text-[11px]">
                      {[
                        selectedTxn.shipping_address.address,
                        selectedTxn.shipping_address.city,
                        selectedTxn.shipping_address.state,
                        selectedTxn.shipping_address.pincode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {/* Raw Gateway Response Preview if available */}
                {selectedTxn.gateway_response && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-1">Gateway Metadata</h4>
                    <pre className="bg-gray-900 text-gray-200 p-3 rounded-xl text-[10px] overflow-x-auto max-h-36">
                      {JSON.stringify(selectedTxn.gateway_response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
