import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Plus, Trash2, Edit3, MoveLeft, MoveRight,
  UploadCloud, Check, X, RefreshCw, Eye, ArrowUpRight,
  Palette, Search, ShoppingBag, Shirt, CheckCircle2, RotateCcw
} from 'lucide-react';
import {
  HeroModel,
  MODEL_PRESETS,
  DEFAULT_HERO_MODELS,
  fetchAllHeroModelsAdmin,
  saveHeroModel,
  deleteHeroModel,
  resetHeroModelsToDefault,
  uploadModelImage,
  setLocalHeroModels,
  resolveTransparentCutoutUrl
} from '../../data/heroModels';
import { toast } from 'sonner';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url?: string;
  images?: string[];
  [key: string]: any;
}

interface AdminHeroModelsSectionProps {
  products: ProductItem[];
  onRefreshProducts?: () => void;
}

const PRESET_COLORS = [
  { name: 'Royal Blue', hex: '#1E3A8A' },
  { name: 'Aanya Pink', hex: '#EC4899' },
  { name: 'Gold / Champagne', hex: '#D4AF37' },
  { name: 'Emerald Green', hex: '#047857' },
  { name: 'Sunset Peach', hex: '#EA580C' },
  { name: 'Pastel Lilac', hex: '#8B5CF6' },
  { name: 'Berry Rose', hex: '#BE185D' },
  { name: 'Midnight Charcoal', hex: '#1F2937' },
];

export function AdminHeroModelsSection({ products }: AdminHeroModelsSectionProps) {
  const [heroModels, setHeroModels] = useState<HeroModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);

  // Form State
  const emptyForm = {
    id: '',
    label: '',
    subtitle: 'Discover Trending Styles',
    color: '#EC4899',
    src: '/model_1.png',
    productId: '',
    productName: '',
    price: 0,
    link: '',
    status: 'Active' as 'Active' | 'Inactive',
    display_order: 1,
  };
  const [form, setForm] = useState(emptyForm);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [catalogDressSearch, setCatalogDressSearch] = useState<string>('');
  const [imageSourceTab, setImageSourceTab] = useState<'preset' | 'upload' | 'product' | 'url'>('product');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studioFileInputRef = useRef<HTMLInputElement>(null);
  const [studioTab, setStudioTab] = useState<'dresses' | 'models' | 'upload'>('dresses');

  // Load models from Supabase Admin
  const loadModels = async (targetIdx?: number) => {
    setLoading(true);
    try {
      const data = await fetchAllHeroModelsAdmin();
      setHeroModels(data);
      if (typeof targetIdx === 'number' && targetIdx >= 0 && targetIdx < data.length) {
        setActivePreviewIdx(targetIdx);
      } else if (data.length > 0 && activePreviewIdx >= data.length) {
        setActivePreviewIdx(0);
      }
    } catch (e: any) {
      toast.error('Failed to load hero models: ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  // Keyboard shortcut (Escape) to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !isSaving && !isUploading) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSaving, isUploading]);

  // Open modal to add new
  const handleAddNew = () => {
    setForm({
      ...emptyForm,
      display_order: heroModels.length + 1,
    });
    setProductSearch('');
    setImageSourceTab('product');
    setIsModalOpen(true);
  };

  // Open modal to edit existing
  const handleEdit = (model: HeroModel) => {
    setForm({
      id: model.id,
      label: model.label,
      subtitle: model.subtitle || 'Discover Trending Styles',
      color: model.color || '#EC4899',
      src: model.src,
      productId: model.productId || '',
      productName: model.productName || '',
      price: model.price || 0,
      link: model.link || '',
      status: model.status || 'Active',
      display_order: model.display_order,
    });
    setProductSearch('');
    setImageSourceTab(model.productId ? 'product' : model.src.startsWith('/model_') ? 'preset' : 'url');
    setIsModalOpen(true);
  };

  // Select catalog product - automatically dresses the model in that outfit with transparent cutout!
  const handleSelectProduct = (prod: ProductItem) => {
    let prodImg = prod.image_url || (prod.images && prod.images[0]) || (prod as any).image || '';

    // Prefer high-fashion full body transparent model photography for hero banner presentation
    if (prod.name.toLowerCase().includes('maroon') && prod.name.toLowerCase().includes('saree')) {
      prodImg = '/saree_maroon_model_cutout.png';
    } else if (prod.name.toLowerCase().includes('emerald') && prod.name.toLowerCase().includes('saree')) {
      prodImg = '/saree_emerald_model_cutout.png';
    } else {
      prodImg = resolveTransparentCutoutUrl(prodImg);
    }

    // Auto-detect a matching color from PRESET_COLORS or product colors
    let selectedColor = '#EC4899';
    if ((prod as any).colors && (prod as any).colors.length > 0) {
      selectedColor = (prod as any).colors[0];
    } else {
      const match = PRESET_COLORS.find(c =>
        prod.name.toLowerCase().includes(c.name.toLowerCase()) ||
        prod.name.toLowerCase().includes(c.name.split(' ')[0].toLowerCase())
      );
      if (match) {
        selectedColor = match.hex;
      }
    }

    setForm(prev => ({
      ...prev,
      productId: prod.id,
      productName: prod.name,
      label: prod.name,
      price: prod.price || 0,
      subtitle: `Discover Trending ${prod.category || 'Styles'}`,
      link: `/product/${prod.id}`,
      src: prodImg || prev.src,
      color: selectedColor || prev.color || '#EC4899',
    }));

    if (prodImg) {
      setImageSourceTab('product');
    }
    toast.success(`Selected "${prod.name}" — Background removed automatically, model is wearing dress!`);
  };

  // File upload handler - automatically removes background so only standing model appears!
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Removing background automatically & preparing model cutout...');
    try {
      let fileToUpload: File = file;
      try {
        const { removeBackground } = await import('@imgly/background-removal');
        const blob = await removeBackground(file);
        fileToUpload = new File([blob], file.name.replace(/\.[^.]+$/, '') + '_cutout.png', { type: 'image/png' });
        toast.success('Background removed automatically! Cutout ready.', { id: toastId });
      } catch (bgErr) {
        console.warn('Auto background removal fallback to direct upload:', bgErr);
        toast.info('Uploading photo...', { id: toastId });
      }

      const url = await uploadModelImage(fileToUpload);
      setForm(prev => ({ ...prev, src: url }));
    } catch (err: any) {
      toast.error('Image upload failed: ' + (err?.message || ''), { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Save Model Outfit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.label.trim()) {
      toast.error('Please provide an outfit title.');
      return;
    }
    if (!form.src) {
      toast.error('Please select or upload a model image.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanForm: Partial<HeroModel> = {
        ...form,
        src: resolveTransparentCutoutUrl(form.src),
      };
      const saved = await saveHeroModel(cleanForm);
      toast.success(`Model outfit "${saved.label}" saved and updated on homepage!`);
      setIsModalOpen(false);
      await loadModels((form.display_order ?? 1) - 1);
    } catch (err: any) {
      toast.error('Failed to save model outfit: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  // Reorder / Move model
  const handleMove = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroModels.length) return;

    const list = [...heroModels];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Recalculate display_order
    list.forEach((m, idx) => {
      m.display_order = idx + 1;
    });

    setHeroModels([...list]);

    try {
      for (const m of list) {
        await saveHeroModel(m);
      }
      toast.success('Homepage hero carousel sequence updated!');
    } catch (e: any) {
      toast.error('Failed to save new order: ' + (e?.message || ''));
    }
  };

  // Quick switch dress directly from slot card
  const handleQuickAssignDress = async (model: HeroModel, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    let prodImg = prod.image_url || (prod.images && prod.images[0]) || (prod as any).image || model.src;

    // Prefer high-fashion full body transparent model photography for hero banner presentation
    if (prod.name.toLowerCase().includes('maroon') && prod.name.toLowerCase().includes('saree')) {
      prodImg = '/saree_maroon_model_cutout.png';
    } else if (prod.name.toLowerCase().includes('emerald') && prod.name.toLowerCase().includes('saree')) {
      prodImg = '/saree_emerald_model_cutout.png';
    } else {
      prodImg = resolveTransparentCutoutUrl(prodImg);
    }

    let selectedColor = model.color || '#EC4899';
    if ((prod as any).colors && (prod as any).colors.length > 0) {
      selectedColor = (prod as any).colors[0];
    } else {
      const match = PRESET_COLORS.find(c =>
        prod.name.toLowerCase().includes(c.name.toLowerCase()) ||
        prod.name.toLowerCase().includes(c.name.split(' ')[0].toLowerCase())
      );
      if (match) selectedColor = match.hex;
    }

    const updated: HeroModel = {
      ...model,
      src: prodImg,
      label: prod.name,
      productName: prod.name,
      productId: prod.id,
      price: prod.price || model.price || 0,
      subtitle: `Discover Trending ${prod.category || 'Styles'}`,
      link: `/product/${prod.id}`,
      color: selectedColor,
    };

    // 1. Immediately update local state in admin UI
    const nextList = heroModels.map(m => (m.id === model.id || m.display_order === model.display_order) ? updated : m);
    setHeroModels(nextList);

    // 2. Immediately update local storage and broadcast to homepage tab with active slot index
    setLocalHeroModels(nextList, model.display_order - 1);

    // 3. Auto-save to Supabase
    try {
      await saveHeroModel(updated);
      toast.success(`Slot #${model.display_order} is now wearing "${prod.name}"! Live on Hero Section.`);
    } catch (e: any) {
      toast.error('Failed to update model dress: ' + (e?.message || ''));
    }
  };

  // Quick switch studio model/pose directly from studio card
  const handleQuickAssignModel = async (model: HeroModel, preset: typeof MODEL_PRESETS[0]) => {
    const updated: HeroModel = {
      ...model,
      src: preset.src,
      label: preset.name,
      color: preset.defaultColor || model.color,
      subtitle: `Discover Trending ${preset.name.split(' ').slice(-1)[0] || 'Styles'}`,
    };

    // 1. Immediately update local state in admin UI
    const nextList = heroModels.map(m => (m.id === model.id || m.display_order === model.display_order) ? updated : m);
    setHeroModels(nextList);

    // 2. Immediately update local storage and broadcast to homepage tab with active slot index
    setLocalHeroModels(nextList, model.display_order - 1);

    // 3. Auto-save to Supabase
    try {
      await saveHeroModel(updated);
      toast.success(`Slot #${model.display_order} model changed to "${preset.name}"! Live on Hero Section.`);
    } catch (e: any) {
      toast.error('Failed to update model: ' + (e?.message || ''));
    }
  };

  // Quick upload custom photo directly from studio card
  const handleStudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeModelPreview) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Removing background & applying to Slot #${activeModelPreview.display_order}...`);
    try {
      let fileToUpload: File = file;
      try {
        const { removeBackground } = await import('@imgly/background-removal');
        const blob = await removeBackground(file);
        fileToUpload = new File([blob], file.name.replace(/\.[^.]+$/, '') + '_cutout.png', { type: 'image/png' });
        toast.success('Background removed automatically! Cutout ready.', { id: toastId });
      } catch (bgErr) {
        console.warn('Auto background removal fallback to direct upload:', bgErr);
        toast.info('Uploading photo...', { id: toastId });
      }

      const url = await uploadModelImage(fileToUpload);
      const updated: HeroModel = {
        ...activeModelPreview,
        src: url,
        label: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
      };

      const nextList = heroModels.map(m => (m.id === activeModelPreview.id || m.display_order === activeModelPreview.display_order) ? updated : m);
      setHeroModels(nextList);
      setLocalHeroModels(nextList, activeModelPreview.display_order - 1);
      await saveHeroModel(updated);
      toast.success(`Slot #${activeModelPreview.display_order} updated with new custom photo! Live on Hero Section.`);
    } catch (err: any) {
      toast.error('Image upload failed: ' + (err?.message || ''), { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (model: HeroModel) => {
    const nextStatus = model.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await saveHeroModel({ ...model, status: nextStatus });
      setHeroModels(prev => prev.map(m => m.id === model.id ? { ...m, status: nextStatus } : m));
      toast.success(`Model "${model.label}" is now ${nextStatus}`);
    } catch (e: any) {
      toast.error('Update failed: ' + (e?.message || ''));
    }
  };

  // Delete model
  const handleDelete = async (model: HeroModel) => {
    if (heroModels.length <= 1) {
      toast.error('You must keep at least 1 hero model on the banner.');
      return;
    }
    if (!confirm(`Are you sure you want to remove model outfit "${model.label}" from the homepage banner?`)) {
      return;
    }

    try {
      await deleteHeroModel(model.id);
      toast.success(`Model outfit "${model.label}" removed.`);
      await loadModels();
    } catch (e: any) {
      toast.error('Failed to remove: ' + (e?.message || ''));
    }
  };

  // Reset to defaults
  const handleResetDefaults = async () => {
    if (!confirm('Reset all hero banner models and dresses to the original default collection?')) {
      return;
    }
    setLoading(true);
    try {
      const defs = await resetHeroModelsToDefault();
      setHeroModels(defs);
      toast.success('Hero models reset to default showcase!');
    } catch (e: any) {
      toast.error('Failed to reset: ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Filtered products for quick-link search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 15);

  const selectedProduct = products.find(p => p.id === form.productId);
  const selectedProductImages = selectedProduct
    ? (selectedProduct.images && selectedProduct.images.length > 0
        ? selectedProduct.images
        : (selectedProduct.image_url ? [selectedProduct.image_url] : (selectedProduct as any).image ? [(selectedProduct as any).image] : []))
    : [];

  const filteredCatalogDresses = products.filter(p => {
    const matchesCat = categoryFilter === 'All' ||
      (p.category && p.category.toLowerCase().includes(categoryFilter.toLowerCase())) ||
      (p.name && p.name.toLowerCase().includes(categoryFilter.toLowerCase()));
    const matchesSearch = !catalogDressSearch.trim() ||
      p.name.toLowerCase().includes(catalogDressSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(catalogDressSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const activeModelPreview = heroModels[activePreviewIdx] || heroModels[0] || DEFAULT_HERO_MODELS[0];

  return (
    <div className="space-y-8">
      {/* ─── Header & Top Actions ─── */}
      <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-white border border-pink-100/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Model Dresses & Hero Showcase
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Choose what outfits the models wear in the homepage hero banner. Link any product from your catalog, upload a model photo or pick a studio pose, and it appears in real time on your storefront!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#EC4899] hover:bg-pink-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Dress New Model
          </button>
        </div>
      </div>

      {/* ─── Live Homepage Banner Simulation ─── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-base font-bold text-gray-900">
              Live Banner Simulator (Active Storefront View)
            </h3>
            <span className="text-xs text-pink-600 font-semibold hidden sm:inline">
              · Click any model below to change her outfit
            </span>
          </div>
          <button
            onClick={handleResetDefaults}
            className="text-xs font-bold text-gray-400 hover:text-pink-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Showcase Defaults</span>
          </button>
        </div>

        {/* Simulator Box */}
        <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-rose-100 flex items-end justify-center bg-gradient-to-b from-[#FDFBF7] to-white select-none">
          <img
            src="/hero_bg_floral_white.png"
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-80"
          />

          {/* Left Text Preview */}
          <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 z-20 max-w-xs space-y-1.5 pointer-events-none">
            <h4
              className="font-serif text-2xl sm:text-3xl font-black italic tracking-tight drop-shadow-sm leading-tight transition-colors duration-500"
              style={{ color: activeModelPreview?.color || '#1E3A8A' }}
            >
              The New Aesthetic.
            </h4>
            <p className="text-xs text-gray-800 font-bold uppercase tracking-wider">
              {activeModelPreview?.subtitle || 'Discover Trending Styles'}
            </p>
            {activeModelPreview?.link && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-[11px] font-bold shadow-sm mt-2"
                style={{ backgroundColor: activeModelPreview?.color || '#EC4899' }}>
                <span>Shop This Look</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Models Lineup */}
          <div className="relative z-10 w-full h-full flex items-end justify-end pr-4 sm:pr-12 gap-3 sm:gap-6 overflow-x-auto pb-4">
            {heroModels.map((model, idx) => {
              const isActive = idx === activePreviewIdx;
              return (
                <motion.div
                  key={model.id || idx}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setActivePreviewIdx(idx)}
                  className={`relative flex flex-col items-center justify-end cursor-pointer transition-all duration-300 ${
                    isActive ? 'scale-110 z-20 opacity-100' : 'opacity-65 hover:opacity-90'
                  }`}
                  style={{ height: isActive ? '88%' : '75%' }}
                >
                  <div className="h-full flex items-end justify-center relative">
                    <img
                      src={resolveTransparentCutoutUrl(model.src)}
                      alt={model.label}
                      className="h-full w-auto max-h-[100%] object-contain object-bottom drop-shadow-md"
                    />
                  </div>
                  <div
                    className="absolute -bottom-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap shadow-sm z-10"
                    style={{ backgroundColor: model.color || '#EC4899' }}
                  >
                    Slot #{idx + 1}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Clean Interactive Model Slot Studio (No Clumsy Duplicate Cards) ─── */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
            <p className="text-sm font-medium">Loading hero models…</p>
          </div>
        ) : heroModels.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4">
            <Shirt className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="font-serif text-lg font-bold text-gray-800">No Models Configured</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Add your first model outfit or reset to defaults to showcase dresses on the homepage.
            </p>
            <button onClick={handleResetDefaults} className="px-5 py-2 bg-pink-500 text-white rounded-full text-xs font-bold cursor-pointer">
              Restore Defaults
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Slot Dedicated Outfit Studio */}
            {activeModelPreview && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
                {/* Active Slot Header & Quick Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-xs text-white flex-shrink-0"
                      style={{ backgroundColor: activeModelPreview.color || '#EC4899' }}
                    >
                      #{activePreviewIdx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-lg font-bold text-gray-900">
                          Slot #{activePreviewIdx + 1}: {activeModelPreview.label}
                        </h3>
                        <button
                          onClick={() => handleToggleStatus(activeModelPreview)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            activeModelPreview.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {activeModelPreview.status || 'Active'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activeModelPreview.productName ? `Wearing: ${activeModelPreview.productName}` : 'Custom Model Outfit'}
                        {activeModelPreview.price ? ` · ₹${activeModelPreview.price.toLocaleString('en-IN')}` : ''}
                      </p>
                    </div>

                    {/* Quick Switch Slot Buttons directly in header */}
                    <div className="flex items-center gap-1.5 ml-1 sm:ml-4 sm:pl-4 sm:border-l sm:border-gray-100">
                      {heroModels.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActivePreviewIdx(i)}
                          className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            i === activePreviewIdx
                              ? 'bg-gray-900 text-white shadow-xs scale-105'
                              : 'bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                          }`}
                          title={`Switch to Slot #${i + 1}`}
                        >
                          #{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Reorder, Customize Modal, Delete */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      disabled={activePreviewIdx === 0}
                      onClick={() => handleMove(activePreviewIdx, 'left')}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                      title="Move Left in carousel"
                    >
                      <MoveLeft className="w-3.5 h-3.5" />
                      <span>Move Left</span>
                    </button>
                    <button
                      disabled={activePreviewIdx === heroModels.length - 1}
                      onClick={() => handleMove(activePreviewIdx, 'right')}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                      title="Move Right in carousel"
                    >
                      <span>Move Right</span>
                      <MoveRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEdit(activeModelPreview)}
                      className="px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#EC4899] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Custom Photo / Details</span>
                    </button>
                  </div>
                </div>

                {/* Fast 1-Click Studio Switcher: Catalog Dresses, Studio Models, or Upload Photo */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-serif text-base font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        <span>Change Model or Outfit on Slot #{activePreviewIdx + 1}</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Click any model or dress below. Background is removed automatically, auto-saves to Supabase, and updates live on homepage.
                      </p>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
                      <button
                        onClick={() => setStudioTab('dresses')}
                        className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          studioTab === 'dresses'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Shirt className="w-3.5 h-3.5 text-pink-500" />
                        <span>Catalog Dresses</span>
                      </button>
                      <button
                        onClick={() => setStudioTab('models')}
                        className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          studioTab === 'models'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>Studio Models</span>
                      </button>
                      <button
                        onClick={() => setStudioTab('upload')}
                        className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          studioTab === 'upload'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  </div>

                  {/* ─── TAB 1: CATALOG DRESSES ─── */}
                  {studioTab === 'dresses' && (
                    <div className="space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {['All', 'Saree', 'Kurti', 'Lehenga', 'Salwar', 'Western', 'Maxi'].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setCategoryFilter(cat)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                categoryFilter === cat
                                  ? 'bg-[#EC4899] text-white shadow-xs font-bold scale-102'
                                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
                              }`}
                            >
                              {cat === 'All' ? 'All Outfits' : cat}
                            </button>
                          ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search dresses..."
                            value={catalogDressSearch}
                            onChange={e => setCatalogDressSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-gray-50 rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-pink-400/20 w-48 sm:w-56"
                          />
                        </div>
                      </div>

                      {/* Compact Clean Dresses Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 max-h-[460px] overflow-y-auto pr-1 pt-1">
                        {filteredCatalogDresses.map(prod => {
                          const isCurrentlyWorn = activeModelPreview.productId === prod.id || activeModelPreview.label === prod.name;
                          const cutoutImg = resolveTransparentCutoutUrl(prod.image_url || (prod.images && prod.images[0]) || '');
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleQuickAssignDress(activeModelPreview, prod.id)}
                              className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                isCurrentlyWorn
                                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-300 shadow-sm'
                                  : 'border-gray-200/80 bg-white hover:border-pink-300 hover:shadow-md'
                              }`}
                            >
                              <div className="h-32 w-full flex items-end justify-center overflow-hidden rounded-xl bg-gray-50/60 p-1 relative">
                                <img
                                  src={cutoutImg}
                                  alt={prod.name}
                                  className="h-full w-auto max-h-[100%] object-contain object-bottom drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                                />
                                {isCurrentlyWorn && (
                                  <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 space-y-0.5">
                                <p className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-pink-600 transition-colors" title={prod.name}>
                                  {prod.name}
                                </p>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 capitalize">{prod.category || 'Dress'}</span>
                                  <span className="font-bold text-[#EC4899]">₹{prod.price?.toLocaleString('en-IN')}</span>
                                </div>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-center">
                                {isCurrentlyWorn ? (
                                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Wearing Now
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#EC4899] flex items-center gap-1">
                                    <span>Wear on Slot #{activePreviewIdx + 1}</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ─── TAB 2: STUDIO MODELS ─── */}
                  {studioTab === 'models' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 max-h-[460px] overflow-y-auto pr-1 pt-1">
                      {MODEL_PRESETS.map(preset => {
                        const isSelected = activeModelPreview.src === preset.src || activeModelPreview.label === preset.name;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handleQuickAssignModel(activeModelPreview, preset)}
                            className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-300 shadow-sm'
                                : 'border-gray-200/80 bg-white hover:border-purple-300 hover:shadow-md'
                            }`}
                          >
                            <div className="h-36 w-full flex items-end justify-center overflow-hidden rounded-xl bg-gray-50/60 p-1 relative">
                              <img
                                src={preset.src}
                                alt={preset.name}
                                className="h-full w-auto max-h-[100%] object-contain object-bottom drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                              />
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>

                            <div className="mt-2 space-y-0.5">
                              <p className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-purple-600 transition-colors" title={preset.name}>
                                {preset.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                <span className="w-2.5 h-2.5 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: preset.defaultColor }} />
                                <span>Studio Cutout</span>
                              </div>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-center">
                              {isSelected ? (
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active Model
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-purple-600 flex items-center gap-1">
                                  <span>Set on Slot #{activePreviewIdx + 1}</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ─── TAB 3: UPLOAD PHOTO ─── */}
                  {studioTab === 'upload' && (
                    <div className="p-8 border-2 border-dashed border-pink-200 hover:border-pink-400 rounded-3xl bg-pink-50/20 text-center space-y-4">
                      <input
                        ref={studioFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleStudioFileUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => studioFileInputRef.current?.click()}
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-4"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-pink-500">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                          {isUploading ? `Removing background & applying to Slot #${activePreviewIdx + 1}…` : `Click to Upload Custom Photo for Slot #${activePreviewIdx + 1}`}
                        </p>
                        <p className="text-xs text-gray-400 max-w-sm">
                          Supports PNG, JPG, or WEBP. Background is automatically removed and model cutout is set live on your storefront instantly.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ DRESS MODEL WITH PRODUCT MODAL (UNIFIED LIVE STUDIO FITTING) ═══ */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            onClick={() => !isSaving && !isUploading && setIsModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#FDFBF7] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col my-auto overflow-hidden border border-rose-100"
            >
              {/* Modal Header */}
              <div className="bg-pink-50/90 border-b border-pink-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-pink-500 shadow-sm flex-shrink-0">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-gray-900">
                      {form.id ? `Change Model Dress (Slot #${form.display_order})` : 'Dress New Homepage Model'}
                    </h3>
                    <p className="text-xs text-pink-600 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Click any catalog dress below — model instantly wears it live
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-pink-100 text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - 2-Column Responsive Studio Layout */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* ─── LEFT COLUMN: DRESS PICKER & CUSTOMIZATION (7 cols) ─── */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Step 1: Catalog Dress Picker */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-pink-500" />
                        Step 1: Choose Catalog Dress to Wear
                      </label>
                      <span className="text-[11px] text-pink-600 font-semibold">
                        {filteredProducts.length} dresses available
                      </span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search dresses (e.g. Silk Saree, Chanderi Kurta, Lehenga)..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50/80 rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-pink-500/20"
                      />
                    </div>

                    {/* Scrollable Catalog Products List */}
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-50">
                      {filteredProducts.map(p => {
                        const isSelected = form.productId === p.id;
                        const pImg = p.image_url || (p.images && p.images[0]) || '/model_1.png';
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-pink-50 border-2 border-pink-500 shadow-xs'
                                : 'hover:bg-gray-50 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={pImg}
                                alt={p.name}
                                className="w-10 h-12 object-cover object-center rounded-lg border border-gray-200 shadow-2xs flex-shrink-0"
                              />
                              <div className="truncate">
                                <p className="font-bold truncate text-gray-900 text-xs">{p.name}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{p.category} · <span className="font-bold text-[#EC4899]">₹{p.price.toLocaleString('en-IN')}</span></p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isSelected ? (
                                <span className="px-2.5 py-1 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                  <Check className="w-3 h-3" />
                                  <span>Wearing</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-700 hover:text-pink-700 text-[10px] font-bold transition-all"
                                >
                                  Wear Dress
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Outfit Photo / Source Options */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-xs space-y-3">
                    <label className="text-xs uppercase tracking-wider font-bold text-gray-800 flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-pink-500" />
                      Step 2: Model Photo & Studio Pose
                    </label>

                    {/* Source tabs */}
                    <div className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1 text-[11px] font-bold text-gray-600">
                      <button
                        type="button"
                        onClick={() => setImageSourceTab('product')}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                          imageSourceTab === 'product' ? 'bg-white text-pink-600 shadow-xs' : 'hover:text-gray-900'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">Catalog Dress</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSourceTab('preset')}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer truncate ${
                          imageSourceTab === 'preset' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                        }`}
                      >
                        Studio Cutouts
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSourceTab('upload')}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer truncate ${
                          imageSourceTab === 'upload' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                        }`}
                      >
                        Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSourceTab('url')}
                        className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer truncate ${
                          imageSourceTab === 'url' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>

                    {/* Tab 0: Catalog Product Dress Angles */}
                    {imageSourceTab === 'product' && (
                      <div className="space-y-2 pt-1">
                        {selectedProduct ? (
                          <div className="space-y-2">
                            {selectedProductImages.length > 1 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                  Available Dress Angles / Photos:
                                </span>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                  {selectedProductImages.map((img, i) => {
                                    const cutoutImg = resolveTransparentCutoutUrl(img);
                                    const isSelected = form.src === img || form.src === cutoutImg;
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, src: cutoutImg }))}
                                        className={`w-12 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                                          isSelected
                                            ? 'border-pink-500 ring-2 ring-pink-300'
                                            : 'border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100'
                                        }`}
                                      >
                                        <img src={cutoutImg} alt={`Angle ${i + 1}`} className="w-full h-full object-contain p-0.5" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Selected: {selectedProduct.name}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-500 italic">
                            Click any dress in Step 1 above to automatically wear it.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tab 1: Studio Cutouts */}
                    {imageSourceTab === 'preset' && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                        {MODEL_PRESETS.map(preset => {
                          const isSelected = form.src === preset.src;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setForm(prev => ({
                                ...prev,
                                src: preset.src,
                                color: prev.color || preset.defaultColor
                              }))}
                              className={`h-20 rounded-xl border p-1 flex flex-col items-center justify-end relative transition-all cursor-pointer bg-gray-50/50 ${
                                isSelected
                                  ? 'border-pink-500 ring-2 ring-pink-300 bg-pink-50/40'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img
                                src={preset.src}
                                alt={preset.name}
                                className="h-full w-auto object-contain object-bottom pointer-events-none"
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-pink-500 text-white rounded-full flex items-center justify-center text-[9px]">
                                  ✓
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Tab 2: Upload Photo */}
                    {imageSourceTab === 'upload' && (
                      <div className="space-y-3 pt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-pink-200 hover:border-pink-400 bg-pink-50/30 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center gap-1.5"
                        >
                          <UploadCloud className="w-6 h-6 text-pink-400" />
                          <p className="text-xs font-bold text-gray-700">
                            {isUploading ? 'Uploading to Supabase…' : 'Click to upload custom photo'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            PNG, JPG, or WEBP
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Image URL */}
                    {imageSourceTab === 'url' && (
                      <div className="space-y-2 pt-1">
                        <input
                          type="url"
                          placeholder="https://example.com/dress.jpg"
                          value={form.src}
                          onChange={e => setForm({ ...form, src: e.target.value })}
                          className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-pink-500/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Step 3: Outfit Titles & Colors */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-xs space-y-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                        Outfit Title / Dress Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Royal Maroon Silk Saree"
                        value={form.label}
                        onChange={e => setForm({ ...form, label: e.target.value })}
                        className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-pink-500/20 font-bold text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                        Subtitle / Tagline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Discover Trending Sarees"
                        value={form.subtitle}
                        onChange={e => setForm({ ...form, subtitle: e.target.value })}
                        className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-pink-500/20 text-gray-700"
                      />
                    </div>

                    {/* Color Theme Selector */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-pink-500" />
                        Theme Highlight Color
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setForm({ ...form, color: c.hex })}
                            className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                              form.color === c.hex ? 'border-gray-900 scale-110 shadow-sm' : 'border-white'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {form.color === c.hex && <Check className="w-3 h-3 text-white" />}
                          </button>
                        ))}
                        <div className="flex items-center gap-1.5 ml-1">
                          <input
                            type="color"
                            value={form.color}
                            onChange={e => setForm({ ...form, color: e.target.value })}
                            className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                          />
                          <span className="text-[10px] font-mono text-gray-500 uppercase">{form.color}</span>
                        </div>
                      </div>
                    </div>

                    {/* Position & Status */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                          Hero Slot Position
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={form.display_order}
                          onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 1 })}
                          className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-pink-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1">
                          Storefront Status
                        </label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value as any })}
                          className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer"
                        >
                          <option value="Active">Active (Visible)</option>
                          <option value="Inactive">Inactive (Hidden)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── RIGHT COLUMN: LIVE MODEL FITTING & STOREFRONT PREVIEW (5 cols) ─── */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    {/* Live Review Status Header */}
                    <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3 flex items-center justify-between text-xs shadow-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Live Model Fitting Preview</span>
                      </div>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-emerald-700 border border-emerald-200">
                        Real-time
                      </span>
                    </div>

                    {/* Big Studio Model Display */}
                    <div
                      className="relative rounded-3xl border border-gray-200 shadow-md p-5 flex flex-col justify-between overflow-hidden min-h-[360px]"
                      style={{
                        background: `radial-gradient(circle at center, ${form.color}25 0%, #FFFFFF 85%)`
                      }}
                    >
                      {/* Top Tagline */}
                      <div className="space-y-1 relative z-10 text-center sm:text-left">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-xs"
                          style={{ backgroundColor: form.color || '#EC4899' }}
                        >
                          {form.label || 'Outfit Title'}
                        </span>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {form.subtitle || 'Discover Trending Styles'}
                        </p>
                      </div>

                      {/* Model In-Context Preview */}
                      <div className="flex-1 flex flex-col items-center justify-end my-3 relative z-10">
                        <div className="absolute bottom-1 w-28 h-3 rounded-full bg-black/15 blur-sm pointer-events-none" />
                        <motion.img
                          key={form.src}
                          initial={{ opacity: 0.7, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          src={resolveTransparentCutoutUrl(form.src) || '/model_1.png'}
                          alt="Fitting preview"
                          className="max-h-60 sm:max-h-68 w-auto object-contain object-bottom drop-shadow-[0_15px_25px_rgba(0,0,0,0.18)]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/model_1.png';
                          }}
                        />
                        {form.productName && (
                          <span className="mt-2 text-[10px] bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full border border-pink-200 text-pink-700 font-bold shadow-xs">
                            👗 Wearing: {form.productName}
                          </span>
                        )}
                      </div>

                      {/* Checkout Action Link Box */}
                      <div className="relative z-10 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900 truncate">
                            {form.productName || form.label || 'Trending Dress'}
                          </span>
                          {form.price > 0 && (
                            <span className="font-bold text-[#EC4899]">
                              ₹{form.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {form.link ? (
                          <a
                            href={form.link}
                            target="_blank"
                            rel="noreferrer"
                            title="Test live storefront checkout in new tab"
                            className="w-full py-2 rounded-xl text-white text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                            style={{ backgroundColor: form.color || '#EC4899' }}
                          >
                            <span>Test Live Checkout</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <div
                            className="w-full py-2 rounded-xl text-white text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1.5"
                            style={{ backgroundColor: form.color || '#EC4899' }}
                          >
                            <span>Shop This Look</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-[2] py-3 px-6 bg-[#EC4899] hover:bg-pink-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving & Updating…</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save & Update Hero Banner</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
