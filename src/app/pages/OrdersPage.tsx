import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, Clock, X, FileText, RotateCcw, MessageSquare, ChevronRight, Ban, CheckCircle2, ShoppingBag, HeadphonesIcon, Search, ListFilter, ArrowDownUp, Download, RefreshCcw, Star } from 'lucide-react';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router';
import { toast } from 'sonner';

type OrderStatus = 'Order Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned' | 'Refunded';
import React from 'react';

export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [sortBy, setSortBy] = useState('Newest First');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } catch(e) {
        console.warn('Auth check skipped:', e);
      }

      let fetchedDbOrders: any[] = [];
      if (user?.id) {
        // Authenticated user: fetch their orders strictly
        const { data: dbData, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && dbData) {
          fetchedDbOrders = dbData;
        }
      }

      // Fetch local storage placed orders cache as a fallback for guest checkouts or network errors
      let localOrders: any[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
        if (Array.isArray(parsed)) {
          localOrders = parsed;
        } else {
          localStorage.setItem('local_placed_orders', '[]');
        }
      } catch (e) {
        console.error('LocalStorage parse error:', e);
      }

      // Combine local cache and database orders intelligently
      const orderMap = new Map();
      
      // If user is not logged in, we rely purely on their local cache.
      if (!user?.id) {
        localOrders.forEach(o => orderMap.set(o.id, o));
      } else {
        // If logged in, prioritize DB, but patch with local cache if DB has missing product data
        localOrders.forEach(o => orderMap.set(o.id, o));
        fetchedDbOrders.forEach(o => {
          const existing = orderMap.get(o.id);
          if (existing && existing.order_items && existing.order_items.length > 0) {
            const dbHasProducts = o.order_items && o.order_items.length > 0 && o.order_items[0].products;
            if (!dbHasProducts) {
              orderMap.set(o.id, { ...o, order_items: existing.order_items });
              return;
            }
          }
          orderMap.set(o.id, o);
        });
      }
      
      const uniqueOrders = Array.from(orderMap.values()).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(uniqueOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error("Could not sync latest orders. Showing offline cache.");
      try {
        const parsed = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
        if (Array.isArray(parsed)) {
          setOrders(parsed);
        }
      } catch(e) {}
    } finally {
      setIsLoading(false);
    }
  };

  const computedOrders = React.useMemo(() => {
    let result = [...orders];

    // 1. Search Logic
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => {
        const firstItem = o.order_items?.[0];
        const productName = (firstItem?.products?.name || '').toLowerCase();
        const brandName = (firstItem?.products?.brand || 'aanya exclusive').toLowerCase();
        const categoryName = (firstItem?.products?.category || '').toLowerCase();
        const orderId = (o.id || '').toLowerCase();
        return productName.includes(q) || brandName.includes(q) || orderId.includes(q) || categoryName.includes(q);
      });
    }

    // 2. Filter Logic
    if (activeFilter !== 'All Orders') {
      result = result.filter(o => {
        const s = o.status || 'Order Placed';
        if (activeFilter === 'Processing') return ['Order Placed', 'Pending', 'Confirmed', 'Packed'].includes(s);
        return s === activeFilter;
      });
    }

    // 3. Sort Logic
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      
      const priceA = a.order_items?.[0]?.price_at_time || a.order_items?.[0]?.price || a.order_items?.[0]?.products?.price || a.total_amount || 0;
      const priceB = b.order_items?.[0]?.price_at_time || b.order_items?.[0]?.price || b.order_items?.[0]?.products?.price || b.total_amount || 0;

      if (sortBy === 'Newest First') return dateB - dateA;
      if (sortBy === 'Oldest First') return dateA - dateB;
      if (sortBy === 'Highest Price') return priceB - priceA;
      if (sortBy === 'Lowest Price') return priceA - priceB;
      return 0;
    });

    return result;
  }, [orders, searchQuery, activeFilter, sortBy]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status || 'Order Placed';
    if (['Order Placed', 'Pending', 'Confirmed', 'Packed'].includes(s)) {
      return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Processing</span>;
    }
    if (['Shipped', 'Out for Delivery'].includes(s)) {
      return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {s}</span>;
    }
    if (['Delivered'].includes(s)) {
      return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>;
    }
    if (['Cancelled'].includes(s)) {
      return <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold flex items-center gap-1.5"><Ban className="w-3.5 h-3.5" /> Cancelled</span>;
    }
    return <span className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-bold flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> {s}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AnnouncementBar />
      
      {/* Custom Header */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 h-16 flex items-center px-4 sm:px-6">
        <div className="flex-1 flex justify-start">
          <Link to="/" className="h-11 sm:h-12 overflow-visible flex items-center">
            <img
              src="/logo.png"
              alt="Aanya Fashions"
              className="h-full w-auto object-contain object-left"
            />
          </Link>
        </div>
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl sm:text-2xl font-black font-serif text-gray-900 tracking-wide uppercase">My Orders</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Link to="/" className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors border border-gray-200 text-gray-700 shadow-sm">
            <X className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="pt-24 sm:pt-28 pb-10 px-4 max-w-6xl mx-auto text-gray-900">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-serif text-gray-900 mb-2">Order History</h2>
            <p className="text-gray-500">Track, return, or buy your favorite styles again.</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="px-6 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
          >
            Refresh List
          </button>
        </div>

        {/* Filters, Search & Sort Bar */}
        {!isLoading && orders.length > 0 && (
          <div className="mb-8 space-y-4">
            {/* Search & Sort */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Product, Brand, or Order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156] transition-shadow shadow-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="relative z-20">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium flex items-center justify-between min-w-[200px] hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <ArrowDownUp className="w-4 h-4 text-gray-400" /> {sortBy}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isSortDropdownOpen ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isSortDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      {['Newest First', 'Oldest First', 'Highest Price', 'Lowest Price'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setSortBy(opt); setIsSortDropdownOpen(false); }}
                          className={`w-full text-left px-5 py-3 text-sm hover:bg-gray-50 transition-colors ${sortBy === opt ? 'font-bold text-[#698156] bg-[#698156]/10' : 'text-gray-700'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
              {['All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                    activeFilter === tab 
                      ? 'bg-gray-900 text-white border-transparent' 
                      : 'bg-white text-gray-600 border-gray-200 border hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#698156]"></div>
          </div>
        ) : computedOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Package className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-serif text-gray-700 mb-4">No orders found</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Looks like you haven't placed any orders matching this criteria yet.</p>
            <button onClick={() => { setSearchQuery(''); setActiveFilter('All Orders'); }} className="px-8 py-3 bg-[#698156] text-white rounded-full font-bold text-sm shadow-md hover:bg-[#546944] transition-all">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {computedOrders.map((order, idx) => {
                const orderDate = new Date(order.created_at || Date.now());
                const deliveryDate = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000);
                const firstItem = order.order_items?.[0];
                const productImage = firstItem?.products?.images?.[0] || firstItem?.products?.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600';
                const productName = firstItem?.products?.name || 'Designer Fashion Apparel';
                const quantity = firstItem?.quantity || 1;
                const basePrice = firstItem?.price_at_time || firstItem?.price || firstItem?.products?.price || order.total_amount;
                const status = order.status || 'Order Placed';
                
                // Mocks for rich display based on user requirements
                const brandName = "Aanya Exclusive";
                const sizeMock = "M (Standard)";
                const colorMock = "Designer Palette";
                const discount = 15; // 15% off mock

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={order.id} 
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300"
                  >
                    {/* Top Order Meta Bar */}
                    <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm">
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-0.5">Order Placed</p>
                          <p className="font-medium text-gray-900">{orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-0.5">Total</p>
                          <p className="font-medium text-gray-900">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-0.5">Dispatch To</p>
                          <p className="font-medium text-[#698156] cursor-pointer hover:underline">{order.shipping_address?.full_name || order.shipping_address?.first_name || 'Customer'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 uppercase text-[10px] font-bold tracking-wider mb-0.5">Order ID</p>
                        <p className="font-mono text-gray-900 font-medium text-xs">#{order.id.substring(0, 12).toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-6 flex flex-col md:flex-row gap-6 lg:gap-8">
                      {/* Product Image */}
                      <div className="w-32 h-44 sm:w-40 sm:h-52 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 relative group">
                        <img 
                          src={productImage} 
                          alt={productName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                      </div>

                      {/* Product Details Grid */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{productName}</h3>
                              <p className="text-sm font-medium text-gray-500 mt-1">by {brandName}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 mt-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Color</p>
                              <p className="text-sm font-semibold text-gray-900">{colorMock}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Size</p>
                              <p className="text-sm font-semibold text-gray-900">{sizeMock}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Quantity</p>
                              <p className="text-sm font-semibold text-gray-900">Qty: {quantity}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                              <p className="text-sm font-semibold text-gray-900">₹{Number(basePrice).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status & Payment info with Progress Tracker */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          {/* Progress Tracker UI */}
                          <div className="mb-6 relative">
                            <div className="absolute top-3 left-0 w-full h-1 bg-gray-100 rounded-full z-0 overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                style={{ 
                                  width: status === 'Delivered' ? '100%' : 
                                         status === 'Out for Delivery' ? '80%' : 
                                         status === 'Shipped' ? '60%' : 
                                         status === 'Packed' ? '40%' : 
                                         ['Confirmed', 'Order Placed', 'Pending'].includes(status) ? '20%' : '0%' 
                                }}
                              />
                            </div>
                            <div className="relative z-10 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white ${['Confirmed', 'Order Placed', 'Pending', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].includes(status) ? 'border-emerald-500 text-emerald-500' : 'border-gray-200'}`}>1</div>
                                <span className={['Confirmed', 'Order Placed', 'Pending', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].includes(status) ? 'text-gray-900' : ''}>Placed</span>
                              </div>
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white ${['Packed', 'Shipped', 'Out for Delivery', 'Delivered'].includes(status) ? 'border-emerald-500 text-emerald-500' : 'border-gray-200'}`}>2</div>
                                <span className={['Packed', 'Shipped', 'Out for Delivery', 'Delivered'].includes(status) ? 'text-gray-900' : ''}>Packed</span>
                              </div>
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white ${['Shipped', 'Out for Delivery', 'Delivered'].includes(status) ? 'border-emerald-500 text-emerald-500' : 'border-gray-200'}`}>3</div>
                                <span className={['Shipped', 'Out for Delivery', 'Delivered'].includes(status) ? 'text-gray-900' : ''}>Shipped</span>
                              </div>
                              <div className="flex flex-col items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white ${status === 'Delivered' ? 'border-emerald-500 text-emerald-500 bg-emerald-50' : 'border-gray-200'}`}><CheckCircle2 className="w-4 h-4" /></div>
                                <span className={status === 'Delivered' ? 'text-emerald-600' : ''}>Delivered</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {getStatusBadge(status)}
                              {['Order Placed', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery'].includes(status) && (
                                <p className="text-sm font-medium text-gray-600">Arriving by <strong className="text-gray-900">{deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong></p>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-500 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                              <span className="font-medium text-gray-900">{order.payment_method || 'Card'}</span>
                              <span>•</span>
                              <span className={order.payment_status === 'Success' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                                {order.payment_status || 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="bg-gray-50/50 border-t border-gray-100 p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => toast.success('Tracking information will be sent to your email.')} className="px-4 py-2 bg-gray-900 text-white hover:bg-[#546944] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                          <Truck className="w-3.5 h-3.5" /> Track Order
                        </button>
                        <button onClick={() => toast.success('Downloading Invoice...')} className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                          <Download className="w-3.5 h-3.5" /> Invoice
                        </button>
                        {status === 'Delivered' && (
                          <button onClick={() => toast.success('Opening Review Form...')} className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                            <Star className="w-3.5 h-3.5" /> Write Review
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {status === 'Delivered' && (
                          <button onClick={() => toast.success('Return request initiated.')} className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-transparent">
                            <RotateCcw className="w-3.5 h-3.5" /> Return / Replace
                          </button>
                        )}
                        {['Order Placed', 'Pending', 'Confirmed'].includes(status) && (
                          <button onClick={() => toast.success('Cancellation requested.')} className="px-4 py-2 text-red-600 hover:bg-[#698156]/10 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                            <Ban className="w-3.5 h-3.5" /> Cancel Order
                          </button>
                        )}
                        <button onClick={() => toast.success('Adding items back to cart...')} className="px-4 py-2 text-[#698156] hover:bg-[#698156]/10 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-[#698156]/10">
                          <ShoppingBag className="w-3.5 h-3.5" /> Buy Again
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
