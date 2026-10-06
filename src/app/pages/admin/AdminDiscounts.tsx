import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  status: string;
  usage: number;
  maxUses: number | null;
  expiry: string;
}

export function AdminDiscounts() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Coupon[] = (data || []).map((c: any) => ({
        id: c.id,
        code: c.code,
        type: c.discount_type || 'Percentage',
        value: Number(c.discount_value || 0),
        status: c.status || 'Active',
        usage: c.usage_count || 0,
        maxUses: c.max_uses,
        expiry: c.expires_at
          ? new Date(c.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'No Expiry',
      }));

      setCoupons(formatted);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (currentStatus === 'Expired') return;
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setCoupons(coupons.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Coupon ${newStatus === 'Active' ? 'resumed' : 'paused'}`);
    } catch (error: any) {
      toast.error('Failed to update coupon: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('Coupon deleted');
    } catch (error: any) {
      toast.error('Failed to delete coupon: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Expired': return 'bg-red-50 text-red-600';
      case 'Paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#698156]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#546944] transition-colors">
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {coupons.length > 0 ? (
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
                    <div className="text-xs font-semibold text-[#698156] uppercase tracking-wider mb-1">{coupon.type} Discount</div>
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
                    <span className="font-medium text-gray-900">{coupon.usage} / {coupon.maxUses || 'Unlimited'}</span>
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
                     <button 
                       onClick={() => handleDelete(coupon.id)}
                       className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                )}
             </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
          No coupons created yet. Click "Create Coupon" to get started.
        </div>
      )}
    </div>
  );
}
