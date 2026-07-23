import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, Truck, CheckCircle, Clock, ChevronRight, Phone, MapPin } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router';
import { toast } from 'sonner';

export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          payments (*)
        `)
        .order('created_at', { ascending: false });

      if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data: dbData } = await query;
      let fetchedDbOrders = dbData || [];

      if (!dbData || dbData.length === 0) {
        const { data: simpleData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (simpleData) fetchedDbOrders = simpleData;
      }

      // Fetch local storage placed orders cache
      let localOrders: any[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
      } catch (e) {
        console.error('LocalStorage parse error:', e);
      }

      // Combine local cache and database orders
      const combined = [...localOrders, ...fetchedDbOrders];
      const uniqueOrders = Array.from(new Map(combined.map((o: any) => [o.id, o])).values());

      setOrders(uniqueOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      let localOrders: any[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
      } catch (e) {}
      setOrders(localOrders);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusSteps = (status: string) => {
    const steps = [
      { label: 'Order Placed', completed: true },
      { label: 'Shipped', completed: status === 'Shipped' || status === 'Delivered' },
      { label: 'Delivered', completed: status === 'Delivered' },
    ];
    return steps;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AnnouncementBar />
      <Navigation />

      <main className="pt-32 pb-20 px-4 max-w-5xl mx-auto text-gray-900">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img 
                src="/logo_aanya.png" 
                alt="Aanya Fashions Logo" 
                className="h-20 sm:h-24 w-auto object-contain brightness-105 contrast-125 drop-shadow-sm hover:scale-105 transition-transform" 
              />
            </Link>
            <div>
              <h1 className="font-serif text-4xl mb-1">My Orders</h1>
              <p className="text-gray-500">Track and manage your recent purchases.</p>
            </div>
          </div>
          <button 
            onClick={fetchOrders}
            className="px-6 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Refresh List
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-gray-700 mb-4">No orders booked yet</h2>
            <Link to="/" className="px-8 py-3 bg-[#800000] text-white rounded-full font-bold text-sm shadow-md hover:bg-black transition-all">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const orderDate = new Date(order.created_at || Date.now());
              const deliveryDate = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000);
              const firstItem = order.order_items?.[0];
              const productImage = firstItem?.products?.images?.[0] || firstItem?.products?.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600';
              const productName = firstItem?.products?.name || 'Designer Fashion Apparel';
              const quantity = firstItem?.quantity || 1;
              const address = order.shipping_address || {};

              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 items-center sm:items-start"
                >
                  {/* Big Product Image */}
                  <div className="w-32 h-40 sm:w-36 sm:h-44 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 relative group">
                    <img 
                      src={productImage} 
                      alt={productName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md text-white text-[9px] font-bold rounded-md uppercase">
                      {order.payment_method || 'Order'}
                    </span>
                  </div>

                  {/* Basic Minimal Details */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-gray-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">ORD-{order.id.slice(0, 8).toUpperCase()}</span>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 leading-snug">{productName}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Amount</span>
                        <span className="text-xl font-black text-[#800000]">₹{Number(order.total_amount || order.total_price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-0.5">
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Quantity</p>
                        <p className="font-bold text-gray-800">{quantity} Item{quantity > 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Customer Contact</p>
                        <p className="font-bold text-gray-800 truncate">{address.full_name || address.first_name || 'Customer'} • {address.phone || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Delivery Address</p>
                      <p className="font-medium text-gray-700 leading-tight">
                        {address.address || 'Address Not Specified'}, {address.city || ''} {address.pincode ? `- ${address.pincode}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-gray-100 gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">
                          Order Date: <strong className="text-gray-800">{orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
                        <span>Expected Delivery: {deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
