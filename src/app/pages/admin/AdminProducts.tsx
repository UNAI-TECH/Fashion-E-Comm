import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, Edit, Trash2, X, Upload } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Product } from '../../data/products';
import { toast } from 'sonner';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', 
    category: 'Sarees', 
    price: '', 
    compare_at_price: '', 
    stock_quantity: '', 
    image: '',
    description: ''
  });

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []).map(p => {
        const itemImages = (p.images && p.images.length > 0) 
          ? p.images 
          : (p.image_url ? [p.image_url] : ['https://images.unsplash.com/photo-1604176354204-926873ff34b0?q=80&w=1000&auto=format&fit=crop']);
        return {
          ...p,
          image: itemImages[0],
          images: itemImages
        };
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '0',
      image: product.image,
      description: product.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
        stock_quantity: Number(formData.stock_quantity),
        images: [formData.image || 'https://images.unsplash.com/photo-1604176354204-926873ff34b0?q=80&w=1000&auto=format&fit=crop'],
        description: formData.description,
        status: 'Published'
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success(`'${formData.name}' updated successfully`);
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        toast.success(`'${formData.name}' added successfully`);
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', category: 'Sarees', price: '', compare_at_price: '', stock_quantity: '', image: '', description: '' });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-gray-900">Product Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your store inventory in real-time</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', category: 'Sarees', price: '', compare_at_price: '', stock_quantity: '', image: '', description: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 rounded-full hover:bg-black transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#D4AF37]/20 outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D4AF37]"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${!product.category ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-600'}`}>
                        {product.category || '⚠️ Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">₹{product.price.toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full ${Number(product.stock_quantity) > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {product.stock_quantity || 0} left
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2 text-gray-400 hover:text-[#D4AF37]"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Product Name</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none" placeholder="Silk Saree" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none">
                      <option>Sarees</option>
                      <option>Kurtis</option>
                      <option>Lehengas</option>
                      <option>Salwar Sets</option>
                      <option>Western</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                    <input required type="number" value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none" placeholder="10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (₹)</label>
                    <input required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none" placeholder="2999" />
                  </div>
                   <div>
                    <label className="block text-sm font-medium mb-2">Compare at Price (₹)</label>
                    <input type="number" value={formData.compare_at_price} onChange={(e) => setFormData({...formData, compare_at_price: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none" placeholder="4999" />
                  </div>
                </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Product Image</label>
                    <div className="flex flex-col gap-4">
                      {formData.image && (
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, image: ''})}
                            className="absolute top-1 right-1 p-1 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative group">
                          <input 
                            type="text" 
                            value={formData.image} 
                            onChange={(e) => setFormData({...formData, image: e.target.value})} 
                            className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-[#D4AF37]/20" 
                            placeholder="Enter image URL or upload..." 
                          />
                        </div>
                        <label className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all active:scale-95 whitespace-nowrap">
                          <Upload className="w-5 h-5" />
                          Upload File
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              setIsLoading(true);
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
                                const filePath = `${formData.category.toLowerCase()}/${fileName}`;

                                const { error: uploadError } = await supabase.storage
                                  .from('products')
                                  .upload(filePath, file);

                                if (uploadError) throw uploadError;

                                const { data: { publicUrl } } = supabase.storage
                                  .from('products')
                                  .getPublicUrl(filePath);

                                setFormData({ ...formData, image: publicUrl });
                                toast.success('Image uploaded successfully');
                              } catch (error: any) {
                                console.error('Upload error:', error);
                                toast.error(error.message || 'Error uploading image');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-400">Recommended: High-resolution portrait image (3:4 ratio)</p>
                    </div>
                  </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none resize-none" placeholder="Product details..." />
                </div>
                <button type="submit" className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold shadow-lg">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
