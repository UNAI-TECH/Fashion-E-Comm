import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, ArrowUpRight, ArrowDownRight, IndianRupee, HandCoins } from 'lucide-react';

const paymentTransactions = [
  { id: 'TXN-982374', orderId: '#ORD-001', method: 'UPI', amount: 2999, status: 'Success', date: '25 Mar, 2026, 14:30' },
  { id: 'TXN-982375', orderId: '#ORD-002', method: 'Credit Card', amount: 14999, status: 'Success', date: '25 Mar, 2026, 12:15' },
  { id: 'TXN-982376', orderId: '#ORD-003', method: 'Cash on Delivery', amount: 999, status: 'Pending', date: '24 Mar, 2026, 09:45' },
  { id: 'TXN-982377', orderId: '#ORD-004', method: 'UPI', amount: 3450, status: 'Failed', date: '24 Mar, 2026, 08:20' },
  { id: 'TXN-982378', orderId: '#ORD-005', method: 'Net Banking', amount: 5999, status: 'Refunded', date: '23 Mar, 2026, 16:10' },
];

export function AdminPayments() {
  const stats = [
    { name: 'Total Revenue', value: '₹12,45,000', change: '+12.5%', isPositive: true, icon: IndianRupee },
    { name: 'Pending Settlements', value: '₹45,200', change: '-4.2%', isPositive: false, icon: HandCoins },
    { name: 'Refunds Processed', value: '₹12,500', change: '+2.1%', isPositive: true, icon: CreditCard },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payments & Transactions</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${stat.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
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
              {paymentTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-500">{txn.id}</td>
                  <td className="px-6 py-4 text-[#D4AF37] hover:underline cursor-pointer font-medium">{txn.orderId}</td>
                  <td className="px-6 py-4 text-gray-500">{txn.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{txn.method}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">₹{txn.amount}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusBadge(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
