import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export function AdminAnalytics() {
  const [monthlyData, setMonthlyData] = useState<{ name: string; revenue: number; orders: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; sales: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [
        { data: orders },
        { data: orderItems }
      ] = await Promise.all([
        supabase.from('orders').select('total_amount, created_at, status'),
        supabase.from('order_items').select('quantity, product_id, products(category)')
      ]);

      // Monthly revenue & order count
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const revenueByMonth = Array(12).fill(0);
      const ordersByMonth = Array(12).fill(0);
      
      if (orders) {
        for (const order of orders) {
          const m = new Date(order.created_at).getMonth();
          revenueByMonth[m] += Number(order.total_amount || 0);
          ordersByMonth[m] += 1;
        }
      }

      setMonthlyData(months.map((name, i) => ({
        name,
        revenue: revenueByMonth[i],
        orders: ordersByMonth[i]
      })));

      // Category sales distribution
      if (orderItems) {
        const catMap: Record<string, number> = {};
        for (const item of orderItems) {
          const cat = (item as any).products?.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + (item.quantity || 1);
        }
        setCategoryData(
          Object.entries(catMap)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
        );
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#698156]" />
      </div>
    );
  }

  const hasRevenue = monthlyData.some(d => d.revenue > 0);
  const hasCategories = categoryData.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Growth (Monthly)</h2>
          <div className="h-80">
            {hasRevenue ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No revenue data yet.</div>
            )}
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6">Orders per Month</h2>
          <div className="h-80">
            {hasRevenue ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No order data yet.</div>
            )}
          </div>
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sales Distribution by Category</h2>
          <div className="h-80">
            {hasCategories ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Bar dataKey="sales" fill="#1A1A1A" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No sales data yet.</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
