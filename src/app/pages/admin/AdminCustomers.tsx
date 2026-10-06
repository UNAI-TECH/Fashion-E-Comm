import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Phone, MapPin, X, ShoppingBag, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  orders_count: number;
  joined: string;
  status: string;
}

interface CustomerOrder {
  id: string;
  product_name: string;
  image: string;
  price: number;
  status: string;
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get order counts per customer
      const { data: orderCounts } = await supabase
        .from('orders')
        .select('user_id');

      const countMap: Record<string, number> = {};
      if (orderCounts) {
        for (const o of orderCounts) {
          if (o.user_id) {
            countMap[o.user_id] = (countMap[o.user_id] || 0) + 1;
          }
        }
      }

      const formatted: Customer[] = (profiles || []).map((p: any) => ({
        id: p.id,
        name: p.full_name || p.email?.split('@')[0] || 'Unknown',
        email: p.email || '',
        phone: p.phone || 'N/A',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'U')}&background=698156&color=fff`,
        orders_count: countMap[p.id] || 0,
        joined: new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: p.status || 'Active',
      }));

      setCustomers(formatted);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerOrders = async (customerId: string) => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, status, total_amount,
          order_items (
            price_at_time, total_price,
            products (name, images)
          )
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: CustomerOrder[] = (data || []).map((o: any) => {
        const firstItem = o.order_items?.[0];
        return {
          id: o.id,
          product_name: firstItem?.products?.name || 'N/A',
          image: firstItem?.products?.images?.[0] || '',
          price: Number(o.total_amount || 0),
          status: o.status || 'Pending',
        };
      });

      setCustomerOrders(formatted);
    } catch (error) {
      console.error('Error loading customer orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    loadCustomerOrders(customer.id);
  };

  const statusCfg = {
    Delivered: { cls: 'bg-green-100 text-green-700 border-green-200', Icon: CheckCircle },
    Pending:   { cls: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock },
    Cancelled: { cls: 'bg-red-100 text-red-700 border-red-200', Icon: XCircle },
  } as const;

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#698156]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-gray-900">Customers Directory</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#698156]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium text-center">Orders</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length > 0 ? filtered.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div>
                        <button
                          onClick={() => handleSelectCustomer(customer)}
                          className="font-semibold text-[#698156] hover:underline cursor-pointer text-left"
                        >
                          {customer.name}
                        </button>
                        <div className="text-gray-400 text-xs">Joined {customer.joined}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.phone}</td>
                  <td className="px-6 py-4 text-center font-medium">{customer.orders_count}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                    {search ? 'No customers match your search.' : 'No customers registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="flex items-center gap-3">
                  <img src={selectedCustomer.avatar} alt="" className="w-12 h-12 rounded-full" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                    <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Phone className="w-4 h-4" /> {selectedCustomer.phone}
                </div>
                <div className="text-sm text-gray-500 mb-6">Joined {selectedCustomer.joined} · {selectedCustomer.orders_count} orders</div>

                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Order History
                </h3>

                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#698156]" />
                  </div>
                ) : customerOrders.length > 0 ? (
                  <div className="space-y-3">
                    {customerOrders.map(order => {
                      const cfg = statusCfg[order.status as keyof typeof statusCfg] || statusCfg.Pending;
                      return (
                        <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          {order.image ? (
                            <img src={order.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{order.product_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{order.id.substring(0, 14)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-900 text-sm">₹{order.price.toLocaleString('en-IN')}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No orders found for this customer.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
