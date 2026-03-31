import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Package, TrendingDown, CheckCircle2 } from 'lucide-react';

const inventoryData = [
  { id: 101, name: 'Elegant Maroon Saree', sku: 'SAR-MAR-001', stock: 5, threshold: 10, status: 'Low Stock' },
  { id: 102, name: 'Designer Bridal Lehenga', sku: 'LEH-BRI-042', stock: 2, threshold: 5, status: 'Critical' },
  { id: 103, name: 'Casual Cotton Kurti', sku: 'KUR-COT-091', stock: 120, threshold: 20, status: 'In Stock' },
  { id: 104, name: 'Chiffon Party Wear', sku: 'WES-CHI-112', stock: 0, threshold: 15, status: 'Out of Stock' },
  { id: 105, name: 'Silk Banarasi Saree', sku: 'SAR-SIL-005', stock: 45, threshold: 10, status: 'In Stock' },
];

export function AdminInventory() {
  const stats = [
    { label: 'Total Items', value: '1,245', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Low Stock Alerts', value: '24', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Out of Stock', value: '8', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Healthy Stock', value: '1,213', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Critical': return 'bg-orange-100 text-orange-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Alerts</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Stock Levels Overview</h2>
          <button className="text-[#D4AF37] font-medium text-sm hover:text-black transition-colors">Download Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium text-center">Stock Available</th>
                <th className="px-6 py-4 font-medium text-center">Reorder Threshold</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {inventoryData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-500">{item.sku}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${item.stock <= item.threshold ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">{item.threshold}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#D4AF37] hover:text-black font-medium transition-colors">
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
