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
  X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface PaymentTransaction {
  id: string;
  order_id: string;
  customer_name?: string;
  customer_phone?: string;
  method: string;
  gateway_txn_id?: string;
  payer_vpa?: string;
  amount: number;
  status: string;
  date: string;
  raw_date: string;
}

interface PayoutRecord {
  id: string;
  payout_id: string;
  gross_amount: number;
  fee_amount: number;
  tax_amount: number;
  net_amount: number;
  bank_account_last4?: string;
  settlement_utr?: string;
  status: string;
  settled_at: string;
}

export function AdminPayments() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>('transactions');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [stats, setStats] = useState({ 
    totalRevenue: 0, 
    gpayRevenue: 0,
    totalPayouts: 0,
    pendingSettlements: 0 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Record Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [newPayout, setNewPayout] = useState({
    gross_amount: '',
    fee_amount: '0',
    tax_amount: '0',
    bank_account_last4: '4589',
    settlement_utr: '',
    status: 'Processed'
  });

  useEffect(() => {
    loadAllPaymentData();
  }, []);

  const loadAllPaymentData = async () => {
    try {
      // 1. Fetch payments table
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch orders table as fallback/supplement
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, payment_method, payment_status, created_at, customer_name, customer_phone')
        .order('created_at', { ascending: false });

      // 3. Fetch payouts table
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .order('settled_at', { ascending: false });

      // Build consolidated transactions strictly from real data
      let formattedTxns: PaymentTransaction[] = [];

      if (paymentsData && paymentsData.length > 0) {
        formattedTxns = paymentsData.map((p: any) => ({
          id: p.id,
          order_id: p.order_id || 'N/A',
          customer_name: p.customer_name || 'Customer',
          customer_phone: p.customer_phone || '',
          method: p.payment_method || 'Razorpay',
          gateway_txn_id: p.gateway_txn_id || p.payment_id || (p.metadata?.utr || '—'),
          payer_vpa: p.payer_vpa || 'Razorpay Online',
          amount: Number(p.amount || 0),
          status: p.status || 'Success',
          raw_date: p.created_at,
          date: new Date(p.created_at).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
        }));
      } else if (ordersData && ordersData.length > 0) {
        formattedTxns = ordersData
          .filter((o: any) => o.payment_status === 'Completed' || o.payment_status === 'Success' || o.payment_status === 'Failed')
          .map((o: any) => ({
            id: o.razorpay_payment_id || `RZP-${o.id.substring(0, 10)}`,
            order_id: o.id,
            customer_name: o.customer_name || 'Customer',
            customer_phone: o.customer_phone || '',
            method: 'Razorpay (UPI, Cards, NetBanking)',
            gateway_txn_id: o.razorpay_payment_id || o.razorpay_order_id || '—',
            payer_vpa: 'Razorpay Checkout',
            amount: Number(o.total_amount || 0),
            status: o.payment_status === 'Completed' ? 'Success' : o.payment_status,
            raw_date: o.created_at,
            date: new Date(o.created_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
          }));
      }

      setTransactions(formattedTxns);

      // Payouts list
      if (payoutsData && payoutsData.length > 0) {
        setPayouts(payoutsData.map((p: any) => ({
          id: p.id,
          payout_id: p.payout_id || `PO-${p.id.slice(0, 8)}`,
          gross_amount: Number(p.gross_amount || 0),
          fee_amount: Number(p.fee_amount || 0),
          tax_amount: Number(p.tax_amount || 0),
          net_amount: Number(p.net_amount || p.gross_amount || 0),
          bank_account_last4: p.bank_account_last4 || '4589',
          settlement_utr: p.settlement_utr || '—',
          status: p.status || 'Processed',
          settled_at: new Date(p.settled_at || p.created_at).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        })));
      }

      // Calculate aggregated stats strictly from real data
      const totalRev = formattedTxns
        .filter(t => t.status === 'Completed' || t.status === 'Success')
        .reduce((sum, t) => sum + t.amount, 0);

      const razorpayRev = formattedTxns
        .filter(t => (t.status === 'Completed' || t.status === 'Success'))
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingSet = formattedTxns
        .filter(t => t.status === 'Initiated' || t.status === 'Pending')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalPay = (payoutsData || []).reduce((sum: number, p: any) => sum + Number(p.net_amount || p.gross_amount || 0), 0);

      setStats({
        totalRevenue: totalRev,
        gpayRevenue: razorpayRev,
        totalPayouts: totalPay,
        pendingSettlements: pendingSet
      });

    } catch (error) {
      console.error('Error loading payment and payout data:', error);
      toast.error('Failed to load payment transactions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllPaymentData();
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(newPayout.gross_amount);
    if (!gross || gross <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }

    const fee = parseFloat(newPayout.fee_amount) || 0;
    const tax = parseFloat(newPayout.tax_amount) || 0;
    const net = gross - fee - tax;

    setIsSubmittingPayout(true);
    try {
      const payoutId = `PO-${Date.now().toString().slice(-8)}`;
      const { error } = await supabase
        .from('payouts')
        .insert([{
          payout_id: payoutId,
          gross_amount: gross,
          fee_amount: fee,
          tax_amount: tax,
          net_amount: net,
          currency: 'INR',
          bank_account_last4: newPayout.bank_account_last4 || '4589',
          settlement_utr: newPayout.settlement_utr || `UTR${Date.now().toString().slice(-10)}`,
          status: newPayout.status,
          settled_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Payout record created successfully!');
      setShowPayoutModal(false);
      setNewPayout({
        gross_amount: '',
        fee_amount: '0',
        tax_amount: '0',
        bank_account_last4: '4589',
        settlement_utr: '',
        status: 'Processed'
      });
      loadAllPaymentData();
    } catch (err: any) {
      console.error('Payout insertion error:', err);
      toast.error(`Failed to record payout: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success': 
      case 'Completed': 
      case 'Processed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Initiated': 
      case 'Pending': 
      case 'Scheduled':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Failed': 
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'Refunded': 
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      default: 
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.gateway_txn_id && t.gateway_txn_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.customer_phone && t.customer_phone.includes(searchQuery));
    
    const matchesFilter = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const statCards = [
    { 
      name: 'Total Revenue Collected', 
      value: formatCurrency(stats.totalRevenue), 
      sub: 'All completed orders',
      icon: IndianRupee, 
      accent: 'text-[#698156]',
      bg: 'bg-emerald-50' 
    },
    { 
      name: 'Google Pay (UPI) Inflow', 
      value: formatCurrency(stats.gpayRevenue), 
      sub: 'Instant digital payments',
      icon: CreditCard, 
      accent: 'text-[#1a73e8]',
      bg: 'bg-blue-50' 
    },
    { 
      name: 'Bank Payouts Settled', 
      value: formatCurrency(stats.totalPayouts), 
      sub: `${payouts.length} settlement batches`,
      icon: Building2, 
      accent: 'text-[#546944]',
      bg: 'bg-amber-50' 
    },
    { 
      name: 'Pending / Unsettled', 
      value: formatCurrency(stats.pendingSettlements), 
      sub: 'Awaiting verification/COD',
      icon: HandCoins, 
      accent: 'text-amber-600',
      bg: 'bg-amber-50/50' 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#698156]" />
        <p className="text-sm font-medium text-gray-500">Loading Google Pay & Payment records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Payments & Settlements</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1a73e8] border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] animate-pulse"></span>
              Google Pay Active
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Track real-time Google Pay UPI transactions, gateway UTR references, and bank settlement payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#698156]' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowPayoutModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#698156] hover:bg-[#546944] rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Bank Payout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{stat.name}</span>
              <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.accent}`} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</div>
              <p className="text-[11px] text-gray-400 mt-1">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'border-[#698156] text-[#698156]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Customer Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'payouts'
              ? 'border-[#698156] text-[#698156]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Bank Payouts & Settlements ({payouts.length})
        </button>
      </div>

      {/* Tab 1: Transactions View */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Order ID, UTR, Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#698156] focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:border-[#698156]"
              >
                <option value="all">All Statuses</option>
                <option value="Completed">Completed / Success</option>
                <option value="Initiated">Initiated / Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/75 text-gray-500 text-xs uppercase font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Order / Customer</th>
                    <th className="px-5 py-3.5">Method & Provider</th>
                    <th className="px-5 py-3.5">Gateway UTR / Txn Ref</th>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((txn) => {
                      const isGPay = txn.method.toLowerCase().includes('google pay');
                      return (
                        <tr key={txn.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-mono font-bold text-gray-900">{txn.order_id}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {txn.customer_name} {txn.customer_phone ? `• ${txn.customer_phone}` : ''}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {isGPay ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1a73e8]/10 text-[#1a73e8]">
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6z" />
                                  </svg>
                                  Google Pay UPI
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700">
                                  {txn.method}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono text-[11px]">
                            {txn.gateway_txn_id && txn.gateway_txn_id !== '—' ? (
                              <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded font-medium">
                                {txn.gateway_txn_id}
                              </span>
                            ) : (
                              <span className="text-gray-400">Direct COD</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                            {txn.date}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-gray-900 whitespace-nowrap text-sm">
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${getStatusBadge(txn.status)}`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                        No transactions found matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payouts & Settlements View */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div>
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <Building2 className="w-4 h-4 text-amber-700" />
                Google Pay India & UPI Direct Bank Settlements
              </p>
              <p className="text-amber-800/80 mt-0.5">
                UPI payments made via Google Pay are directly settled T+0 / T+1 to your linked merchant bank account. Record settlements here for accounting reconciliation.
              </p>
            </div>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="px-3.5 py-1.5 bg-[#698156] text-white rounded-xl font-bold shadow-sm hover:bg-[#546944] whitespace-nowrap"
            >
              + Record New Settlement
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/75 text-gray-500 text-xs uppercase font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Payout ID</th>
                    <th className="px-5 py-3.5">Bank Account</th>
                    <th className="px-5 py-3.5">Settlement UTR</th>
                    <th className="px-5 py-3.5">Settled Date</th>
                    <th className="px-5 py-3.5 text-right">Gross Amount</th>
                    <th className="px-5 py-3.5 text-right">Fee / Tax</th>
                    <th className="px-5 py-3.5 text-right">Net Transferred</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {payouts.length > 0 ? (
                    payouts.map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-gray-900">
                          {po.payout_id}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          <span className="font-mono">••••{po.bank_account_last4 || '4589'}</span>
                        </td>
                        <td className="px-5 py-4 font-mono text-gray-600">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {po.settlement_utr || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                          {po.settled_at}
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-gray-700">
                          {formatCurrency(po.gross_amount)}
                        </td>
                        <td className="px-5 py-4 text-right text-gray-400">
                          {formatCurrency(po.fee_amount + po.tax_amount)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[#698156] text-sm">
                          {formatCurrency(po.net_amount)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${getStatusBadge(po.status)}`}>
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                        <Building2 className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="font-medium">No payout settlement batches logged yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Use the "Record Bank Payout" button to register settlements received from your bank.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Payout Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#698156]/10 flex items-center justify-center text-[#698156]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-gray-900">Record Bank Settlement Payout</h3>
                </div>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePayout} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Gross Settlement Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25000"
                    value={newPayout.gross_amount}
                    onChange={(e) => setNewPayout({ ...newPayout, gross_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-[#698156] focus:outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Gateway Fee (₹)</label>
                    <input
                      type="number"
                      value={newPayout.fee_amount}
                      onChange={(e) => setNewPayout({ ...newPayout, fee_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-[#698156] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Tax / GST (₹)</label>
                    <input
                      type="number"
                      value={newPayout.tax_amount}
                      onChange={(e) => setNewPayout({ ...newPayout, tax_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-[#698156] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Bank Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4589"
                      value={newPayout.bank_account_last4}
                      onChange={(e) => setNewPayout({ ...newPayout, bank_account_last4: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-[#698156] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newPayout.status}
                      onChange={(e) => setNewPayout({ ...newPayout, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-[#698156] focus:outline-none"
                    >
                      <option value="Processed">Processed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Bank Settlement UTR / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR202610129948"
                    value={newPayout.settlement_utr}
                    onChange={(e) => setNewPayout({ ...newPayout, settlement_utr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-[#698156] focus:outline-none font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayout}
                    className="px-5 py-2 bg-[#698156] hover:bg-[#546944] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmittingPayout && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Settlement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
