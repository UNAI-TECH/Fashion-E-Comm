import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes, Package, AlertTriangle, TrendingDown, CheckCircle2,
  Plus, Search, ArrowUpRight, RefreshCw, Filter, X,
  ArrowRight, ShieldAlert, Sparkles, Upload, Check, ChevronDown,
  Layers, ShoppingBag, Eye, Store, Hash
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ensureProductImages } from '../../data/products';
import { toast } from 'sonner';

export interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  compare_at_price?: number | null;
  images: string[];
  image_url?: string | null;
  description?: string | null;
  status: string;
  stock_quantity?: number;
  sku?: string;
  low_stock_threshold?: number;
  [key: string]: any;
}

interface AdminInventorySectionProps {
  products: InventoryProduct[];
  onRefreshProducts: () => Promise<void> | void;
  onNavigateToCatalog: (searchQuery?: string) => void;
}

const CATEGORIES = ['Sarees', 'Kurtis', 'Lehengas', 'Salwar Sets', 'Western', 'Maxi', 'Tradition'];

export function AdminInventorySection({
  products = [],
  onRefreshProducts,
  onNavigateToCatalog
}: AdminInventorySectionProps) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [addMode, setAddMode] = useState<'new_product' | 'restock_existing'>('new_product');
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<InventoryProduct | null>(null);
  const [restockUnits, setRestockUnits] = useState<number>(20);
  const [restockNote, setRestockNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Product with Stock Form State
  const [newForm, setNewForm] = useState({
    name: '',
    category: 'Sarees',
    price: '',
    compare_at_price: '',
    stock_quantity: 50,
    low_stock_threshold: 10,
    sku: '',
    image_url: '',
    images: [] as string[],
    description: '',
    status: 'Published'
  });
  const [newUrlInput, setNewUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Normalized product items with stock & sku guaranteed
  const items = useMemo(() => {
    return products.map(p => {
      // Resolve stock quantity: default 25 if undefined
      const stock = typeof p.stock_quantity === 'number' ? p.stock_quantity : 25;
      const threshold = typeof p.low_stock_threshold === 'number' ? p.low_stock_threshold : 10;
      const sku = p.sku || `AAN-${(p.category || 'GEN').slice(0, 3).toUpperCase()}-${String(p.id).replace(/\D/g, '').slice(-4) || '101'}`;
      
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (stock === 0) stockStatus = 'out_of_stock';
      else if (stock <= threshold) stockStatus = 'low_stock';

      return {
        ...p,
        stock_quantity: stock,
        low_stock_threshold: threshold,
        sku,
        stockStatus
      };
    });
  }, [products]);

  // KPI Calculations
  const totalStockUnits = useMemo(() => items.reduce((sum, item) => sum + (item.stock_quantity || 0), 0), [items]);
  const inStockCount = useMemo(() => items.filter(i => i.stockStatus === 'in_stock').length, [items]);
  const lowStockCount = useMemo(() => items.filter(i => i.stockStatus === 'low_stock').length, [items]);
  const outOfStockCount = useMemo(() => items.filter(i => i.stockStatus === 'out_of_stock').length, [items]);

  // Filtered Items for Table
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesSku = (item.sku || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCat) return false;
      }
      // Category
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      // Status
      if (statusFilter !== 'all' && item.stockStatus !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshProducts();
      toast.success('Inventory synced with database');
    } catch (e) {
      toast.error('Failed to sync inventory');
    } finally {
      setIsRefreshing(false);
    }
  };



  // Open Restock Modal for specific product
  const handleOpenRestockForProduct = (product: InventoryProduct) => {
    setSelectedProductForRestock(product);
    setRestockUnits(25);
    setAddMode('restock_existing');
    setIsAddStockOpen(true);
  };

  // Submit Restock for an Existing Product
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock) {
      toast.error('Please select a product to restock');
      return;
    }
    if (restockUnits <= 0) {
      toast.error('Please enter a positive stock quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentStock = selectedProductForRestock.stock_quantity || 0;
      const newStock = currentStock + Number(restockUnits);

      // 1. Update in Supabase
      const { error } = await supabase
        .from('products')
        .update({
          stock_quantity: newStock,
          status: 'Published' // ensure product is published in catalogue
        })
        .eq('id', selectedProductForRestock.id);

      if (error) {
        toast.error('Database restock error: ' + error.message);
        return;
      }

      // 3. Broadcast events
      window.dispatchEvent(new CustomEvent('products_updated'));
      window.dispatchEvent(new Event('products_updated'));
      window.dispatchEvent(new Event('storage'));

      await onRefreshProducts();

      toast.success(
        `Added +${restockUnits} stock to "${selectedProductForRestock.name}". Total: ${newStock} units live in Product Catalogue!`,
        {
          action: {
            label: 'View in Catalogue',
            onClick: () => onNavigateToCatalog(selectedProductForRestock.name)
          }
        }
      );

      setIsAddStockOpen(false);
      setSelectedProductForRestock(null);
    } catch (err: any) {
      toast.error('Restock failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New Product with Initial Stock -> Immediately visible in Product Catalogue
  const handleAddNewProductWithStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.price) {
      toast.error('Product title and price are required');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Prepare images
      let imgList = [...newForm.images];
      if (newForm.image_url.trim() && !imgList.includes(newForm.image_url.trim())) {
        imgList.unshift(newForm.image_url.trim());
      }
      if (imgList.length === 0) {
        imgList = [newForm.category === 'Sarees' ? '/saree_s1.jpg' : '/kurti_k1.jpg'];
      }

      const guaranteedImages = ensureProductImages({
        id: 'temp',
        name: newForm.name.trim(),
        category: newForm.category,
        price: parseFloat(newForm.price),
        images: imgList,
        image: imgList[0],
        rating: 5,
        status: 'Published',
        colors: []
      });

      const primaryImg = guaranteedImages[0];
      const stockQty = Number(newForm.stock_quantity) || 50;
      const sku = newForm.sku.trim() || `AAN-${newForm.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      const productPayload = {
        name: newForm.name.trim(),
        category: newForm.category,
        price: parseFloat(newForm.price),
        compare_at_price: newForm.compare_at_price ? parseFloat(newForm.compare_at_price) : null,
        stock_quantity: stockQty,
        low_stock_threshold: Number(newForm.low_stock_threshold) || 10,
        sku,
        image_url: primaryImg,
        images: guaranteedImages,
        image: primaryImg,
        description: newForm.description.trim() || `Premium handcrafted ${newForm.category} from Aanya Fashions.`,
        status: 'Published'
      };

      // 2. Insert into Supabase
      let createdProduct: any = null;
      try {
        const { data, error } = await supabase.from('products').insert(productPayload).select().single();
        if (!error && data) {
          createdProduct = data;
        } else if (error) {
          console.warn('Supabase product insert notice:', error);
        }
      } catch (dbErr) {
        console.warn('Supabase insert notice:', dbErr);
      }

      if (!createdProduct) {
        toast.error('Failed to create product in database.');
        return;
      }

      // 4. Broadcast instant update to all tabs/windows
      window.dispatchEvent(new CustomEvent('products_updated'));
      window.dispatchEvent(new Event('products_updated'));
      window.dispatchEvent(new Event('storage'));

      // 5. Refresh parent products list
      await onRefreshProducts();

      toast.success(
        `"${createdProduct.name}" added to stock (${stockQty} units) and published to Product Catalogue!`,
        {
          action: {
            label: 'View in Catalogue',
            onClick: () => onNavigateToCatalog(createdProduct.name)
          }
        }
      );

      // Reset form
      setNewForm({
        name: '',
        category: 'Sarees',
        price: '',
        compare_at_price: '',
        stock_quantity: 50,
        low_stock_threshold: 10,
        sku: '',
        image_url: '',
        images: [],
        description: '',
        status: 'Published'
      });
      setIsAddStockOpen(false);
    } catch (err: any) {
      toast.error('Failed to add product stock: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image upload helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        let uploadedUrl = '';
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
          const filePath = `${newForm.category.toLowerCase()}/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
            if (publicUrl) uploadedUrl = publicUrl;
          }
        } catch (err) {}

        if (!uploadedUrl) {
          uploadedUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        if (uploadedUrl) newUrls.push(uploadedUrl);
      }

      if (newUrls.length > 0) {
        setNewForm(prev => ({
          ...prev,
          images: [...prev.images, ...newUrls],
          image_url: newUrls[0]
        }));
        toast.success(`Uploaded ${newUrls.length} image(s)`);
      }
    } catch (e) {
      toast.error('Image upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ─── Top Stats Grid (Real-time Inventory Metrics) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Units */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F4F6F2] flex items-center justify-center text-[#698156] flex-shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Stock Units</div>
            <div className="text-2xl font-serif font-black text-gray-900 mt-0.5">{totalStockUnits.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-gray-400 font-medium">Across {items.length} catalogue items</div>
          </div>
        </div>

        {/* Healthy In-Stock Items */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Stock Products</div>
            <div className="text-2xl font-serif font-black text-emerald-600 mt-0.5">{inStockCount}</div>
            <div className="text-[11px] text-emerald-600/80 font-medium">Sufficient warehouse stock</div>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock Warning</div>
            <div className="text-2xl font-serif font-black text-amber-600 mt-0.5">{lowStockCount}</div>
            <div className="text-[11px] text-amber-600/80 font-medium">Below reorder threshold</div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Out of Stock</div>
            <div className="text-2xl font-serif font-black text-rose-600 mt-0.5">{outOfStockCount}</div>
            <div className="text-[11px] text-rose-600/80 font-medium">Restock needed urgently</div>
          </div>
        </div>
      </div>

      {/* ─── Action Bar & Filters ─── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Search & Category dropdown */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or category…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 transition shadow-2xs"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 font-medium text-gray-700 cursor-pointer"
          >
            <option value="All">All Categories ({items.length})</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Right: Primary Add Stock button & Sync */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition cursor-pointer active:scale-95"
            title="Sync inventory with database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#698156]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setAddMode('new_product');
              setIsAddStockOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#698156] to-[#546944] hover:from-[#546944] hover:to-[#435436] text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-md shadow-[#698156]/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Stock / Product</span>
          </button>
        </div>
      </div>

      {/* ─── Status Filter Tabs ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#1A1A1A] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Items ({items.length})
        </button>

        <button
          onClick={() => setStatusFilter('in_stock')}
          className={`px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'in_stock'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>In Stock ({inStockCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('low_stock')}
          className={`px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'low_stock'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Low Stock Alert ({lowStockCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('out_of_stock')}
          className={`px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'out_of_stock'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Out of Stock ({outOfStockCount})</span>
        </button>

        <div className="ml-auto text-xs text-gray-400 font-medium hidden sm:block">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>

      {/* ─── Inventory Stock Table ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">SKU / Code</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Stock Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Boxes className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-gray-600">No inventory products match your filters</p>
                    <p className="text-xs text-gray-400 mt-1">Try resetting the search query or click "+ Add Stock / Product" above.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const img = (item.images && item.images[0]) || item.image_url || '/logo.png';
                  return (
                    <tr key={item.id} className="hover:bg-rose-50/20 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={item.name}
                            className="w-12 h-14 object-cover object-top rounded-lg border border-gray-200 bg-gray-50 shrink-0"
                            onError={e => { (e.currentTarget as any).src = '/logo.png'; }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-serif font-bold text-gray-900 text-xs sm:text-sm line-clamp-1" title={item.name}>
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] uppercase font-bold text-[#546944] bg-[#F4F6F2] px-1.5 py-0.5 rounded">
                                {item.category}
                              </span>
                              <span className="text-xs text-gray-400">ID: #{String(item.id).slice(-6)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-gray-600">
                        {item.sku}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900">₹{(item.price || 0).toLocaleString('en-IN')}</span>
                        {item.compare_at_price && (
                          <div className="text-[11px] text-gray-400 line-through">₹{item.compare_at_price.toLocaleString('en-IN')}</div>
                        )}
                      </td>

                      {/* Stock Units */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-base font-black font-serif ${
                          item.stockStatus === 'out_of_stock'
                            ? 'text-rose-600'
                            : item.stockStatus === 'low_stock'
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}>
                          {item.stock_quantity}
                        </span>
                        <div className="text-[10px] text-gray-400">units</div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.stockStatus === 'in_stock' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● In Stock
                          </span>
                        )}
                        {item.stockStatus === 'low_stock' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠ Low Stock
                          </span>
                        )}
                        {item.stockStatus === 'out_of_stock' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ✕ Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenRestockForProduct(item)}
                            className="px-3 py-1.5 bg-[#F4F6F2] hover:bg-[#698156] text-[#698156] hover:text-white border border-[#DCE4D7] rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                            title="Restock this product"
                          >
                            + Restock
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigateToCatalog(item.name)}
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200 transition cursor-pointer"
                            title="View in Product Catalogue"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ ADD STOCK / RESTOCK MODAL ═══ */}
      <AnimatePresence>
        {isAddStockOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setIsAddStockOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#DCE4D7] my-auto flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="bg-[#F4F6F2] border-b border-[#DCE4D7] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F4F6F2]0 text-white flex items-center justify-center">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-gray-900 text-base">
                      {addMode === 'new_product' ? 'Add Stock & New Product to Catalogue' : 'Restock Existing Product'}
                    </h3>
                    <p className="text-xs text-[#698156] font-medium">
                      Stock changes immediately sync to the Product Catalogue
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddStockOpen(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition shadow-2xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-2 p-1.5 bg-gray-100 border-b border-gray-100 text-xs font-bold text-gray-600">
                <button
                  type="button"
                  onClick={() => setAddMode('new_product')}
                  className={`py-2 rounded-xl transition cursor-pointer ${
                    addMode === 'new_product' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                  }`}
                >
                  ✨ Add New Product with Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('restock_existing')}
                  className={`py-2 rounded-xl transition cursor-pointer ${
                    addMode === 'restock_existing' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                  }`}
                >
                  📦 Restock Existing Product
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto flex-1">
                {addMode === 'new_product' ? (
                  /* ── FORM A: NEW PRODUCT WITH STOCK ── */
                  <form onSubmit={handleAddNewProductWithStock} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Product Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pure Georgette Embellished Saree"
                        value={newForm.name}
                        onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Category *
                        </label>
                        <select
                          value={newForm.category}
                          onChange={e => setNewForm({ ...newForm, category: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Initial Stock Units *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 50"
                          value={newForm.stock_quantity}
                          onChange={e => setNewForm({ ...newForm, stock_quantity: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-[#F4F6F2] border border-[#DCE4D7] rounded-xl text-sm font-bold text-[#2F3C25] outline-none focus:ring-2 focus:ring-[#698156]/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 3999"
                          value={newForm.price}
                          onChange={e => setNewForm({ ...newForm, price: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                          MRP (₹) <span className="text-gray-400 font-normal">opt</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 5999"
                          value={newForm.compare_at_price}
                          onChange={e => setNewForm({ ...newForm, compare_at_price: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                          SKU Code <span className="text-gray-400 font-normal">opt</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Auto-generated if blank"
                          value={newForm.sku}
                          onChange={e => setNewForm({ ...newForm, sku: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Low Stock Alert Threshold
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 10"
                          value={newForm.low_stock_threshold}
                          onChange={e => setNewForm({ ...newForm, low_stock_threshold: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20"
                        />
                      </div>
                    </div>

                    {/* Image URL or Upload */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Product Photo
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Paste image URL (e.g. https://... or /saree_s1.jpg)"
                          value={newForm.image_url}
                          onChange={e => setNewForm({ ...newForm, image_url: e.target.value })}
                          className="flex-1 px-3.5 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20"
                        />
                        <label className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading…' : 'Upload'}</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                        </label>
                      </div>
                      {newForm.image_url && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={newForm.image_url} alt="Preview" className="w-12 h-14 object-cover rounded-lg border border-gray-200" onError={e => { (e.currentTarget as any).src = '/logo.png'; }} />
                          <span className="text-xs text-emerald-600 font-medium">✓ Image preview ready</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-[#698156] to-[#546944] hover:from-[#546944] hover:to-[#435436] text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Adding Stock & Publishing to Catalogue…</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Save Stock & Show in Catalogue</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── FORM B: RESTOCK EXISTING PRODUCT ── */
                  <form onSubmit={handleRestockSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Select Catalogue Product *
                      </label>
                      <select
                        value={selectedProductForRestock?.id || ''}
                        onChange={e => {
                          const p = items.find(i => String(i.id) === e.target.value);
                          setSelectedProductForRestock(p || null);
                        }}
                        className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 font-medium"
                      >
                        <option value="">-- Choose Product to Restock --</option>
                        {items.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.category}) - Current Stock: {p.stock_quantity}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProductForRestock && (
                      <div className="p-3.5 bg-[#F4F6F2] rounded-2xl border border-[#DCE4D7] flex items-center gap-3">
                        <img
                          src={(selectedProductForRestock.images && selectedProductForRestock.images[0]) || selectedProductForRestock.image_url || '/logo.png'}
                          alt={selectedProductForRestock.name}
                          className="w-14 h-16 object-cover rounded-xl border border-[#DCE4D7]"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-bold text-gray-900 text-sm truncate">{selectedProductForRestock.name}</h4>
                          <div className="text-xs text-gray-500 mt-0.5">SKU: {selectedProductForRestock.sku} · ₹{(selectedProductForRestock.price || 0).toLocaleString('en-IN')}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-700">Current Stock:</span>
                            <span className="px-2 py-0.5 rounded text-xs font-black bg-white border border-[#DCE4D7] text-[#546944]">
                              {selectedProductForRestock.stock_quantity} units
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Units to Add *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 25"
                        value={restockUnits}
                        onChange={e => setRestockUnits(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3.5 py-2 bg-[#F4F6F2] border border-[#DCE4D7] rounded-xl text-base font-black text-[#2F3C25] outline-none focus:ring-2 focus:ring-[#698156]/20"
                      />

                      {/* Quick stock chips */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-gray-400 font-medium">Quick add:</span>
                        {[+10, +25, +50, +100].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setRestockUnits(amt)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-[#EBF0E6] hover:text-[#546944] rounded-lg text-xs font-bold text-gray-600 transition cursor-pointer"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedProductForRestock && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-800">New Total Stock in Catalogue:</span>
                        <span className="font-black text-emerald-900 text-sm">
                          {(selectedProductForRestock.stock_quantity || 0) + Number(restockUnits)} units
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Restock Note <span className="text-gray-400 font-normal">opt</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. New festival batch received from weaver"
                        value={restockNote}
                        onChange={e => setRestockNote(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || !selectedProductForRestock}
                        className="w-full py-3 bg-gradient-to-r from-[#698156] to-[#546944] hover:from-[#546944] hover:to-[#435436] text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Updating Catalogue Stock…</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Confirm Restock & Update Catalogue</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
