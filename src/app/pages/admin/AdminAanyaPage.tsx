import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IndianRupee, ShoppingBag, Users, Package, ArrowUpRight, ArrowDownRight,
  Plus, Trash2, Search, Store, X, RefreshCw, ChevronRight,
  Phone, Mail, MapPin, Sparkles, ImageIcon, LayoutDashboard,
  ClipboardList, Tag, BarChart2, Settings, LogOut, Menu, ChevronLeft,
  CreditCard, TrendingUp, Star
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Link } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

/* ─── Types ─── */
interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: {
    first_name?: string; last_name?: string;
    email?: string; phone?: string;
    address?: string; city?: string; state?: string;
  };
  created_at: string;
}

interface Payment {
  id: string; order_id: string; user_id: string;
  method: string; status: string; amount: number; created_at: string;
}

interface DbProduct {
  id: string; name: string; category: string;
  price: number; compare_at_price?: number;
  images: string[]; image_url?: string;
  description?: string; status: string; created_at?: string;
}

interface DerivedUser {
  id: string; email: string; name: string;
  phone: string; city: string; state: string;
  orderCount: number; created_at: string;
}

/* ─── Category colours ─── */
const CAT_COLORS: Record<string, string> = {
  Sarees: '#800000', Kurtis: '#D4AF37', Lehengas: '#002D62',
  'Salwar Sets': '#047857', Western: '#7C3AED', Maxi: '#c2410c',
};

/* ─── Nav items ─── */
type NavTab = 'overview' | 'products' | 'orders' | 'customers' | 'payments';
const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',   label: 'Dashboard',       icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'products',   label: 'Catalog Products', icon: <Package className="w-5 h-5" /> },
  { id: 'orders',     label: 'Orders',           icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'customers',  label: 'Customers',        icon: <Users className="w-5 h-5" /> },
  { id: 'payments',   label: 'Payments',         icon: <CreditCard className="w-5 h-5" /> },
];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export function AdminAanyaPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* ── Data state ── */
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [customers, setCustomers]   = useState<DerivedUser[]>([]);

  /* ── UI ── */
  const [isLoading, setIsLoading]       = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [adding, setAdding]             = useState(false);
  const [imgPreview, setImgPreview]     = useState('');

  /* ── Form ── */
  const emptyForm = { name: '', category: 'Sarees', price: '', compare_at_price: '', image_url: '', description: '', status: 'Published' };
  const [form, setForm] = useState(emptyForm);

  /* ─── Load Supabase data ─── */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodsRes, ordersRes, paymentsRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
      ]);

      if (prodsRes.error)    console.warn('Products:', prodsRes.error.message);
      if (ordersRes.error)   console.warn('Orders:',   ordersRes.error.message);
      if (paymentsRes.error) console.warn('Payments:', paymentsRes.error.message);

      setDbProducts(prodsRes.data || []);
      const ordersData = ordersRes.data || [];
      setOrders(ordersData);
      setPayments(paymentsRes.data || []);

      /* Derive unique customers from orders */
      const seen = new Set<string>();
      const derived: DerivedUser[] = [];
      ordersData.forEach((o: Order) => {
        if (!seen.has(o.user_id)) {
          seen.add(o.user_id);
          const addr = o.shipping_address || {};
          const name = `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || 'Customer';
          derived.push({
            id: o.user_id,
            email: addr.email || '—',
            name,
            phone: addr.phone || '—',
            city: addr.city || '—',
            state: addr.state || '—',
            orderCount: ordersData.filter((x: Order) => x.user_id === o.user_id).length,
            created_at: o.created_at,
          });
        }
      });
      setCustomers(derived);

    } catch (err: any) {
      toast.error('Failed to load data from Supabase');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ─── Update order status → Supabase ─── */
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { toast.error('Update failed'); return; }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.success(`Order status → ${status}`);
  };

  /* ─── Delete product → Supabase ─── */
  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error('Delete failed: ' + error.message); return; }
    setDbProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Product deleted');
  };

  /* ─── Add product → Supabase ─── */
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    setAdding(true);
    try {
      const img = form.image_url.trim();
      const { data, error } = await supabase.from('products').insert({
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        image_url: img || null,
        images: img ? [img] : [],
        description: form.description.trim() || null,
        status: form.status,
      }).select().single();
      if (error) throw error;
      setDbProducts(prev => [data, ...prev]);
      toast.success('Product published to store!');
      setIsAddOpen(false); setImgPreview(''); setForm(emptyForm);
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    } finally { setAdding(false); }
  };

  /* ─── Derived metrics ─── */
  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0)
    || orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  /* Weekly revenue from real order dates */
  const weeklyData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]));
    orders.forEach(o => { const d = days[new Date(o.created_at).getDay()]; map[d] += (o.total_amount || 0); });
    return days.map(d => ({ day: d, revenue: map[d] }));
  })();

  /* Category split from real products */
  const catData = (() => {
    const map: Record<string, number> = {};
    dbProducts.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
    const total = dbProducts.length || 1;
    return Object.entries(map).map(([name, count]) => ({
      name, value: Math.round((count / total) * 100), color: CAT_COLORS[name] || '#aaa',
    }));
  })();

  /* Monthly revenue (last 6 months) from orders */
  const monthlyData = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const m = months[new Date(o.created_at).getMonth()];
      map[m] = (map[m] || 0) + (o.total_amount || 0);
    });
    return months.filter(m => map[m] > 0).map(m => ({ month: m, revenue: map[m] }));
  })();

  /* Status badge */
  const badge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'shipped':    return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'cancelled':  return 'bg-red-50 text-red-600 border border-red-200';
      case 'completed':  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:           return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  /* Product image */
  const prodImg = (p: DbProduct) =>
    (p.images && p.images.length > 0 ? p.images[0] : null) || p.image_url || '';

  /* Filtered products */
  const filtered = dbProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen bg-[#F7F5F0] overflow-hidden font-sans">

      {/* ═══ LEFT SIDEBAR ═══ */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full z-30 overflow-hidden shadow-sm"
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 min-h-[88px]">
          <Link to="/" className="flex-shrink-0">
            <img src="/logo_aanya.png" alt="Aanya Logo" className="h-16 w-auto object-contain" />
          </Link>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap">
                <div className="text-gray-900 font-serif font-bold text-sm leading-tight">Aanya Fashions</div>
                <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Admin Portal</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-5 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-pink-100 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-rose-50'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-pink-500' : ''}`}>{item.icon}</span>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-sm font-bold whitespace-nowrap overflow-hidden">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-2 h-2 bg-pink-400 rounded-full flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 pb-6 space-y-1 border-t border-gray-100 pt-4">
          <Link to="/"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-rose-50 transition-all"
            title={!sidebarOpen ? 'Storefront' : undefined}
          >
            <Store className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-bold">View Store</span>}
          </Link>
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-rose-50 transition-all cursor-pointer"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen
              ? <><ChevronLeft className="w-5 h-5 flex-shrink-0" /><span className="text-sm font-bold">Collapse</span></>
              : <Menu className="w-5 h-5 flex-shrink-0" />
            }
          </button>
        </div>
      </motion.aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-serif text-xl font-bold text-gray-900 capitalize">
              {activeTab === 'overview' ? 'Dashboard Overview' :
               activeTab === 'products' ? 'Catalog Products' :
               activeTab === 'orders' ? 'Customer Orders' :
               activeTab === 'customers' ? 'Customer Directory' : 'Payment Records'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Live data from Supabase · Last synced {new Date().toLocaleTimeString('en-IN')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold text-gray-700 transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing…' : 'Refresh'}
            </button>
            <button onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2 bg-[#800000] hover:bg-black text-white rounded-full text-xs font-bold shadow-md transition-all">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </header>

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ─── TAB: OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <IndianRupee className="w-5 h-5" />, color: 'text-[#D4AF37]', bg: 'bg-amber-50', sub: `${payments.length} payment records` },
                  { label: 'Total Orders', value: `${orders.length}`, icon: <ShoppingBag className="w-5 h-5" />, color: 'text-[#800000]', bg: 'bg-rose-50', sub: `${orders.filter(o => o.status === 'Delivered').length} delivered` },
                  { label: 'Products', value: `${dbProducts.length}`, icon: <Package className="w-5 h-5" />, color: 'text-blue-700', bg: 'bg-blue-50', sub: `${dbProducts.filter(p => p.status === 'Published').length} published` },
                  { label: 'Customers', value: `${customers.length}`, icon: <Users className="w-5 h-5" />, color: 'text-emerald-700', bg: 'bg-emerald-50', sub: 'from order records' },
                ].map(({ label, value, icon, color, bg, sub }) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">{label}</div>
                    <div className="text-2xl font-serif font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-400 mt-1">{sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Weekly Revenue Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-serif text-base font-bold text-gray-900">Weekly Revenue</h3>
                      <p className="text-xs text-gray-400">Live from orders table</p>
                    </div>
                    <span className="text-xs font-bold text-[#800000] bg-rose-50 px-3 py-1 rounded-full">INR ₹</span>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#800000" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#800000" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={11} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#800000" strokeWidth={2.5}
                          fillOpacity={1} fill="url(#revGrad)" dot={{ r: 3, fill: '#800000', strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Pie */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-serif text-base font-bold text-gray-900">Category Split</h3>
                    <p className="text-xs text-gray-400">Based on {dbProducts.length} catalog products</p>
                  </div>
                  {catData.length > 0 ? (
                    <>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={catData} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                              paddingAngle={3} dataKey="value">
                              {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: any) => `${v}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-1.5">
                        {catData.map(c => (
                          <div key={c.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="text-gray-600 truncate">{c.name} <span className="text-gray-400">({c.value}%)</span></span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">No products yet</div>
                  )}
                </div>
              </div>

              {/* Monthly Bar Chart */}
              {monthlyData.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-serif text-base font-bold text-gray-900">Monthly Revenue Breakdown</h3>
                      <p className="text-xs text-gray-400">Aggregated from all orders in Supabase</p>
                    </div>
                  </div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={11} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#800000" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent 5 orders */}
              {orders.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-base font-bold text-gray-900">Recent Orders</h3>
                    <button onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-1">
                      All Orders <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="text-xs uppercase font-bold text-gray-400 tracking-wider bg-gray-50">
                        <tr>
                          <th className="p-3 text-left">Order</th>
                          <th className="p-3 text-left">Customer</th>
                          <th className="p-3 text-left">Amount</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.slice(0, 5).map(o => {
                          const addr = o.shipping_address || {};
                          const name = `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || '—';
                          return (
                            <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="p-3 font-mono text-xs font-bold text-gray-800">#{String(o.id).slice(0, 8)}</td>
                              <td className="p-3 font-medium">{name}</td>
                              <td className="p-3 font-bold text-[#800000]">₹{(o.total_amount || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge(o.status)}`}>{o.status || 'Pending'}</span></td>
                              <td className="p-3 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {orders.length === 0 && !isLoading && (
                <EmptyCard icon={<ShoppingBag />} title="No orders yet" sub="Orders placed in the store will appear here from Supabase." />
              )}
            </div>
          )}

          {/* ─── TAB: PRODUCTS ─── */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input type="text" placeholder="Search products…"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/20 transition-all" />
                </div>
                <button onClick={() => setIsAddOpen(true)}
                  className="px-5 py-2.5 bg-[#800000] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {filtered.length === 0 ? (
                <EmptyCard icon={<Package />} title="No products" sub="Add your first product — it will be saved to Supabase and appear in your store immediately." />
              ) : (
                /*  ── Vertical image cards grid ── */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filtered.map(product => {
                    const img = prodImg(product);
                    return (
                      <motion.div key={product.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        {/* Vertical portrait image (2:3 ratio — good for sarees/kurtis) */}
                        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '2/3' }}>
                          {img ? (
                            <img src={img} alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <ImageIcon className="w-10 h-10" />
                            </div>
                          )}
                          {/* Status badge */}
                          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold ${
                            product.status === 'Published' ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
                            {product.status || 'Draft'}
                          </div>
                          {/* Delete button */}
                          <button onClick={() => deleteProduct(product.id)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-lg shadow-sm transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Category tag */}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white rounded-md text-xs font-bold backdrop-blur-sm">
                            {product.category}
                          </div>
                        </div>

                        {/* Info below image */}
                        <div className="p-3 space-y-1">
                          <h4 className="font-serif font-bold text-gray-900 text-sm leading-tight line-clamp-2">{product.name}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#800000] font-bold text-sm">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                            {product.compare_at_price && (
                              <span className="text-gray-400 line-through text-xs">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: ORDERS ─── */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              {orders.length === 0 ? (
                <EmptyCard icon={<ShoppingBag />} title="No orders yet" sub="Orders placed in the store will appear here from Supabase in real time." />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-gray-900">All Orders ({orders.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                        <tr>
                          {['Order ID', 'Customer', 'Contact', 'Amount', 'Payment', 'Status', 'Date', 'Update'].map(h => (
                            <th key={h} className="p-4 text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map(order => {
                          const addr = order.shipping_address || {};
                          const name = `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || '—';
                          return (
                            <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="p-4 font-mono text-xs font-bold text-gray-800">#{String(order.id).slice(0, 8)}</td>
                              <td className="p-4">
                                <div className="font-semibold text-gray-900">{name}</div>
                                <div className="text-xs text-gray-400">{addr.city || ''}{addr.state ? `, ${addr.state}` : ''}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-xs flex items-center gap-1 text-gray-600"><Phone className="w-3 h-3" />{addr.phone || '—'}</div>
                                <div className="text-xs flex items-center gap-1 text-gray-400"><Mail className="w-3 h-3" />{addr.email || '—'}</div>
                              </td>
                              <td className="p-4 font-bold text-[#800000]">₹{(order.total_amount || 0).toLocaleString('en-IN')}</td>
                              <td className="p-4 text-xs text-gray-600">{order.payment_method || '—'}</td>
                              <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge(order.status)}`}>{order.status || 'Pending'}</span></td>
                              <td className="p-4 text-xs text-gray-400 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="p-4">
                                <select value={order.status || 'Pending'}
                                  onChange={e => updateOrderStatus(order.id, e.target.value)}
                                  className="px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs font-bold border border-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-[#800000]/20">
                                  <option value="Pending">Pending</option>
                                  <option value="Order Placed">Order Placed</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: CUSTOMERS ─── */}
          {activeTab === 'customers' && (
            <div className="space-y-5">
              {customers.length === 0 ? (
                <EmptyCard icon={<Users />} title="No customers yet" sub="Customers who place orders will appear here, built from real Supabase order data." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {customers.map(cust => (
                    <motion.div key={cust.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
                      <div className="w-14 h-14 bg-[#800000]/10 text-[#800000] rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 uppercase">
                        {cust.name[0]}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-serif font-bold text-gray-900 leading-tight">{cust.name}</span>
                          <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            {cust.orderCount} order{cust.orderCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{cust.email}</span></div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{cust.phone}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{cust.city}{cust.state !== '—' ? `, ${cust.state}` : ''}</div>
                        <div className="text-xs text-gray-400">First order: {new Date(cust.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: PAYMENTS ─── */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              {payments.length === 0 ? (
                <EmptyCard icon={<CreditCard />} title="No payment records" sub="Payment records saved during checkout will appear here from Supabase." />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-serif text-base font-bold text-gray-900">Payment Records ({payments.length})</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Total collected: <span className="text-[#800000] font-bold">₹{payments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString('en-IN')}</span></p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                        <tr>
                          {['Payment ID', 'Order ID', 'Method', 'Amount', 'Status', 'Date'].map(h => (
                            <th key={h} className="p-4 text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payments.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="p-4 font-mono text-xs font-bold text-gray-800">#{String(p.id).slice(0, 8)}</td>
                            <td className="p-4 font-mono text-xs text-gray-500">#{String(p.order_id).slice(0, 8)}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">{p.method || '—'}</span>
                            </td>
                            <td className="p-4 font-bold text-[#800000]">₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                            <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge(p.status)}`}>{p.status || 'Pending'}</span></td>
                            <td className="p-4 text-xs text-gray-400 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ═══ ADD PRODUCT MODAL ═══ */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FDFBF7] rounded-3xl shadow-2xl max-w-lg w-full relative my-8 overflow-hidden">

              {/* Modal header */}
              <div className="bg-[#1A0A0A] px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo_aanya.png" alt="Aanya" className="h-10 w-10 object-contain invert brightness-200" />
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">Add New Product</h3>
                    <p className="text-xs text-[#D4AF37]">Saved directly to Supabase catalog</p>
                  </div>
                </div>
                <button onClick={() => setIsAddOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-300 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Product Title *</label>
                  <input type="text" required placeholder="e.g. Royal Maroon Silk Saree"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/20" />
                </div>

                {/* Category + Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/20 cursor-pointer">
                      {['Sarees','Kurtis','Lehengas','Salwar Sets','Western','Maxi'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Selling Price (₹) *</label>
                    <input type="number" required min="1" placeholder="e.g. 4999"
                      value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/20" />
                  </div>
                </div>

                {/* MRP */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Original / MRP (₹) — optional</label>
                  <input type="number" min="1" placeholder="e.g. 6999"
                    value={form.compare_at_price} onChange={e => setForm({ ...form, compare_at_price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/20" />
                </div>

                {/* Image URL + vertical preview side-by-side */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Product Image URL</label>
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <input type="url" placeholder="https://example.com/image.jpg"
                        value={form.image_url}
                        onChange={e => { setForm({ ...form, image_url: e.target.value }); setImgPreview(e.target.value); }}
                        className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/20" />
                      <p className="text-xs text-gray-400">Paste any HTTPS image URL — preview shows portrait format</p>
                    </div>
                    {/* Vertical portrait preview */}
                    <div className="flex-shrink-0 w-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm" style={{ aspectRatio: '2/3' }}>
                      {imgPreview ? (
                        <img src={imgPreview} alt="Preview" className="w-full h-full object-cover"
                          onError={() => setImgPreview('')} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Description</label>
                  <textarea rows={2} placeholder="Fabric, embroidery, care instructions…"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/20 resize-none" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsAddOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={adding}
                    className="px-6 py-2.5 bg-[#800000] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-md disabled:opacity-60 flex items-center gap-2">
                    {adding ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Publishing…</> : 'Publish to Store'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ── Helper: Empty state card ── */
function EmptyCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-8 h-8' })}
      </div>
      <div>
        <h3 className="font-serif text-xl font-bold text-gray-700">{title}</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">{sub}</p>
      </div>
    </div>
  );
}
