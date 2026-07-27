import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Phone, MapPin, X, ShoppingBag, CheckCircle, Clock, XCircle } from 'lucide-react';

const customerOrders: Record<string, Array<{
  id: string;
  productName: string;
  image: string;
  price: number;
  status: 'Delivered' | 'Pending' | 'Cancelled';
}>> = {
  'CUST-8901': [
    { id: 'ORD-001', productName: 'Silk Banarasi Saree', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=80&h=80&fit=crop', price: 4500, status: 'Delivered' },
    { id: 'ORD-002', productName: 'Anarkali Kurti Set', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=80&h=80&fit=crop', price: 1800, status: 'Delivered' },
    { id: 'ORD-003', productName: 'Lehenga Choli', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=80&h=80&fit=crop', price: 8900, status: 'Pending' },
  ],
  'CUST-8902': [
    { id: 'ORD-004', productName: 'Cotton Salwar Set', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=80&h=80&fit=crop', price: 2200, status: 'Delivered' },
    { id: 'ORD-005', productName: 'Embroidered Dupatta', image: 'https://images.unsplash.com/photo-1585124328087-87b2e028c6f9?w=80&h=80&fit=crop', price: 950, status: 'Cancelled' },
  ],
  'CUST-8903': [
    { id: 'ORD-006', productName: 'Printed Maxi Dress', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=80&h=80&fit=crop', price: 2500, status: 'Pending' },
  ],
  'CUST-8904': [
    { id: 'ORD-007', productName: 'Chiffon Georgette Saree', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=80&h=80&fit=crop', price: 3800, status: 'Delivered' },
    { id: 'ORD-008', productName: 'Straight Kurti', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=80&h=80&fit=crop', price: 1200, status: 'Delivered' },
    { id: 'ORD-009', productName: 'Bridal Lehenga', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=80&h=80&fit=crop', price: 15000, status: 'Delivered' },
    { id: 'ORD-010', productName: 'Party Wear Gown', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=80&h=80&fit=crop', price: 5500, status: 'Cancelled' },
  ],
};

const initialCustomers = [
  { id: 'CUST-8901', name: 'Priya Sharma', phone: '+91 98765 43210', address: '12, Rose Apartments, Bandra West, Mumbai - 400050', orders: 3, joined: '12 Jan, 2024', avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=D4AF37&color=fff' },
  { id: 'CUST-8902', name: 'Rahul Verma', phone: '+91 98765 12345', address: '45, Green Park, Connaught Place, Delhi - 110001', orders: 2, joined: '05 Mar, 2025', avatar: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=800000&color=fff' },
  { id: 'CUST-8903', name: 'Anjali Desai', phone: '+91 91234 56789', address: '7, Sunrise Colony, CG Road, Ahmedabad - 380009', orders: 1, joined: '20 Mar, 2026', avatar: 'https://ui-avatars.com/api/?name=Anjali+Desai&background=047857&color=fff' },
  { id: 'CUST-8904', name: 'Meera Patel', phone: '+91 99887 76655', address: '88, MG Road, Koregaon Park, Pune - 411001', orders: 4, joined: '15 Sep, 2024', avatar: 'https://ui-avatars.com/api/?name=Meera+Patel&background=7C3AED&color=fff' },
];

export function AdminCustomers() {
  const [customers] = useState(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );
  const orders = selectedCustomer ? (customerOrders[selectedCustomer.id] ?? []) : [];

  const statusCfg = {
    Delivered: { cls: 'bg-green-100 text-green-700 border-green-200', Icon: CheckCircle },
    Pending:   { cls: 'bg-amber-100 text-amber-700 border-amber-200',  Icon: Clock },
    Cancelled: { cls: 'bg-red-100 text-red-700 border-red-200',        Icon: XCircle },
  } as const;

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
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Address</th>
                <th className="px-6 py-4 font-medium text-center">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div>
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="font-semibold text-[#800000] hover:underline cursor-pointer text-left"
                        >
                          {customer.name}
                        </button>
                        <div className="text-gray-400 text-xs">Joined {customer.joined}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 text-gray-600 max-w-[220px]">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs leading-relaxed">{customer.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-[#D4AF37]/10 text-[#a07d1c] text-xs font-bold px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                      <ShoppingBag className="w-3 h-3" />
                      {customer.orders}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Card Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Close */}
              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-3 right-3 p-1.5 bg-white/30 hover:bg-white/50 rounded-full text-white transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="bg-gradient-to-br from-[#800000] to-[#a83232] p-5 text-white">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                    className="w-14 h-14 rounded-full border-2 border-white/60 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold truncate">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs mt-0.5">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-white/75 text-xs mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="text-sm font-bold">{selectedCustomer.orders} Orders</span>
                  </div>
                </div>
              </div>

              {/* Ordered Products */}
              <div className="p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ordered Products</h3>
                {orders.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">No orders yet</div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {orders.map(order => {
                      const { cls, Icon } = statusCfg[order.status];
                      return (
                        <div key={order.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                          <img
                            src={order.image}
                            alt={order.productName}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800 truncate">{order.productName}</div>
                            <div className="text-sm font-bold text-[#800000] mt-0.5">Rs.{order.price.toLocaleString()}</div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${cls}`}>
                            <Icon className="w-3 h-3" />
                            {order.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
