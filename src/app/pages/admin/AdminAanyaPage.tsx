import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IndianRupee, ShoppingBag, Users, Package, ArrowUpRight,
  Plus, Trash2, Search, Store, X, RefreshCw, ChevronRight,
  Eye, Phone, Mail, MapPin, Sparkles, ImageIcon, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Link } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

/* ──────────── Types ──────────── */
interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: { name: string; images: string[] };
}

interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  method: string;
  status: string;
  amount: number;
  created_at: string;
}

interface DbProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  image_url?: string;
  description?: string;
  status: string;
  created_at?: string;
}

/* ──────────── Category colour map ──────────── */
const CAT_COLORS: Record<string, string> = {
  Sarees: '#800000',
  Kurtis: '#D4AF37',
  Lehengas: '#002D62',
  'Salwar Sets': '#047857',
  Western: '#7C3AED',
  Maxi: '#c2410c',
};

export function AdminAanyaPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers'>('overview');

  /* ── Data ── */
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [authUsers, setAuthUsers] = useState<any[]>([]);

  /* ── UI ── */
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  /* ── Add Product Form ── */
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Sarees',
    price: '',
    compare_at_price: '',
    image_url: '',
    description: '',
    status: 'Published',
  });

  /* ──────────── Load all real Supabase data ──────────── */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Products from Supabase 'products' table
      const { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('id, name, category, price, compare_at_price, images, image_url, description, status, created_at')
        .order('created_at', { ascending: false });

      if (prodsErr) console.warn('Products fetch error:', prodsErr.message);
      setDbProducts(prods || []);

      // 2. Orders from Supabase 'orders' table (with all columns including shipping_address)
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) console.warn('Orders fetch error:', ordersErr.message);
      setOrders(ordersData || []);

      // 3. Payments from Supabase 'payments' table
      const { data: paymentsData, error: paymentsErr } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsErr) console.warn('Payments fetch error:', paymentsErr.message);
      setPayments(paymentsData || []);

      // 4. Auth users list (admin only)
      try {
        const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
        if (!usersErr && usersData?.users) {
          setAuthUsers(usersData.users);
        }
      } catch {
        // admin.listUsers requires service role — try fallback via order user_ids
        if (ordersData && ordersData.length > 0) {
          // Build unique user list from orders shipping_address
          const seen = new Set<string>();
          const derived = ordersData
            .filter(o => {
              if (seen.has(o.user_id)) return false;
              seen.add(o.user_id);
              return true;
            })
            .map(o => ({
              id: o.user_id,
              email: o.shipping_address?.email || '—',
              user_metadata: {
                full_name: `${o.shipping_address?.first_name || ''} ${o.shipping_address?.last_name || ''}`.trim(),
                phone: o.shipping_address?.phone || '—',
                city: o.shipping_address?.city || '—',
                state: o.shipping_address?.state || '—',
              },
              created_at: o.created_at,
              orderCount: ordersData.filter(x => x.user_id === o.user_id).length,
            }));
          setAuthUsers(derived);
        }
      }
    } catch (err: any) {
      console.error('Admin loadData error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ──────────── Update order status ──────────── */
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order status');
      return;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success(`Order status updated to "${newStatus}"`);
  };

  /* ──────────── Delete product ──────────── */
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product from the Supabase catalog?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete product: ' + error.message);
      return;
    }
    setDbProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Product deleted');
  };

  /* ──────────── Add product to Supabase ──────────── */
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error('Name and price are required');
      return;
    }
    setAddingProduct(true);
    try {
      const imageValue = newProduct.image_url.trim();
      const payload = {
        name: newProduct.name.trim(),
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        compare_at_price: newProduct.compare_at_price ? parseFloat(newProduct.compare_at_price) : null,
        image_url: imageValue || null,
        images: imageValue ? [imageValue] : [],
        description: newProduct.description.trim() || null,
        status: newProduct.status,
      };

      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error) throw error;

      setDbProducts(prev => [data, ...prev]);
      toast.success('Product published to store catalog!');
      setIsAddModalOpen(false);
      setImagePreview('');
      setNewProduct({ name: '', category: 'Sarees', price: '', compare_at_price: '', image_url: '', description: '', status: 'Published' });
    } catch (err: any) {
      toast.error('Failed to add product: ' + (err.message || 'Unknown error'));
    } finally {
      setAddingProduct(false);
    }
  };

  /* ──────────── Computed values ──────────── */
  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0)
    || orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  const filteredProducts = dbProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build weekly revenue from real orders (last 7 days)
  const weeklyRevenue = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<string, number> = {};
    days.forEach(d => { map[d] = 0; });
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const day = days[d.getDay()];
      map[day] = (map[day] || 0) + (o.total_amount || 0);
    });
    return days.map(d => ({ name: d, sales: map[d] }));
  })();

  // Build category data from real products
  const categoryData = (() => {
    const map: Record<string, number> = {};
    dbProducts.forEach(p => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    const total = dbProducts.length || 1;
    return Object.entries(map).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: CAT_COLORS[name] || '#888',
    }));
  })();

  /* ──────────── Get product image ──────────── */
  const getProductImg = (p: DbProduct) =>
    (p.images && p.images.length > 0 ? p.images[0] : null) || p.image_url || '';

  /* ──────────── Status badge styles ──────────── */
  const statusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'shipped': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-900 pb-20">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo_aanya.png" alt="Aanya Fashions Logo" className="h-14 sm:h-16 w-auto object-contain hover:scale-105 transition-transform" />
            </Link>
            <div className="hidden sm:block border-l border-gray-300 pl-4 py-1">
              <span className="text-xs uppercase tracking-widest text-[#800000] font-black block">Admin Portal</span>
              <span className="text-sm font-serif font-bold text-gray-800">Aanya Fashions Executive Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all">
              <Store className="w-4 h-4 text-[#800000]" /> Storefront
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-[#800000] text-white hover:bg-black rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#800000] via-[#5c0000] to-[#2b0000] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" /> Live Supabase Data
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-wide">Aanya Fashions Admin</h1>
            <p className="text-gray-200 text-sm max-w-xl">
              All data here is pulled live from your Supabase database — orders, products, customers and payments.
            </p>
          </div>
          <button
            onClick={loadData}
            className="relative z-10 self-start sm:self-auto px-5 py-2.5 bg-[#D4AF37] text-gray-950 font-bold rounded-full text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center gap-2 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
          <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center pr-8">
            <img src="/logo_aanya.png" alt="" className="h-64 object-contain invert" />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard icon={<IndianRupee className="w-6 h-6 text-[#D4AF37]" />} bg="bg-amber-50"
            label="Total Revenue (Payments)" value={`₹${totalRevenue.toLocaleString('en-IN')}`} />
          <KPICard icon={<ShoppingBag className="w-6 h-6 text-[#800000]" />} bg="bg-rose-50"
            label="Total Orders Placed" value={`${orders.length} Orders`} />
          <KPICard icon={<Package className="w-6 h-6 text-[#002D62]" />} bg="bg-blue-50"
            label="Catalog Products" value={`${dbProducts.length} Items`} />
          <KPICard icon={<Users className="w-6 h-6 text-emerald-700" />} bg="bg-emerald-50"
            label="Customers (from Orders)" value={`${authUsers.length} Users`} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
          {(['overview', 'products', 'orders', 'customers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === tab ? 'border-[#800000] text-[#800000]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              {tab === 'overview' && 'Overview & Analytics'}
              {tab === 'products' && `Catalog Products (${dbProducts.length})`}
              {tab === 'orders' && `Customer Orders (${orders.length})`}
              {tab === 'customers' && `Customer Directory (${authUsers.length})`}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">

            {orders.length === 0 && payments.length === 0 && (
              <EmptyState icon={<ShoppingBag />} title="No orders yet" subtitle="Orders placed on the store will appear here in real time." />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Revenue */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg font-bold text-gray-900">Weekly Revenue</h3>
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">INR (₹) — Live Orders</span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#800000" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#800000" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="sales" stroke="#800000" strokeWidth={3} fillOpacity={1} fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">
                  Product Category Split
                </h3>
                {categoryData.length > 0 ? (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={4} dataKey="value">
                            {categoryData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => `${val}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-4 border-t border-gray-100 text-xs">
                      {categoryData.map(cat => (
                        <div key={cat.name} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="font-medium text-gray-700 truncate">{cat.name} ({cat.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No products yet</div>
                )}
              </div>
            </div>

            {/* Recent Orders quick-view */}
            {orders.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-gray-900">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                      <tr>
                        <th className="p-3.5">Order ID</th>
                        <th className="p-3.5">Customer</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.slice(0, 6).map(order => (
                        <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3.5 font-mono text-xs font-bold text-gray-900">#{String(order.id).slice(0, 8)}</td>
                          <td className="p-3.5 font-medium">
                            {order.shipping_address?.first_name
                              ? `${order.shipping_address.first_name} ${order.shipping_address.last_name || ''}`.trim()
                              : '—'}
                          </td>
                          <td className="p-3.5 font-bold text-[#800000]">₹{(order.total_amount || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3.5">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(order.status)}`}>{order.status || 'Pending'}</span>
                          </td>
                          <td className="p-3.5 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: PRODUCTS ── */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by name or category…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#800000]/25 transition-all"
                />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#800000] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Product
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <EmptyState icon={<Package />} title="No products in catalog" subtitle="Add your first product using the button above — it will be saved to Supabase." />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                      <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map(product => {
                        const img = getProductImg(product);
                        return (
                          <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-4">
                                {/* Square 1:1 image */}
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 aspect-square">
                                  {img ? (
                                    <img src={img} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <ImageIcon className="w-6 h-6" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-serif font-bold text-gray-900">{product.name}</h4>
                                  <span className="text-xs text-gray-400 line-clamp-1">{product.description || '—'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{product.category}</span>
                            </td>
                            <td className="p-4 font-bold text-[#800000]">
                              ₹{(product.price || 0).toLocaleString('en-IN')}
                              {product.compare_at_price && (
                                <span className="text-xs text-gray-400 line-through ml-1">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${product.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {product.status || 'Draft'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

        {/* ── TAB: ORDERS ── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <EmptyState icon={<ShoppingBag />} title="No orders yet" subtitle="When customers place orders, they will appear here directly from Supabase." />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="font-serif text-xl font-bold text-gray-900">All Customer Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                      <tr>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map(order => {
                        const addr = order.shipping_address || {};
                        const name = addr.first_name
                          ? `${addr.first_name} ${addr.last_name || ''}`.trim()
                          : '—';
                        return (
                          <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-4 font-mono text-xs font-bold text-gray-900">#{String(order.id).slice(0, 8)}</td>
                            <td className="p-4">
                              <div className="font-medium text-gray-900">{name}</div>
                              <div className="text-xs text-gray-400">{addr.city || ''}{addr.state ? `, ${addr.state}` : ''}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-xs text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {addr.phone || '—'}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {addr.email || '—'}</div>
                            </td>
                            <td className="p-4 font-bold text-[#800000]">₹{(order.total_amount || 0).toLocaleString('en-IN')}</td>
                            <td className="p-4 text-xs text-gray-600">{order.payment_method || '—'}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(order.status)}`}>
                                {order.status || 'Pending'}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                            <td className="p-4 text-right">
                              <select
                                value={order.status || 'Pending'}
                                onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold border border-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-[#800000]/25"
                              >
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

        {/* ── TAB: CUSTOMERS ── */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {authUsers.length === 0 ? (
              <EmptyState icon={<Users />} title="No customers yet" subtitle="Customers who place orders will appear here, built from real Supabase order data." />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="font-serif text-xl font-bold text-gray-900">Customer Directory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {authUsers.map(user => {
                    const meta = user.user_metadata || {};
                    const name = meta.full_name || meta.name || user.email?.split('@')[0] || 'Customer';
                    const city = meta.city || '—';
                    const state = meta.state || '';
                    const phone = meta.phone || '—';
                    const orderCount = user.orderCount ?? (orders.filter(o => o.user_id === user.id).length);
                    return (
                      <div key={user.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex gap-4 items-start">
                        <div className="w-14 h-14 bg-[#800000]/10 text-[#800000] rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 uppercase">
                          {name[0]}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-serif font-bold text-gray-900 truncate">{name}</span>
                            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex-shrink-0">{orderCount} Order{orderCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {user.email || '—'}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> {phone}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {city}{state ? `, ${state}` : ''}</div>
                          {user.created_at && (
                            <div className="text-xs text-gray-400">Joined {new Date(user.created_at).toLocaleDateString('en-IN')}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── Add Product Modal ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FDFBF7] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-200 shadow-2xl relative my-8"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-200/60 text-gray-600 transition-all">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <img src="/logo_aanya.png" alt="Aanya Logo" className="h-12 w-auto object-contain" />
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-900">Add New Product</h3>
                  <p className="text-xs text-gray-500">Saved to Supabase — instantly live in the store</p>
                </div>
              </div>

              <form onSubmit={handleAddProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Maroon Silk Saree"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25 cursor-pointer"
                    >
                      <option>Sarees</option>
                      <option>Kurtis</option>
                      <option>Lehengas</option>
                      <option>Salwar Sets</option>
                      <option>Western</option>
                      <option>Maxi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 4999"
                      value={newProduct.price}
                      onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Original / MRP Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 6999 (optional — shown as strikethrough)"
                    value={newProduct.compare_at_price}
                    onChange={e => setNewProduct({ ...newProduct, compare_at_price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25"
                  />
                </div>

                {/* Image URL input + vertical preview */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Product Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={newProduct.image_url}
                    onChange={e => {
                      setNewProduct({ ...newProduct, image_url: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25"
                  />
                  {/* Vertical image preview (portrait/saree ratio) */}
                  {imagePreview && (
                    <div className="mt-3 flex justify-center">
                      <div className="w-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full object-cover"
                          style={{ aspectRatio: '2/3' }}
                          onError={() => setImagePreview('')}
                        />
                      </div>
                    </div>
                  )}
                  {!imagePreview && (
                    <div className="mt-3 w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                      <ImageIcon className="w-4 h-4" /> Image preview will appear here
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Product details, fabric, care instructions…"
                    value={newProduct.description}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={addingProduct}
                    className="px-6 py-2.5 bg-[#800000] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-md disabled:opacity-60">
                    {addingProduct ? 'Publishing…' : 'Publish to Store'}
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

/* ──────── Helper components ──────── */

function KPICard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center`}>{icon}</div>
        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
      </div>
      <span className="text-xs uppercase tracking-wider font-bold text-gray-400">{label}</span>
      <div className="text-2xl font-serif font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-8 h-8' })}
      </div>
      <div>
        <h3 className="font-serif text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">{subtitle}</p>
      </div>
    </div>
  );
}
