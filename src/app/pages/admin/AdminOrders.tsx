import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Eye, X, PackageOpen, Truck, CheckCircle, Package, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  date: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: any;
  order_items: any[];
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadOrders();

    // Real-time subscription for order updates
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadOrders = async () => {
    try {
        const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name, email, phone),
          order_items (
            *,
            products (name, images, price)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Order[] = (data || []).map((o: any) => {
        const addr = o.shipping_address || {};
        const customerName = o.profiles?.full_name || addr.full_name || [addr.first_name, addr.last_name].filter(Boolean).join(' ') || 'Customer';
        const customerEmail = o.profiles?.email || addr.email || '';
        const firstProduct = o.order_items?.[0]?.products?.name || 'N/A';

        return {
          id: o.id,
          customer_name: customerName,
          customer_email: customerEmail,
          product_name: firstProduct,
          date: new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: Number(o.total_amount || 0),
          status: o.status || 'Pending',
          payment_method: o.payment_method || 'N/A',
          payment_status: o.payment_status || 'Pending',
          shipping_address: addr,
          order_items: o.order_items || [],
        };
      });

      setOrders(formatted);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error('Failed to update order status: ' + error.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Filter orders
  const filtered = orders.filter(o => {
    const matchesSearch = !searchQuery || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <div className="flex items-center gap-3">
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#698156]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID or Customer Name..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#698156]"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Total Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length > 0 ? filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.customer_name}</div>
                    <div className="text-gray-500 text-xs">{order.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(order.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-[#698156] hover:bg-[#698156]/10 rounded-lg transition-colors inline-block"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    {searchQuery || statusFilter !== 'All' ? 'No orders match your filter.' : 'No orders yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono font-medium text-gray-900">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-medium text-gray-900">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{selectedOrder.customer_email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-900">{selectedOrder.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(selectedOrder.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment:</span>
                  <span className="text-gray-900">{selectedOrder.payment_method} ({selectedOrder.payment_status})</span>
                </div>

                {/* Order Items */}
                {selectedOrder.order_items.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
                    {selectedOrder.order_items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        {item.products?.images?.[0] && (
                          <img src={item.products.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.products?.name || 'Unknown Product'}</div>
                          <div className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(Number(item.price_at_time || item.price || 0))}</div>
                        </div>
                        <div className="text-sm font-bold">{formatCurrency(Number(item.total_price || 0))}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shipping Address */}
                {selectedOrder.shipping_address && Object.keys(selectedOrder.shipping_address).length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <p className="text-sm text-gray-600">
                      {[
                        selectedOrder.shipping_address.address,
                        selectedOrder.shipping_address.city,
                        selectedOrder.shipping_address.state,
                        selectedOrder.shipping_address.pincode
                      ].filter(Boolean).join(', ')}
                    </p>
                    {selectedOrder.shipping_address.phone && (
                      <p className="text-sm text-gray-500 mt-1">Phone: {selectedOrder.shipping_address.phone}</p>
                    )}
                  </div>
                )}

                {/* Update Status */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                        disabled={selectedOrder.status === status}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedOrder.status === status
                            ? 'bg-[#698156] text-white cursor-default'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
