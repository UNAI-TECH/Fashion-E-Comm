import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { IndianRupee, ShoppingBag, Users, Package, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '../../../lib/supabase';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  product_name: string;
  date: string;
  amount: number;
  status: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ name: string; sales: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch counts in parallel
      const [
        { count: totalOrders },
        { count: totalCustomers },
        { count: totalProducts },
        { data: orders },
        { data: recentOrdersData },
        { data: productsData }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'Published'),
        supabase.from('orders').select('total_amount, created_at, status'),
        supabase.from('orders')
          .select(`
            id,
            total_amount,
            status,
            created_at,
            shipping_address,
            order_items (
              products (name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('products').select('category').eq('status', 'Published')
      ]);

      // Calculate total revenue
      const totalRevenue = orders
        ? orders.reduce((acc, item) => acc + Number(item.total_amount || 0), 0)
        : 0;

      setStats({
        totalRevenue,
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
      });

      // Calculate monthly revenue
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = Array(12).fill(0);
      if (orders) {
        for (const order of orders) {
          const m = new Date(order.created_at).getMonth();
          monthlyData[m] += Number(order.total_amount || 0);
        }
      }
      setMonthlyRevenue(monthlyData.map((rev, i) => ({ name: months[i], sales: rev })));

      // Calculate category distribution
      if (productsData) {
        const catMap: Record<string, number> = {};
        for (const p of productsData) {
          const cat = p.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + 1;
        }
        setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));
      }

      // Format recent orders
      if (recentOrdersData) {
        setRecentOrders(recentOrdersData.map((o: any) => {
          const addr = o.shipping_address || {};
          const customerName = [addr.first_name, addr.last_name].filter(Boolean).join(' ') || 'Guest';
          const productName = o.order_items?.[0]?.products?.name || 'N/A';

          return {
            id: o.id,
            customer_name: customerName,
            product_name: productName,
            date: new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            amount: Number(o.total_amount || 0),
            status: o.status || 'Pending',
          };
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Processing': case 'Confirmed': case 'Packed': return 'bg-blue-100 text-blue-800';
      case 'Pending': case 'Order Placed': return 'bg-yellow-100 text-yellow-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statCards = [
    { name: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: IndianRupee },
    { name: 'Total Orders', value: stats.totalOrders.toLocaleString('en-IN'), icon: ShoppingBag },
    { name: 'Total Customers', value: stats.totalCustomers.toLocaleString('en-IN'), icon: Users },
    { name: 'Total Products', value: stats.totalProducts.toLocaleString('en-IN'), icon: Package },
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Revenue Chart */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview (Monthly)</h2>
          <div className="h-80">
            {monthlyRevenue.some(d => d.sales > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#698156" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#698156" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#6B7280" />
                  <YAxis axisLine={false} tickLine={false} stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1A1A1A', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#698156" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No revenue data yet. Orders will appear here once placed.
              </div>
            )}
          </div>
        </motion.div>

        {/* Category Performance */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6">Products by Category</h2>
          <div className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#6B7280" />
                  <YAxis axisLine={false} tickLine={false} stroke="#6B7280" />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#1A1A1A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No products uploaded yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{order.id.substring(0, 14)}...</td>
                    <td className="px-6 py-4">{order.customer_name}</td>
                    <td className="px-6 py-4">{order.product_name}</td>
                    <td className="px-6 py-4 text-gray-500">{order.date}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No orders yet. Orders will appear here once customers start buying.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
