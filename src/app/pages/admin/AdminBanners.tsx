import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Image as ImageIcon, Trash2, Edit, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string;
  link: string;
  status: string;
  image: string;
}

export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Banner[] = (data || []).map((b: any) => ({
        id: b.id,
        title: b.title || 'Untitled Banner',
        link: b.link || '/',
        status: b.status || 'Active',
        image: b.image_url || b.image || '',
      }));

      setBanners(formatted);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBanners(banners.filter(b => b.id !== id));
      toast.success('Banner deleted');
    } catch (error: any) {
      toast.error('Failed to delete banner: ' + error.message);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const { error } = await supabase
        .from('banners')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setBanners(banners.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast.success(`Banner ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update banner: ' + error.message);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Homepage Banners</h1>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-center flex-col h-64 border-dashed border-2 hover:bg-gray-50 transition-colors cursor-pointer group">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#698156]/10 transition-colors mb-4">
          <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[#698156] transition-colors" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Upload New Banner</h3>
        <p className="text-sm text-gray-500">Drag and drop or click to select image (1920x800px recommended)</p>
      </div>

      {/* Active Banners */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Current Banners</h2>
        {banners.length > 0 ? (
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
                    {banner.image ? (
                      <img src={`${banner.image}?w=800&q=80`} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button className="p-2 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg text-gray-600 hover:text-[#698156] transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{banner.title}</h3>
                      <p className="text-sm text-gray-500">Link: {banner.link}</p>
                    </div>
                    <button 
                      onClick={() => toggleStatus(banner.id, banner.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${banner.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {banner.status}
                    </button>
                  </div>
               </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
            No banners uploaded yet. Use the upload section above to add banners.
          </div>
        )}
      </div>
    </div>
  );
}
