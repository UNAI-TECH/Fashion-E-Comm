import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, Clock, X, FileText, RotateCcw, MessageSquare, ChevronRight, Ban, CheckCircle2, ShoppingBag, HeadphonesIcon } from 'lucide-react';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router';
import { toast } from 'sonner';

type OrderStatus = 'Order Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned' | 'Refunded';

const filters = ['All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All Orders');

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
      setFilteredOrders(uniqueOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error("Could not sync latest orders. Showing offline cache.");
      try {
        const parsed = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
        if (Array.isArray(parsed)) {
          setOrders(parsed);
          setFilteredOrders(parsed);
        }
      } catch(e) {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (activeFilter === 'All Orders') {
      setFilteredOrders(orders);
    } else if (activeFilter === 'Processing') {
      setFilteredOrders(orders.filter(o => ['Pending', 'Order Placed', 'Confirmed', 'Packed'].includes(o.status || 'Order Placed')));
    } else if (activeFilter === 'Shipped') {
      setFilteredOrders(orders.filter(o => ['Shipped', 'Out for Delivery'].includes(o.status)));
    } else if (activeFilter === 'Delivered') {
      setFilteredOrders(orders.filter(o => o.status === 'Delivered'));
    } else if (activeFilter === 'Cancelled') {
      setFilteredOrders(orders.filter(o => o.status === 'Cancelled'));
    } else if (activeFilter === 'Returned') {
      setFilteredOrders(orders.filter(o => ['Returned', 'Refunded'].includes(o.status)));
    }
  }, [activeFilter, orders]);

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
          <Link to="/" className="h-16 sm:h-20 overflow-visible flex items-center">
            <img
              src="/media__1785326482299.jpg"
              alt="Aanya Fashions"
              className="h-full w-auto object-contain object-left mix-blend-multiply contrast-125 drop-shadow-md scale-125 origin-left"
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

        {/* Filters */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                activeFilter === filter 
                ? 'bg-gray-900 text-white border-transparent' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Package className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-serif text-gray-700 mb-4">No orders found</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Looks like you haven't placed any orders in this category yet.</p>
            <Link to="/" className="px-8 py-3 bg-[#800000] text-white rounded-full font-bold text-sm shadow-md hover:bg-black transition-all">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredOrders.map((order, idx) => {
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
                          <p className="font-medium text-[#800000] cursor-pointer hover:underline">{order.shipping_address?.full_name || order.shipping_address?.first_name || 'Customer'}</p>
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

                        {/* Status & Payment info */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(status)}
                            {['Order Placed', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery'].includes(status || 'Order Placed') && (
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

                    {/* Actions Bar */}
                    <div className="bg-white border-t border-gray-100 p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                          <Truck className="w-3.5 h-3.5" /> Track Order
                        </button>
                        <button className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                          <FileText className="w-3.5 h-3.5" /> Invoice
                        </button>
                        {status === 'Delivered' && (
                          <button className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                            <MessageSquare className="w-3.5 h-3.5" /> Write Review
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {status === 'Delivered' && (
                          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5" /> Return Product
                          </button>
                        )}
                        {['Order Placed', 'Pending', 'Confirmed'].includes(status || 'Order Placed') && (
                          <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                            <Ban className="w-3.5 h-3.5" /> Cancel Order
                          </button>
                        )}
                        <button className="px-4 py-2 text-[#800000] hover:bg-red-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5" /> Buy Again
                        </button>
                        <button className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                          <HeadphonesIcon className="w-3.5 h-3.5" /> Support
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
