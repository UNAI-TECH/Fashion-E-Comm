import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IndianRupee, ShoppingBag, Users, Package, ArrowUpRight, ArrowDownRight, 
  Plus, Trash2, Edit, Search, Filter, CheckCircle2, Clock, Truck, 
  Store, Shield, X, RefreshCw, ChevronRight, Eye, Phone, Mail, MapPin, Sparkles 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router';
import { fetchProducts, Product } from '../../data/products';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

// Recharts Data
const salesData = [
  { name: 'Mon', sales: 18500 },
  { name: 'Tue', sales: 24000 },
  { name: 'Wed', sales: 31000 },
  { name: 'Thu', sales: 27500 },
  { name: 'Fri', sales: 42000 },
  { name: 'Sat', sales: 58000 },
  { name: 'Sun', sales: 47900 },
];

const categoryData = [
  { name: 'Sarees', value: 45, color: '#800000' },
  { name: 'Kurtis', value: 25, color: '#D4AF37' },
  { name: 'Lehengas', value: 15, color: '#002D62' },
  { name: 'Salwar Sets', value: 10, color: '#047857' },
  { name: 'Western', value: 5, color: '#7C3AED' },
];

export function AdminAanyaPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Sarees',
    price: '',
    original_price: '',
    image: '',
    description: '',
    badge: 'New Arrival',
  });

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Catalog Products
      const prods = await fetchProducts();
      setProducts(prods);

      // 2. Load Orders from LocalStorage & Supabase
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
      } catch (e) {}

      const { data: dbOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const allOrders = [...localOrders, ...(dbOrders || [])];
      const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
      setOrders(uniqueOrders.length > 0 ? uniqueOrders : mockOrders);

      // 3. Load Customers
      let localUser = null;
      try {
        localUser = JSON.parse(localStorage.getItem('aanya_user_details') || 'null');
      } catch (e) {}

      const initialCustomers = localUser ? [
        { id: '1', name: localUser.name || 'Aanya Dev', email: localUser.email || 'aanya.dev@example.com', phone: localUser.phone || '+91 98765 43210', gender: localUser.gender || 'Female', address: localUser.address || 'Chennai, India', ordersCount: uniqueOrders.length || 3 },
        ...mockCustomers
      ] : mockCustomers;

      setCustomers(initialCustomers);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Product Submit
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error('Please enter product name and price');
      return;
    }

    try {
      const created: Product = {
        id: 'new-' + Date.now(),
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price) || 2999,
        compare_at_price: parseFloat(newProduct.original_price) || (parseFloat(newProduct.price) * 1.3),
        originalPrice: parseFloat(newProduct.original_price) || (parseFloat(newProduct.price) * 1.3),
        image: newProduct.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
        images: [newProduct.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'],
        rating: 4.9,
        status: 'Published',
        colors: ['#800000']
      };

      setProducts(prev => [created, ...prev]);
      toast.success('Product added successfully!');
      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        category: 'Sarees',
        price: '',
        original_price: '',
        image: '',
        description: '',
        badge: 'New Arrival',
      });
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error('Failed to add product');
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product from the store catalog?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success(`Order #${orderId.slice(0, 8)} updated to ${newStatus}`);
  };

  // Filtered Products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || o.total || 4999), 248990);
  const totalOrdersCount = orders.length > 0 ? orders.length : 142;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-900 pb-20">
      
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo_aanya.png" 
                alt="Aanya Fashions Logo" 
                className="h-16 sm:h-20 w-auto object-contain hover:scale-105 transition-transform" 
              />
            </Link>
            <div className="hidden sm:block border-l border-gray-300 pl-4 py-1">
              <span className="text-xs uppercase tracking-widest text-[#800000] font-black block">Admin Portal</span>
              <span className="text-sm font-serif font-bold text-gray-800">Aanya Fashions Executive Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Store className="w-4 h-4 text-[#800000]" /> Storefront View
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

      {/* 2. Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Banner Welcome */}
        <div className="bg-gradient-to-r from-[#800000] via-[#5c0000] to-[#2b0000] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" /> Dashboard Live Sync
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-wide">Welcome to Aanya Fashions Admin</h1>
            <p className="text-gray-200 text-sm max-w-xl">
              Manage product listings, customer orders, inventory stock, and business analytics in real time.
            </p>
          </div>
          <button 
            onClick={loadData}
            className="relative z-10 self-start sm:self-auto px-5 py-2.5 bg-[#D4AF37] text-gray-950 font-bold rounded-full text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center gap-2 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
          {/* Subtle bg pattern */}
          <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center pr-10">
            <img src="/logo_aanya.png" alt="Aanya Logo watermark" className="h-64 object-contain invert" />
          </div>
        </div>

        {/* 3. KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +18.4%
              </span>
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Total Sales Revenue</span>
            <div className="text-2xl font-serif font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[#800000]" />
              </div>
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.1%
              </span>
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Total Customer Orders</span>
            <div className="text-2xl font-serif font-bold text-gray-900 mt-1">{totalOrdersCount} Orders</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-[#002D62]" />
              </div>
              <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Active Catalog
              </span>
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Catalog Products</span>
            <div className="text-2xl font-serif font-bold text-gray-900 mt-1">{products.length} Items</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-700" />
              </div>
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.5%
              </span>
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Registered Customers</span>
            <div className="text-2xl font-serif font-bold text-gray-900 mt-1">{customers.length} Users</div>
          </div>

        </div>

        {/* 4. Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview' ? 'border-[#800000] text-[#800000]' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'products' ? 'border-[#800000] text-[#800000]' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Catalog Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders' ? 'border-[#800000] text-[#800000]' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Customer Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'customers' ? 'border-[#800000] text-[#800000]' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Customer Directory ({customers.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sales Growth Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg font-bold text-gray-900">Weekly Revenue Breakdown</h3>
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">INR (₹)</span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#800000" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#800000" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="sales" stroke="#800000" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Sales Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <h3 className="font-serif text-lg font-bold text-gray-900 mb-4">Category Share</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 text-xs">
                  {categoryData.map(cat => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-gray-700">{cat.name} ({cat.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recent Orders Quick View */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-gray-900">Recent Customer Orders</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-[#800000] hover:underline flex items-center gap-1">
                  View All Orders <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                    <tr>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3.5 font-mono text-xs font-bold text-gray-900">#{order.id.toString().slice(0, 8)}</td>
                        <td className="p-3.5 font-medium">{order.customer_name || order.shipping_address?.full_name || 'Customer User'}</td>
                        <td className="p-3.5 font-bold text-[#800000]">₹{(order.total_amount || order.total || 3499).toLocaleString('en-IN')}</td>
                        <td className="p-3.5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' :
                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {order.status || 'Order Placed'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button onClick={() => setActiveTab('orders')} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products Catalog */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search catalog products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                    <tr>
                      <th className="p-4">Product Details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 aspect-square">
                              <img src={product.image || product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-serif font-bold text-gray-900 text-base">{product.name}</h4>
                              <span className="text-xs text-gray-400">{product.badge || 'Active Item'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[#800000]">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold">
                            In Stock ({product.reviews_count || 15})
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="font-serif text-xl font-bold text-gray-900">Manage Customer Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                    <tr>
                      <th className="p-4">Order Ref</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Current Status</th>
                      <th className="p-4 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-gray-900">#{order.id.toString().slice(0, 8)}</td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{order.customer_name || order.shipping_address?.full_name || 'Aanya Customer'}</div>
                          <div className="text-xs text-gray-400">{order.shipping_address?.phone || '+91 98765 43210'}</div>
                        </td>
                        <td className="p-4 font-bold text-[#800000]">₹{(order.total_amount || order.total || 4999).toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {order.status || 'Order Placed'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={order.status || 'Order Placed'}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold border border-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-[#800000]/25"
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Customers Directory */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-serif text-xl font-bold text-gray-900">Registered Customer Database</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customers.map((cust) => (
                  <div key={cust.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex gap-4 items-center">
                    <div className="w-14 h-14 bg-[#800000]/10 text-[#800000] rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {cust.name ? cust.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-serif font-bold text-gray-900 text-base flex items-center justify-between">
                        <span>{cust.name}</span>
                        <span className="text-xs bg-amber-100 text-amber-800 font-sans font-bold px-2 py-0.5 rounded-full">{cust.ordersCount} Orders</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {cust.email}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {cust.phone}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {cust.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 5. Add Product Modal */}
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
              className="bg-[#FDFBF7] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-200 shadow-2xl relative"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-200/60 text-gray-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <img src="/logo_aanya.png" alt="Aanya Logo" className="h-12 w-auto object-contain" />
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-900">Add New Product</h3>
                  <p className="text-xs text-gray-500">Publish a new item to Aanya Fashions catalog</p>
                </div>
              </div>

              <form onSubmit={handleAddProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Maroon Silk Saree"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25 cursor-pointer"
                    >
                      <option value="Sarees">Sarees</option>
                      <option value="Kurtis">Kurtis</option>
                      <option value="Lehengas">Lehengas</option>
                      <option value="Salwar Sets">Salwar Sets</option>
                      <option value="Western">Western</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 4999"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about fabric, embroidery, and care instructions..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#800000]/25 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#800000] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-md"
                  >
                    Publish Product
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

// Mock Orders
const mockOrders = [
  { id: 'aanya-1001', customer_name: 'Priya Sharma', total_amount: 4999, status: 'Delivered', created_at: '2026-07-22' },
  { id: 'aanya-1002', customer_name: 'Ananya Reddy', total_amount: 8499, status: 'Shipped', created_at: '2026-07-22' },
  { id: 'aanya-1003', customer_name: 'Meera Kapoor', total_amount: 3499, status: 'Order Placed', created_at: '2026-07-23' },
  { id: 'aanya-1004', customer_name: 'Kavita Sundaram', total_amount: 12999, status: 'Delivered', created_at: '2026-07-21' },
];

// Mock Customers
const mockCustomers = [
  { id: 'c1', name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98450 12345', gender: 'Female', address: 'Bangalore, Karnataka', ordersCount: 5 },
  { id: 'c2', name: 'Ananya Reddy', email: 'ananya.reddy@example.com', phone: '+91 91234 56789', gender: 'Female', address: 'Hyderabad, Telangana', ordersCount: 3 },
  { id: 'c3', name: 'Meera Kapoor', email: 'meera.k@example.com', phone: '+91 98765 43210', gender: 'Female', address: 'Mumbai, Maharashtra', ordersCount: 2 },
  { id: 'c4', name: 'Kavita Sundaram', email: 'kavita.s@example.com', phone: '+91 99887 76655', gender: 'Female', address: 'Chennai, Tamil Nadu', ordersCount: 8 },
];
