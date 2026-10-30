import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, Folder, X, ArrowRight, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router';

interface AdminCategoriesProps {
  onSelectCategory?: (category: string) => void;
}

export function AdminCategories({ onSelectCategory }: AdminCategoriesProps) {
  const navigate = useNavigate();
  const [sareeCount, setSareeCount] = useState<number>(41);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '', status: 'Active' });

  // Only Sarees — removed mock categories (Kurtis, Lehengas, Western, Salwar Sets)
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: 'Sarees',
      description: 'Traditional, designer, Kanchi cotton, viscose, fancy and silk sarees',
      productsCount: 41,
      status: 'Active',
    },
  ]);

  // Fetch live count of Sarees from database
  useEffect(() => {
    let mounted = true;
    async function loadSareeCount() {
      try {
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .ilike('category', '%saree%');

        if (!error && typeof count === 'number' && mounted) {
          setSareeCount(count);
          setCategories(prev =>
            prev.map(c => (c.name === 'Sarees' ? { ...c, productsCount: count } : c))
          );
        }
      } catch (e) {
        console.warn('Error fetching saree count:', e);
      }
    }
    loadSareeCount();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCategoryClick = (catName: string) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    setCategories([
      ...categories,
      {
        id: Date.now(),
        name: newCat.name.trim(),
        description: newCat.description.trim(),
        status: newCat.status,
        productsCount: 0,
      },
    ]);
    setIsModalOpen(false);
    setNewCat({ name: '', description: '', status: 'Active' });
  };

  const handleDelete = (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Click on any category to view its catalog products
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#546944] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleCategoryClick(cat.name)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#698156]/40 hover:shadow-md transition-all relative group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-[#F4F6F2] rounded-xl flex items-center justify-center text-[#698156] group-hover:scale-105 transition-transform">
                <Folder className="w-6 h-6" />
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  cat.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {cat.status}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#698156] transition-colors flex items-center justify-between">
              <span>{cat.name}</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#698156] group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cat.description}</p>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#698156]" />
                <span>{cat.productsCount} Products</span>
              </div>
              <div
                className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  title="View Products"
                  onClick={() => handleCategoryClick(cat.name)}
                  className="p-1.5 text-gray-500 hover:text-[#698156] rounded-md hover:bg-gray-100 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                {cat.name !== 'Sarees' && (
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Category</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newCat.name}
                    onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                    placeholder="e.g. Sarees"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#698156] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCat.description}
                    onChange={e => setNewCat({ ...newCat, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#698156] focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newCat.status}
                    onChange={e => setNewCat({ ...newCat, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#698156] focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#698156] rounded-lg text-white font-medium hover:bg-[#546944] transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
