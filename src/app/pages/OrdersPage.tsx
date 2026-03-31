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
      if (!user) {
        setOrders([]);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          payments (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
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
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-serif text-4xl mb-2">My Orders</h1>
            <p className="text-gray-500">Track and manage your recent purchases.</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
            <Package className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h2 className="text-2xl font-serif text-gray-600 mb-6">No orders yet</h2>
            <Link to="/" className="px-10 py-4 bg-[#D4AF37] text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-10 border-b border-gray-100">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-[#FFF0F5] rounded-3xl flex items-center justify-center">
                      <Package className="w-8 h-8 text-[#800000]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Order ID</p>
                      <p className="font-bold text-lg">ORD-{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Order Date</p>
                    <p className="font-bold text-lg">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Payment</p>
                    <p className="font-bold text-lg">{order.payments?.[0]?.method || 'N/A'}</p>
                    <p className={`text-xs font-medium ${order.payments?.[0]?.status === 'Completed' ? 'text-green-600' : 'text-orange-500'}`}>
                      {order.payments?.[0]?.status || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-[#800000]">₹{Number(order.total_price).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-16">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Items in Order</h3>
                    <div className="space-y-6">
                      {order.order_items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-5 group">
                          <div className="w-20 h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                            <img src={item.products?.images?.[0] || 'https://via.placeholder.com/200'} alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="py-1">
                            <h4 className="font-serif text-xl text-gray-900 leading-tight mb-2">{item.products?.name || 'Product'}</h4>
                            <div className="flex items-center gap-4 text-gray-500">
                              <span className="text-sm">Qty: {item.quantity}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className="text-sm font-bold text-[#D4AF37]">₹{Number(item.price).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-10">Delivery Progress</h3>
                    <div className="relative">
                      {/* Tracking Line */}
                      <div className="absolute left-[13px] top-2 bottom-2 w-[2px] bg-gray-100" />
                      
                      <div className="space-y-12">
                        {getStatusSteps(order.status).map((step, idx) => (
                          <div key={idx} className="relative pl-12">
                            <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-colors shadow-sm ${
                              step.completed ? 'bg-[#800000]' : 'bg-gray-100'
                            }`}>
                              {step.completed ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            
                            <div>
                              <p className={`font-bold text-lg ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.label}
                              </p>
                              {step.completed && (
                                <p className="text-sm text-gray-500 mt-1">Confirmed & Processing</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
