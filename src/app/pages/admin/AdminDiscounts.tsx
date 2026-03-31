import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

const initialCoupons = [
  { id: 1, code: 'SPRING50', type: 'Percentage', value: 50, status: 'Active', usage: 145, maxUses: 500, expiry: '30 Apr, 2026' },
  { id: 2, code: 'WELCOME200', type: 'Fixed', value: 200, status: 'Active', usage: 1200, maxUses: 'Unlimited', expiry: 'None' },
  { id: 3, code: 'FESTIVE25', type: 'Percentage', value: 25, status: 'Expired', usage: 850, maxUses: 1000, expiry: '10 Jan, 2026' },
];

export function AdminDiscounts() {
  const [coupons, setCoupons] = useState(initialCoupons);

  const toggleStatus = (id: number, currentStatus: string) => {
     if(currentStatus === 'Expired') return;
     const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
     setCoupons(coupons.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Expired': return 'bg-gray-100 text-gray-800 border bg-red-50 text-red-600';
      case 'Paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-black transition-colors">
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon, i) => (
           <motion.div
            key={coupon.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl shadow-sm border p-6 relative group ${coupon.status === 'Expired' ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100'}`}
           >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">{coupon.type} Discount</div>
                  <h3 className="text-2xl font-bold font-mono tracking-tight text-gray-900 border-2 border-dashed border-gray-300 inline-block px-3 py-1 rounded-lg">
                    {coupon.code}
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(coupon.status)}`}>
                  {coupon.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount Value:</span>
                  <span className="font-bold text-gray-900">{coupon.type === 'Percentage' ? `${coupon.value}%` : `₹${coupon.value}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Usage:</span>
                  <span className="font-medium text-gray-900">{coupon.usage} / {coupon.maxUses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expires On:</span>
                  <span className="font-medium text-gray-900">{coupon.expiry}</span>
                </div>
              </div>

              {coupon.status !== 'Expired' && (
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                   <button 
                     onClick={() => toggleStatus(coupon.id, coupon.status)}
                     className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                   >
                     {coupon.status === 'Active' ? 'Pause Campaign' : 'Resume Campaign'}
                   </button>
                   <button className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              )}
           </motion.div>
        ))}
      </div>
    </div>
  );
}
