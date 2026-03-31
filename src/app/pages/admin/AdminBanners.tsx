import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Image as ImageIcon, Trash2, Edit } from 'lucide-react';

const initialBanners = [
  { id: 1, title: 'Spring Sale 2026', link: '/new-arrivals', status: 'Active', image: 'https://images.unsplash.com/photo-1742287721821-ddf522b3f37b' },
  { id: 2, title: 'Bridal Collection', link: '/lehengas', status: 'Inactive', image: 'https://images.unsplash.com/photo-1724856604254-f7cf4e9c8f72' },
];

export function AdminBanners() {
  const [banners, setBanners] = useState(initialBanners);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Homepage Banners</h1>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-center flex-col h-64 border-dashed border-2 hover:bg-gray-50 transition-colors cursor-pointer group">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors mb-4">
          <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Upload New Banner</h3>
        <p className="text-sm text-gray-500">Drag and drop or click to select image (1920x800px recommended)</p>
      </div>

      {/* Active Banners */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Current Banners</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner, i) => (
             <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
             >
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img src={`${banner.image}?w=800&q=80`} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-2 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg text-gray-600 hover:text-[#D4AF37] transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg text-red-600 hover:text-red-700 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{banner.title}</h3>
                    <p className="text-sm text-gray-500">Link: {banner.link}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${banner.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {banner.status}
                  </span>
                </div>
             </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
