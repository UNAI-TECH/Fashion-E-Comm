import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon, Plus, Trash2, Edit3, MoveLeft, MoveRight,
  UploadCloud, Check, X, Eye, Link as LinkIcon, Award, RefreshCw, AlertCircle
} from 'lucide-react';
import {
  AdBanner,
  fetchAllBannersAdmin,
  saveBanner,
  deleteBanner,
  uploadBannerImage,
  setLocalBanners
} from '../../data/banners';
import { toast } from 'sonner';

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
    badge: 'NEW ARRIVAL',
    image_url: '',
    link_url: '/category/sarees',
    status: 'Active' as 'Active' | 'Inactive',
    display_order: 1,
  };
  const [form, setForm] = useState(emptyForm);
  const [imageSourceTab, setImageSourceTab] = useState<'upload' | 'url'>('upload');

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
      badge: b.badge || '',
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
    const toastId = toast.loading('Uploading banner image to storage...');
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
      toast.error('Please upload or enter a banner image URL');
      return;
    }

    setIsSaving(true);
    try {
      await saveBanner(form);
      toast.success(form.id ? 'Banner updated successfully!' : 'Banner published successfully!');
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
      toast.success('Banner deleted permanently');
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
      toast.success('Banner sequence updated');
    } catch (err) {
      toast.error('Failed to reorder banners');
    }
  };

  const currentPreviewBanner = banners[activePreviewIdx] || banners[0] || null;

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
                Upload custom promotional banners for the storefront hero carousel. Only manually uploaded banners appear.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#698156] hover:bg-[#5b724a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload New Banner</span>
          </button>
        </div>
      </div>

      {/* ─── Banner Sizing Guide ─── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-[#698156]/10 border border-amber-200/70 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>Banner Sizing & Dimensions</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Recommended Standard
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 font-semibold text-gray-800 shadow-2xs">
                💻 <strong>Desktop:</strong> 1920 × 600 px (16:5 ratio)
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 font-semibold text-gray-800 shadow-2xs">
                📱 <strong>Mobile:</strong> 1080 × 600 px (16:9 ratio)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Live Simulator Preview ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${currentPreviewBanner ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Live Banner Simulator (Storefront View)
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
        {currentPreviewBanner ? (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-md aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7] lg:aspect-[16/6.5] max-h-[460px] bg-gray-900 border border-gray-200/80">
            <img
              src={currentPreviewBanner.image_url}
              alt={currentPreviewBanner.title}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
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
        ) : (
          <div className="w-full py-16 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50">
            <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-700">No Hero Banners Currently Active</h3>
            <p className="text-xs text-gray-500 max-w-md mt-1 mb-4">
              The storefront hero banner slider is currently empty. Upload your first custom banner below to publish it.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-[#698156] text-white text-xs font-bold rounded-xl hover:bg-[#546944] transition-all"
            >
              + Upload Banner
            </button>
          </div>
        )}
      </div>

      {/* ─── Storefront Banners List ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-gray-900">
              Uploaded Storefront Banners ({banners.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Drag, toggle, or edit banner sequence below
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Banner</span>
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="py-12 text-center text-gray-400 border border-gray-100 rounded-2xl bg-gray-50/30">
            <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">No banners in catalogue</p>
            <p className="text-xs text-gray-400 mt-0.5">All default banners have been removed. Click &ldquo;Upload New Banner&rdquo; to add one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner, index) => (
              <div
                key={banner.id || index}
                className={`group rounded-2xl overflow-hidden border transition-all ${
                  banner.status === 'Active'
                    ? 'border-gray-200 bg-white shadow-xs hover:shadow-md'
                    : 'border-gray-200 bg-gray-50/60 opacity-75'
                }`}
              >
                {/* Banner Thumbnail */}
                <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/70 text-white backdrop-blur-sm">
                      #{banner.display_order}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(banner)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        banner.status === 'Active'
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-rose-500 text-white hover:bg-rose-600'
                      }`}
                    >
                      {banner.status}
                    </button>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm flex items-center justify-center transition-all"
                      title="Edit banner"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner)}
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-rose-50 text-rose-600 shadow-sm flex items-center justify-center transition-all"
                      title="Delete banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Banner Meta Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-serif font-bold text-sm text-gray-900 truncate">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs text-gray-500 truncate">{banner.subtitle}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-1">
                    <LinkIcon className="w-3 h-3" />
                    <span className="truncate">{banner.link_url || '/category/sarees'}</span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(index, 'left')}
                        disabled={index === 0}
                        className="px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        ← Move Up
                      </button>
                      <button
                        onClick={() => handleMoveOrder(index, 'right')}
                        disabled={index === banners.length - 1}
                        className="px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Move Down →
                      </button>
                    </div>

                    <button
                      onClick={() => setActivePreviewIdx(index)}
                      className="text-[#698156] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#698156]/10 text-[#698156] flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-gray-900">
                    {form.id ? 'Edit Hero Banner' : 'Upload New Hero Banner'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* 1. Image Upload Section */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Banner Photo *
                  </label>

                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
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
                        {isUploading ? 'Uploading image...' : 'Click to select image from computer'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        High-res JPG, PNG, WEBP • Recommended: 1920 × 600 px
                      </p>
                    </div>
                  )}

                  {/* Tab 2: Image URL input */}
                  {imageSourceTab === 'url' && (
                    <div className="space-y-1">
                      <input
                        type="url"
                        placeholder="https://your-domain.com/banner.jpg"
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
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
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
                      placeholder="e.g. Exclusive Festive Silk Saree Collection"
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
                      placeholder="e.g. Handcrafted pure zari borders and silk weaves"
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
