import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, IndianRupee, HandCoins, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface PaymentTransaction {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  status: string;
  date: string;
}

export function AdminPayments() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingSettlements: 0, refundsProcessed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      // If no payments table data, fall back to orders for payment info
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, payment_method, payment_status, created_at')
        .order('created_at', { ascending: false });

      // Build transactions from either payments or orders
      let formattedTxns: PaymentTransaction[] = [];

      if (payments && payments.length > 0) {
        formattedTxns = payments.map((p: any) => ({
          id: p.id.substring(0, 12),
          order_id: p.order_id || 'N/A',
          method: p.method || 'N/A',
          amount: Number(p.amount || 0),
          status: p.status || 'Pending',
          date: new Date(p.created_at).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
        }));
      } else if (orders && orders.length > 0) {
        // Use order data as payment transactions
        formattedTxns = orders.map((o: any) => ({
          id: `TXN-${o.id.substring(4, 14)}`,
          order_id: o.id,
          method: o.payment_method || 'N/A',
          amount: Number(o.total_amount || 0),
          status: o.payment_status || 'Pending',
          date: new Date(o.created_at).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
        }));
      }

      setTransactions(formattedTxns);

      // Calculate stats from orders
      if (orders) {
        const totalRevenue = orders
          .filter(o => o.payment_status === 'Success' || o.payment_status === 'Completed')
          .reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

        const pendingSettlements = orders
          .filter(o => o.payment_status === 'Pending')
          .reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

        const refundsProcessed = orders
          .filter(o => o.payment_status === 'Refunded')
          .reduce((acc, o) => acc + Number(o.total_amount || 0), 0);

        setStats({ totalRevenue, pendingSettlements, refundsProcessed });
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success': case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statCards = [
    { name: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: IndianRupee },
    { name: 'Pending Settlements', value: formatCurrency(stats.pendingSettlements), icon: HandCoins },
    { name: 'Refunds Processed', value: formatCurrency(stats.refundsProcessed), icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#698156]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payments & Transactions</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-[#698156]" />
              </div>
            </div>
            <div className="text-gray-500 text-sm mb-1">{stat.name}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-bold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {transactions.length > 0 ? transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-500">{txn.id}</td>
                  <td className="px-6 py-4 text-[#698156] font-medium font-mono text-xs">{txn.order_id}</td>
                  <td className="px-6 py-4 text-gray-500">{txn.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{txn.method}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(txn.amount)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusBadge(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    No transactions yet. Payment data will appear once orders are placed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
