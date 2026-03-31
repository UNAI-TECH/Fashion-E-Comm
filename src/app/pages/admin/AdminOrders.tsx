import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Eye, X, PackageOpen, Truck, CheckCircle, Package } from 'lucide-react';

const initialOrders = [
  { id: '#ORD-001', customer: 'Priya Sharma', email: 'priya.s@example.com', product: 'Elegant Maroon Saree', date: '25 Mar, 2026', amount: 2999, status: 'Delivered', payment: 'Paid via UPI' },
  { id: '#ORD-002', customer: 'Rahul Verma', email: 'rahul.v@example.com', product: 'Designer Bridal Lehenga', date: '25 Mar, 2026', amount: 14999, status: 'Processing', payment: 'Paid via Card' },
  { id: '#ORD-003', customer: 'Anjali Desai', email: 'anjali.d@example.com', product: 'Casual Cotton Kurti', date: '24 Mar, 2026', amount: 999, status: 'Pending', payment: 'Cash on Delivery' },
  { id: '#ORD-004', customer: 'Meera Patel', email: 'meera.p@example.com', product: 'Chiffon Party Wear', date: '24 Mar, 2026', amount: 3450, status: 'Shipped', payment: 'Paid via UPI' }
];

export function AdminOrders() {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'Delivered': return (pr: any) => <CheckCircle {...pr} />;
      case 'Processing': return (pr: any) => <PackageOpen {...pr} />;
      case 'Shipped': return (pr: any) => <Truck {...pr} />;
      default: return (pr: any) => <Package {...pr} />;
    }
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter Status
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer Name..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.customer}</div>
                    <div className="text-gray-500 text-xs">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 font-medium">₹{order.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors inline-block"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.95, opacity: 0, x: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col h-[90vh] sm:h-auto max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">Order {selectedOrder.id}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-medium text-gray-900">{selectedOrder.customer}</p>
                    <p className="text-gray-600 text-sm">{selectedOrder.email}</p>
                    <p className="text-gray-600 text-sm mt-2">Delivery Address:<br/>124, Rosewood Apartments,<br/>Mumbai, India 400001</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Items</h3>
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{selectedOrder.product}</p>
                        <p className="text-gray-500 text-sm">Qty: 1</p>
                      </div>
                      <p className="font-medium">₹{selectedOrder.amount}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Payment</h3>
                    <p className="font-medium text-gray-900 mt-1">{selectedOrder.payment}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total</h3>
                    <p className="text-xl font-bold text-gray-900">₹{selectedOrder.amount}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Order Status</h3>
                  <div className="flex gap-2 flex-wrap">
                    {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          selectedOrder.status === status 
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
