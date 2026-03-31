import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Mail, Phone, MapPin, Ban, CheckCircle, MoreVertical, X } from 'lucide-react';

const initialCustomers = [
  { id: 'CUST-8901', name: 'Priya Sharma', email: 'priya.s@example.com', phone: '+91 98765 43210', orders: 12, spent: 45000, joined: '12 Jan, 2024', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random' },
  { id: 'CUST-8902', name: 'Rahul Verma', email: 'rahul.v@example.com', phone: '+91 98765 12345', orders: 4, spent: 22000, joined: '05 Mar, 2025', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=random' },
  { id: 'CUST-8903', name: 'Anjali Desai', email: 'anjali.d@example.com', phone: '+91 91234 56789', orders: 1, spent: 2500, joined: '20 Mar, 2026', status: 'Blocked', avatar: 'https://ui-avatars.com/api/?name=Anjali+Desai&background=random' },
  { id: 'CUST-8904', name: 'Meera Patel', email: 'meera.p@example.com', phone: '+91 99887 76655', orders: 8, spent: 34500, joined: '15 Sep, 2024', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Meera+Patel&background=random' },
];

export function AdminCustomers() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    setCustomers(customers.map(c => c.id === id ? { ...c, status: newStatus } : c));
    if (selectedCustomer?.id === id) {
      setSelectedCustomer({ ...selectedCustomer, status: newStatus });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Customers Directory</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers by name, email or phone..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium text-center">Orders</th>
                <th className="px-6 py-4 font-medium text-right">Total Spent</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-[#D4AF37] transition-colors">{customer.name}</div>
                        <div className="text-gray-500 text-xs">Joined {customer.joined}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600 flex items-center gap-2"><Mail className="w-3 h-3"/> {customer.email}</div>
                    <div className="text-gray-500 text-xs flex items-center gap-2 mt-1"><Phone className="w-3 h-3"/> {customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">{customer.orders}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">₹{customer.spent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {customer.status === 'Active' ? <CheckCircle className="w-3 h-3"/> : <Ban className="w-3 h-3"/>}
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleStatus(customer.id, customer.status)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        customer.status === 'Active' 
                        ? 'border-red-200 text-red-600 hover:bg-red-50' 
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {customer.status === 'Active' ? 'Block User' : 'Unblock User'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full relative z-10 shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-start justify-between">
                <div className="flex gap-4">
                  <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="w-16 h-16 rounded-full border-4 border-white shadow-sm" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> Mumbai, India</p>
                    <div className="mt-2 inline-flex">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedCustomer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedCustomer.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100">
                  <X className="w-5 h-5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3 bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                        <div className="text-orange-600 text-xs font-bold uppercase mb-1">Total Orders</div>
                        <div className="text-2xl font-bold text-gray-900">{selectedCustomer.orders}</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="text-green-600 text-xs font-bold uppercase mb-1">Total Spent</div>
                        <div className="text-2xl font-bold text-gray-900">₹{selectedCustomer.spent.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 mt-auto">
                   <button 
                      onClick={() => toggleStatus(selectedCustomer.id, selectedCustomer.status)}
                      className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${
                        selectedCustomer.status === 'Active' 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {selectedCustomer.status === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      {selectedCustomer.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
