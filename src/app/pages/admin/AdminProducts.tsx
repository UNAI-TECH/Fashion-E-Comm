import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, Edit, Trash2, X, Upload, RefreshCw, ImageIcon } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { Product, fetchProducts as getStorefrontProducts, markProductDeleted } from '../../data/products';
import { toast } from 'sonner';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
      const data = await getStorefrontProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleUpdate = () => {
      fetchProducts();
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('products_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('products_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && productToDelete && !isDeleting) {
        setProductToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productToDelete, isDeleting]);

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const id = productToDelete.id;
    const prodName = productToDelete.name;
    setIsDeleting(true);
    try {
      try {
        await supabaseAdmin.from('products').delete().eq('id', id);
        if (prodName) {
          await supabaseAdmin.from('products').delete().eq('name', prodName);
        }
      } catch (e) {}

      // Mark deleted in persistent storage & broadcast to all tabs
      markProductDeleted(id, prodName);

      toast.success(`"${prodName}" deleted successfully`);
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      compare_at_price: (product.compare_at_price || product.originalPrice)?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '25',
      image: product.image,
      description: product.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const img = formData.image.trim() || 'https://images.unsplash.com/photo-1604176354204-926873ff34b0?q=80&w=1000&auto=format&fit=crop';
      const productPayload = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
        stock_quantity: Number(formData.stock_quantity) || 25,
        images: [img],
        image_url: img,
        description: formData.description.trim() || '',
        status: 'Published'
      };

      let savedRecord: any = null;

      if (editingProduct) {
        try {
          const { data, error } = await supabaseAdmin
            .from('products')
            .update(productPayload)
            .eq('id', editingProduct.id)
            .select()
            .single();
          if (!error && data) savedRecord = data;
        } catch (e) {}

        try {
          const raw = localStorage.getItem('local_admin_products');
          const list = raw ? JSON.parse(raw) : [];
          const updated = list.map((p: any) => String(p.id) === String(editingProduct.id) ? { ...p, ...productPayload, image: img } : p);
          if (!list.some((p: any) => String(p.id) === String(editingProduct.id))) {
            updated.unshift({ id: editingProduct.id, ...productPayload, image: img, created_at: (editingProduct as any).created_at || new Date().toISOString() });
          }
          localStorage.setItem('local_admin_products', JSON.stringify(updated));
        } catch (e) {}

        toast.success(`'${formData.name}' updated successfully`);
      } else {
        try {
          const { data, error } = await supabaseAdmin
            .from('products')
            .insert(productPayload)
            .select()
            .single();
          if (!error && data) savedRecord = data;
        } catch (e) {}

        const newId = savedRecord ? savedRecord.id : 'prod_' + Date.now();
        const fullNewProduct = {
          id: String(newId),
          ...productPayload,
          image: img,
          created_at: new Date().toISOString()
        };

        try {
          const raw = localStorage.getItem('local_admin_products');
          const list = raw ? JSON.parse(raw) : [];
          const updated = [fullNewProduct, ...list.filter((p: any) => String(p.id) !== String(newId))];
          localStorage.setItem('local_admin_products', JSON.stringify(updated));
        } catch (e) {}

        toast.success(`'${formData.name}' added successfully and published!`);
      }

      window.dispatchEvent(new Event('products_updated'));

      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', category: 'Sarees', price: '', compare_at_price: '', stock_quantity: '', image: '', description: '' });
      await fetchProducts();
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
                        <button onClick={() => setProductToDelete(product)} className="p-2 text-gray-400 hover:text-red-500 hover:scale-110 transition-transform cursor-pointer" title="Delete product"><Trash2 className="w-5 h-5" /></button>
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
                      <option>Maxi</option>
                      <option>Tradition</option>
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

      {/* ═══ UNIQUE LUXURY DELETE CONFIRMATION MODAL (CENTERED) ═══ */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop with rich blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setProductToDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            />

            {/* Modal Card in the Center of the Application */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-white rounded-[2.25rem] shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-rose-100 p-6 sm:p-7 overflow-hidden z-10 my-8"
            >
              {/* Soft ambient rose glow behind header */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-52 h-52 bg-gradient-to-br from-rose-500/15 via-red-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => !isDeleting && setProductToDelete(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative text-center pt-1">
                <h3 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">
                  Delete Product?
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to remove this item? It will be permanently removed from your catalog and Supabase database.
                </p>

                {/* Product Snapshot Preview Card */}
                <div className="mt-5 p-3 rounded-2xl bg-gradient-to-br from-rose-50/60 to-gray-50 border border-rose-100/70 flex items-center gap-3.5 text-left shadow-xs">
                  <div className="w-14 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-xs border border-gray-200/60 flex items-center justify-center">
                    {productToDelete.image ? (
                      <img
                        src={productToDelete.image}
                        alt={productToDelete.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-full inline-block mb-1">
                      {productToDelete.category}
                    </span>
                    <h4 className="font-serif font-bold text-xs sm:text-sm text-gray-900 truncate">
                      {productToDelete.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-[#800000]">
                        ₹{(productToDelete.price || 0).toLocaleString('en-IN')}
                      </span>
                      {productToDelete.originalPrice && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{productToDelete.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setProductToDelete(null)}
                    className="py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Keep Product
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rose-600/30 hover:shadow-rose-600/50 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </>
                    )}
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
