import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, Edit, Trash2, X, Upload, RefreshCw, ImageIcon, Star, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { Product, fetchProducts as getStorefrontProducts, markProductDeleted, ensureProductImages, buildComplementaryAngles } from '../../data/products';
import { toast } from 'sonner';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    price: string;
    compare_at_price: string;
    stock_quantity: string;
    images: string[];
    description: string;
  }>({
    name: '', 
    category: 'Sarees', 
    price: '', 
    compare_at_price: '', 
    stock_quantity: '', 
    images: [],
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
    const imgs = ensureProductImages(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      compare_at_price: (product.compare_at_price || product.originalPrice)?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '25',
      images: imgs,
      description: product.description || ''
    });
    setUrlInput('');
    setImageError(false);
    setIsModalOpen(true);
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error('Please enter a valid image URL');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, trimmed]
    }));
    setUrlInput('');
    setImageError(false);
    toast.success('Photo added to product gallery');
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return;
    setFormData(prev => {
      const selected = prev.images[index];
      const rest = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: [selected, ...rest]
      };
    });
    toast.success('Set as primary storefront image');
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= formData.images.length) return;
    setFormData(prev => {
      const copy = [...prev.images];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return {
        ...prev,
        images: copy
      };
    });
  };

  const handleAutofillAngles = () => {
    const primary = formData.images[0] || (formData.category === 'Sarees' ? '/saree_s1.jpg' : `/kurti_k1.jpg`);
    const angles = buildComplementaryAngles(primary, formData.category, formData.name);
    const combined = Array.from(new Set([...formData.images, ...angles]));
    setFormData(prev => ({
      ...prev,
      images: combined
    }));
    setImageError(false);
    toast.success(`Auto-added ${angles.length} fashion angles for ${formData.category}!`);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!formData.images || formData.images.length === 0) {
      setImageError(true);
      toast.error('Multiple images required! Please add at least 1 image (4+ recommended for Myntra showcase).');
      return;
    }

    try {
      const primaryImg = formData.images[0];
      const productPayload = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
        stock_quantity: Number(formData.stock_quantity) || 25,
        images: formData.images,
        image_url: primaryImg,
        image: primaryImg,
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
          const updated = list.map((p: any) => String(p.id) === String(editingProduct.id) ? { ...p, ...productPayload } : p);
          if (!list.some((p: any) => String(p.id) === String(editingProduct.id))) {
            updated.unshift({ id: editingProduct.id, ...productPayload, created_at: (editingProduct as any).created_at || new Date().toISOString() });
          }
          localStorage.setItem('local_admin_products', JSON.stringify(updated));
        } catch (e) {}

        toast.success(`'${formData.name}' updated with ${formData.images.length} gallery images!`);
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
          created_at: new Date().toISOString()
        };

        try {
          const raw = localStorage.getItem('local_admin_products');
          const list = raw ? JSON.parse(raw) : [];
          const updated = [fullNewProduct, ...list.filter((p: any) => String(p.id) !== String(newId))];
          localStorage.setItem('local_admin_products', JSON.stringify(updated));
        } catch (e) {}

        toast.success(`'${formData.name}' published with ${formData.images.length} gallery images!`);
      }

      window.dispatchEvent(new Event('products_updated'));

      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', category: 'Sarees', price: '', compare_at_price: '', stock_quantity: '', images: [], description: '' });
      setUrlInput('');
      setImageError(false);
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
          <p className="text-gray-500 text-sm mt-1">Manage catalog with multi-image Myntra showcase</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', category: 'Sarees', price: '', compare_at_price: '', stock_quantity: '', images: [], description: '' });
            setUrlInput('');
            setImageError(false);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 rounded-full hover:bg-black transition-all shadow-lg cursor-pointer"
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
                        <div className="relative shrink-0">
                          <img 
                            src={product.image || product.images?.[0]} 
                            alt={product.name} 
                            className="w-12 h-14 rounded-xl object-cover border border-gray-100 shadow-2xs" 
                          />
                          <span className="absolute -bottom-1 -right-1 bg-black/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-xs">
                            {product.images?.length || 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 leading-tight">{product.name}</div>
                          <span className="text-[11px] text-[#D4AF37] font-semibold mt-0.5 inline-block">
                            {product.images?.length || 1} {(product.images?.length || 1) === 1 ? 'gallery photo' : 'gallery photos'}
                          </span>
                        </div>
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
                        <button onClick={() => handleEdit(product)} className="p-2 text-gray-400 hover:text-[#D4AF37] cursor-pointer" title="Edit product & gallery"><Edit className="w-5 h-5" /></button>
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
                <div>
                  <h2 className="text-2xl font-serif">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="text-xs text-gray-400 mt-1">Multi-image gallery required (Front, Angle, Fabric close-up & Back view)</p>
                </div>
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

                {/* MULTI-IMAGE PRODUCT GALLERY SECTION */}
                <div className={`p-5 rounded-3xl border-2 transition-all ${imageError && formData.images.length === 0 ? 'border-red-400 bg-red-50/40 ring-2 ring-red-200' : 'border-gray-200 bg-gray-50/60'}`}>
                  <div className="flex items-start sm:items-center justify-between gap-3 mb-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
                        <h3 className="font-serif text-base font-bold text-gray-900">
                          Product Gallery (Multiple Images Required)
                          <span className="text-red-500 ml-1 font-bold">*</span>
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Add front, angle, fabric close-up & back shots for the Myntra 2-column showcase.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
                        formData.images.length >= 4 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : formData.images.length >= 1 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : 'bg-red-100 text-red-700 border border-red-300'
                      }`}>
                        {formData.images.length} {formData.images.length === 1 ? 'Photo' : 'Photos'} Added
                        {formData.images.length >= 4 ? ' (Complete)' : ' (Min 1, 4+ recommended)'}
                      </span>

                      <button
                        type="button"
                        onClick={handleAutofillAngles}
                        className="text-xs font-bold text-[#800000] hover:text-black bg-white hover:bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Auto-fill high-fashion editorial angle shots for this category"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Autofill Angles
                      </button>
                    </div>
                  </div>

                  {/* Image Controls: Upload File & URL Input */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* URL Input */}
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          value={urlInput} 
                          onChange={(e) => setUrlInput(e.target.value)} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddUrl();
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-white rounded-2xl outline-none border border-gray-200 focus:border-[#D4AF37] text-sm" 
                          placeholder="Paste image URL (e.g. /saree_s1.jpg or https://...)" 
                        />
                        <button
                          type="button"
                          onClick={() => handleAddUrl()}
                          className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Add URL
                        </button>
                      </div>

                      {/* Multi-file upload button */}
                      <label className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap shadow-xs">
                        <Upload className="w-4 h-4 text-[#D4AF37]" />
                        {isUploading ? 'Processing...' : 'Upload Files (Multiple)'}
                        <input 
                          type="file" 
                          multiple
                          className="hidden" 
                          accept="image/*"
                          disabled={isUploading}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            setIsUploading(true);
                            try {
                              const newUrls: string[] = [];
                              for (const file of files) {
                                try {
                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
                                  const filePath = `${formData.category.toLowerCase()}/${fileName}`;
                                  const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
                                  if (!uploadError) {
                                    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
                                    if (publicUrl) {
                                      newUrls.push(publicUrl);
                                      continue;
                                    }
                                  }
                                } catch (err) {}

                                // Fallback to local DataURL for flawless offline/local operation
                                const dataUrl = await new Promise<string>((resolve) => {
                                  const reader = new FileReader();
                                  reader.onload = () => resolve(reader.result as string);
                                  reader.readAsDataURL(file);
                                });
                                if (dataUrl) newUrls.push(dataUrl);
                              }

                              if (newUrls.length > 0) {
                                setFormData(prev => ({
                                  ...prev,
                                  images: [...prev.images, ...newUrls]
                                }));
                                setImageError(false);
                                toast.success(`Added ${newUrls.length} ${newUrls.length === 1 ? 'photo' : 'photos'} to gallery!`);
                              }
                            } catch (err) {
                              toast.error('Failed to read image files');
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Visual Preview Grid of Gallery Images */}
                    {formData.images.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-gray-300 rounded-2xl text-center bg-white flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-[#D4AF37] flex items-center justify-center">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-700">No images added to gallery yet</p>
                        <p className="text-xs text-gray-400 max-w-sm">
                          Add at least 1 image (4+ recommended for front, angle, fabric close-up, and back view).
                        </p>
                        <button
                          type="button"
                          onClick={handleAutofillAngles}
                          className="mt-2 text-xs font-bold text-[#800000] bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Click here to Autofill Recommended Angles
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {formData.images.map((imgUrl, index) => {
                          const isPrimary = index === 0;
                          const slotLabel = index === 0 
                            ? '★ Primary Front' 
                            : index === 1 
                              ? 'Pose / Angle' 
                              : index === 2 
                                ? 'Fabric / Close-up' 
                                : index === 3 
                                  ? 'Back View' 
                                  : `Angle #${index + 1}`;

                          return (
                            <div 
                              key={index} 
                              className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 bg-white shadow-xs transition-all ${
                                isPrimary ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30' : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <img src={imgUrl} alt={`Product shot ${index + 1}`} className="w-full h-full object-cover" />
                              
                              {/* Slot Badge */}
                              <div className="absolute top-2 left-2 z-10">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-md ${
                                  isPrimary 
                                    ? 'bg-[#D4AF37] text-white' 
                                    : 'bg-black/70 text-white'
                                }`}>
                                  {slotLabel}
                                </span>
                              </div>

                              {/* Hover Control Actions */}
                              <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 z-20">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform active:scale-90 cursor-pointer shadow-md"
                                    title="Remove photo"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="space-y-1.5">
                                  {!isPrimary && (
                                    <button
                                      type="button"
                                      onClick={() => handleMakePrimary(index)}
                                      className="w-full py-1 px-2 bg-[#D4AF37] hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                                    >
                                      <Star className="w-3 h-3 fill-white" /> Make Primary
                                    </button>
                                  )}

                                  <div className="flex items-center justify-between gap-1">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => handleMoveImage(index, -1)}
                                      className="flex-1 py-1 bg-white/90 hover:bg-white text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-bold rounded-lg flex items-center justify-center cursor-pointer"
                                      title="Move Left"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === formData.images.length - 1}
                                      onClick={() => handleMoveImage(index, 1)}
                                      className="flex-1 py-1 bg-white/90 hover:bg-white text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-bold rounded-lg flex items-center justify-center cursor-pointer"
                                      title="Move Right"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
