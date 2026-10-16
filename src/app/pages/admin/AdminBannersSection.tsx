import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon, Plus, Trash2, Edit3, MoveLeft, MoveRight,
  UploadCloud, Check, X, RotateCcw, Eye, ArrowUpRight,
  Link as LinkIcon, Award, ExternalLink, RefreshCw, AlertCircle
} from 'lucide-react';
import {
  AdBanner,
  DEFAULT_AD_BANNERS,
  fetchAllBannersAdmin,
  saveBanner,
  deleteBanner,
  resetBannersToDefault,
  uploadBannerImage,
  setLocalBanners
} from '../../data/banners';
import { toast } from 'sonner';

const PRESET_BANNERS = [
  {
    title: 'Mega Blockbuster Saree Sale — Up to 80% Off',
    subtitle: 'Festive Maroon & Gold Pure Silk Sarees',
    badge: 'MEGA BLOCKBUSTER SALE',
    image_url: '/banners/festive_saree_sale_banner.jpg',
    link_url: '/category/sarees',
  },
  {
    title: 'Flat 50-70% Off Handcrafted Heritage Silk',
    subtitle: 'Royal Emerald & Gold Zari Banarasi Weaves',
    badge: 'ROYAL WEDDING COLLECTION',
    image_url: '/banners/royal_banarasi_saree_banner.jpg',
    link_url: '/category/sarees',
  },
  {
    title: 'Festival Boutique Sale — Pure Silk & Organza Sarees',
    subtitle: 'Artisanal Drapes & Handwoven Border Collections',
    badge: 'LIMITED FESTIVAL OFFER',
    image_url: '/banners/organza_festive_saree_banner.jpg',
    link_url: '/category/sarees',
  },
];

export function AdminBannersSection() {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const emptyForm = {
    id: '',
    title: '',
    subtitle: '',
    badge: 'FESTIVE SALE',
    image_url: '/banners/festive_saree_sale_banner.jpg',
    link_url: '/category/sarees',
    status: 'Active' as 'Active' | 'Inactive',
    display_order: 1,
  };
  const [form, setForm] = useState(emptyForm);
  const [imageSourceTab, setImageSourceTab] = useState<'upload' | 'preset' | 'url'>('upload');

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await fetchAllBannersAdmin();
      setBanners(data);
      if (activePreviewIdx >= data.length && data.length > 0) {
        setActivePreviewIdx(0);
      }
    } catch (e: any) {
      toast.error('Failed to load banners: ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openAddModal = () => {
    setForm({
      ...emptyForm,
      display_order: banners.length + 1,
    });
    setImageSourceTab('upload');
    setIsModalOpen(true);
  };

  const openEditModal = (b: AdBanner) => {
    setForm({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || '',
      badge: b.badge || 'FESTIVE SALE',
      image_url: b.image_url,
      link_url: b.link_url || '/category/sarees',
      status: b.status,
      display_order: b.display_order,
    });
    setImageSourceTab('url');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WEBP)');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading banner image...');
    try {
      const url = await uploadBannerImage(file);
      setForm(prev => ({ ...prev, image_url: url }));
      toast.success('Banner image uploaded successfully!', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to upload image: ' + (err?.message || ''), { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a banner title');
      return;
    }
    if (!form.image_url.trim()) {
      toast.error('Please provide a banner image');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveBanner(form);
      toast.success(form.id ? 'Banner updated successfully!' : 'Banner added successfully!');
      setIsModalOpen(false);
      await loadBanners();
    } catch (err: any) {
      toast.error('Failed to save banner: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (banner: AdBanner) => {
    if (!window.confirm(`Are you sure you want to delete banner "${banner.title}"?`)) return;

    try {
      await deleteBanner(banner.id, { image_url: banner.image_url, title: banner.title });
      setBanners(prev => prev.filter(b => b.id !== banner.id && b.image_url !== banner.image_url));
      if (activePreviewIdx >= banners.length - 1) {
        setActivePreviewIdx(Math.max(0, banners.length - 2));
      }
      toast.success('Banner removed from admin and storefront');
    } catch (err: any) {
      toast.error('Failed to delete banner');
    }
  };

  const handleToggleStatus = async (banner: AdBanner) => {
    const nextStatus = banner.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await saveBanner({ ...banner, status: nextStatus });
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: nextStatus } : b));
      toast.success(`Banner set to ${nextStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const list = [...banners];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Reassign order
    const updated = list.map((b, i) => ({ ...b, display_order: i + 1 }));
    setBanners(updated);
    setLocalBanners(updated);

    try {
      await Promise.all(updated.map(b => saveBanner(b)));
      toast.success('Banner order updated');
    } catch (err) {
      toast.error('Failed to reorder banners');
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm('Restore default Myntra & Meesho style ad banners? Any custom banners will be replaced.')) return;
    try {
      const defs = await resetBannersToDefault();
      setBanners(defs);
      setActivePreviewIdx(0);
      toast.success('Default ad banners restored!');
    } catch (err) {
      toast.error('Failed to reset banners');
    }
  };

  const currentPreviewBanner = banners[activePreviewIdx] || banners[0] || DEFAULT_AD_BANNERS[0];

  return (
    <div className="space-y-8 pb-16">
      {/* ─── Top Header ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#698156]/10 text-[#698156] flex items-center justify-center">
              <ImageIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
                Hero Ad Banners
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Meesho & Myntra styled promotional banners. Upload photos, set store links, and publish instantly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleRestoreDefaults}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all active:scale-95"
            title="Reset to default banners"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#698156] hover:bg-[#5b724a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload New Banner</span>
          </button>
        </div>
      </div>

      {/* ─── Banner Size Specification Banner ─── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-[#698156]/10 border border-amber-200/70 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>Actual Banner Sizing & Design Guide</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Meesho & Myntra Standard
              </span>
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Follow these pixel dimensions so the model's head, jewellery, and discount texts never get cut off:
            </p>
            <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 font-semibold text-gray-800 shadow-2xs">
                💻 <strong>Desktop Banner:</strong> 1920 × 600 px <span className="text-gray-400 font-normal">(16:5 ratio, or 1920 × 504 px)</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 font-semibold text-gray-800 shadow-2xs">
                📱 <strong>Mobile Banner:</strong> 1080 × 600 px <span className="text-gray-400 font-normal">(16:9 ratio, or 1080 × 540 px)</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 font-semibold text-amber-900 shadow-2xs">
                🛡️ <strong>Safe Zone:</strong> Leave ~40px margin at the top so heads & titles aren't clipped
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Live Simulator Preview (Storefront View) ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Live Banner Simulator (Active Storefront View)
            </h2>
          </div>
          {banners.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">
                Slide {activePreviewIdx + 1} of {banners.length}
              </span>
              <button
                onClick={() => setActivePreviewIdx(prev => (prev - 1 + banners.length) % banners.length)}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <MoveLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivePreviewIdx(prev => (prev + 1) % banners.length)}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <MoveRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* The Live Banner Simulator Box */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-md aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7] lg:aspect-[16/6.5] max-h-[460px] bg-gray-900 border border-gray-200/80">
          <img
            src={currentPreviewBanner.image_url}
            alt={currentPreviewBanner.title}
            className="w-full h-full object-cover object-top"
          />

          {/* Banner Overlay Info */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              currentPreviewBanner.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'
            }`}>
              {currentPreviewBanner.status}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
              #{currentPreviewBanner.display_order} • {currentPreviewBanner.title}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-medium">
              Link: <span className="text-amber-300 font-bold">{currentPreviewBanner.link_url || '/category/sarees'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {banners.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activePreviewIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Current Banners Grid ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Storefront Banners ({banners.length})
          </h2>
          <p className="text-xs text-gray-400">
            Drag, toggle, or edit banner sequence below
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-gray-400 border border-gray-100 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-[#698156]" />
            <span>Loading banners...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-gray-400 border border-dashed border-gray-200 space-y-3">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-base font-bold text-gray-700">No ad banners active yet</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Upload promotional banners or click "Reset Defaults" to load festival templates.
            </p>
            <button
              onClick={handleRestoreDefaults}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#698156] text-white text-xs font-bold rounded-xl"
            >
              Restore Default Ad Banners
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner, idx) => (
              <motion.div
                key={banner.id || idx}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col ${
                  banner.status === 'Active' ? 'border-gray-200' : 'border-gray-200/60 opacity-60'
                }`}
              >
                {/* Banner Thumbnail */}
                <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden group">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Order & Status Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-black/70 backdrop-blur-sm text-white font-black text-xs flex items-center justify-center shadow-xs">
                      #{banner.display_order}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(banner)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs cursor-pointer transition-all ${
                        banner.status === 'Active' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-700 text-white hover:bg-gray-800'
                      }`}
                    >
                      {banner.status}
                    </button>
                  </div>

                  {/* Actions overlay on hover */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="w-8 h-8 rounded-xl bg-white/90 text-gray-700 hover:text-[#698156] hover:bg-white shadow-sm flex items-center justify-center transition-all"
                      title="Edit banner"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner)}
                      className="w-8 h-8 rounded-xl bg-white/90 text-red-500 hover:text-red-700 hover:bg-white shadow-sm flex items-center justify-center transition-all"
                      title="Delete banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif text-base font-bold text-gray-900 line-clamp-1">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                      <LinkIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate text-gray-600 font-mono text-[11px]">
                        {banner.link_url || '/category/sarees'}
                      </span>
                    </div>
                  </div>

                  {/* Move Left / Right Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMoveOrder(idx, 'left')}
                        disabled={idx === 0}
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <MoveLeft className="w-3.5 h-3.5" />
                        <span>Move Up</span>
                      </button>
                      <button
                        onClick={() => handleMoveOrder(idx, 'right')}
                        disabled={idx === banners.length - 1}
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <span>Move Down</span>
                        <MoveRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setActivePreviewIdx(idx);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-[#698156] hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Upload / Edit Banner Modal ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#698156]/10 text-[#698156] flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-gray-900">
                    {form.id ? 'Edit Hero Banner' : 'Upload New Hero Banner'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSave} className="p-6 space-y-6">
                {/* 1. Image Source Tabs */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Banner Graphic *
                  </label>

                  <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setImageSourceTab('upload')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        imageSourceTab === 'upload' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceTab('preset')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        imageSourceTab === 'preset' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      ✨ Presets (3)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSourceTab('url')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        imageSourceTab === 'url' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      🔗 Image URL
                    </button>
                  </div>

                  {/* Tab 1: Upload File */}
                  {imageSourceTab === 'upload' && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-[#698156] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-[#698156]/5"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                      />
                      <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-800">
                        {isUploading ? 'Uploading image...' : 'Click to upload banner image'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Recommended: <strong>1920 × 600 px</strong> (Desktop) / <strong>1080 × 600 px</strong> (Mobile) • High-res JPG, PNG, WEBP
                      </p>
                    </div>
                  )}

                  {/* Tab 2: Presets */}
                  {imageSourceTab === 'preset' && (
                    <div className="grid grid-cols-3 gap-3">
                      {PRESET_BANNERS.map((preset, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              image_url: preset.image_url,
                              title: prev.title || preset.title,
                              subtitle: prev.subtitle || preset.subtitle,
                              link_url: preset.link_url,
                            }));
                          }}
                          className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            form.image_url === preset.image_url ? 'border-[#698156] ring-2 ring-[#698156]/30' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img src={preset.image_url} alt={preset.title} className="w-full aspect-[16/9] object-cover" />
                          <div className="p-2 bg-white">
                            <p className="text-[10px] font-bold text-gray-800 truncate">{preset.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 3: Image URL input */}
                  {imageSourceTab === 'url' && (
                    <div className="space-y-1">
                      <input
                        type="url"
                        placeholder="https://example.com/banner-image.jpg or /banners/..."
                        value={form.image_url}
                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20 font-mono"
                      />
                    </div>
                  )}

                  {/* Selected Preview Box */}
                  {form.image_url && (
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] max-h-48 border border-gray-200 bg-gray-100">
                      <img
                        src={form.image_url}
                        alt="Selected Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                        Image Preview
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Banner Title & Subtitle */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Banner Headline *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mega Blockbuster Saree Sale — Up to 80% Off"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Subtitle / Tagline (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Handcrafted Silk, Banarasi & Kanchipuram Weaves"
                      value={form.subtitle}
                      onChange={e => setForm({ ...form, subtitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Destination Link *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /category/sarees"
                        value={form.link_url}
                        onChange={e => setForm({ ...form, link_url: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20"
                      >
                        <option value="Active">Active (Visible on Storefront)</option>
                        <option value="Inactive">Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="px-6 py-2.5 rounded-xl bg-[#698156] hover:bg-[#5b724a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{form.id ? 'Update Banner' : 'Publish Banner'}</span>
                      </>
                    )}
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
