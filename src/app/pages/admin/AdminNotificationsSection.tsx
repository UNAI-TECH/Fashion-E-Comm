import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, Plus, Trash2, Edit3, UploadCloud, Check, X,
  ExternalLink, RefreshCw, Eye, Tag, AlertCircle, ArrowRight
} from 'lucide-react';
import {
  OfferNotification,
  fetchOfferNotifications,
  saveOfferNotification,
  deleteOfferNotification,
  getLocalNotifications,
} from '../../data/notifications';
import { toast } from 'sonner';

const PRESET_IMAGES = [
  { label: 'Kanchi Cotton Saree', url: '/cat_kanchi_cotton.jpg' },
  { label: 'Viscose Saree', url: '/cat_viscose.jpg' },
  { label: 'Fancy Saree', url: '/cat_fancy.jpg' },
  { label: 'Checks Pedding Saree', url: '/cat_checks_pedding.jpg' },
  { label: 'Royal Maroon Saree', url: '/saree_royal_maroon.jpg' },
];

const TARGET_PRESETS = [
  { label: 'Kanchi Cotton Sarees (/kanchicotton)', link: '/kanchicotton', material: 'Kanchi Cotton' },
  { label: 'Viscose Sarees (/viscose)', link: '/viscose', material: 'Viscose Sarees' },
  { label: 'Fancy Sarees (/fancy-sarees)', link: '/fancy-sarees', material: 'Fancy Sarees' },
  { label: 'Checks Pedding Sarees (/checks-pedding)', link: '/checks-pedding', material: 'Checks Pedding' },
  { label: 'All Sarees Collection (/category/sarees)', link: '/category/sarees', material: 'Sarees' },
];

export function AdminNotificationsSection() {
  const [notifications, setNotifications] = useState<OfferNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    id: '',
    title: '',
    image_url: '/cat_kanchi_cotton.jpg',
    link_url: '/kanchicotton',
    material_category: 'Kanchi Cotton',
    time_ago: 'Just now',
    status: 'Active' as 'Active' | 'Inactive',
  };
  const [form, setForm] = useState(emptyForm);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchOfferNotifications();
      setNotifications(data);
    } catch (e: any) {
      toast.error('Failed to load notifications: ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const openAddModal = () => {
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (notif: OfferNotification) => {
    setForm({
      id: notif.id,
      title: notif.title,
      image_url: notif.image_url,
      link_url: notif.link_url,
      material_category: notif.material_category || 'Kanchi Cotton',
      time_ago: notif.time_ago || 'Recently',
      status: notif.status,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        setForm(prev => ({ ...prev, image_url: base64 }));
        toast.success('Offer image selected');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a notification title');
      return;
    }

    setIsSaving(true);
    try {
      await saveOfferNotification(form);
      toast.success('Latest Offer notification saved live!');
      setIsModalOpen(false);
      loadNotifications();
    } catch (err: any) {
      toast.error('Error saving notification: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete notification "${title}"?`)) return;
    try {
      await deleteOfferNotification(id);
      toast.success('Notification removed');
      loadNotifications();
    } catch (err: any) {
      toast.error('Failed to delete notification');
    }
  };

  const toggleStatus = async (notif: OfferNotification) => {
    const nextStatus = notif.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await saveOfferNotification({ ...notif, status: nextStatus });
      toast.success(`Notification set to ${nextStatus}`);
      loadNotifications();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0873F7]/10 text-[#0873F7] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <span>Latest Offers & Bell Notifications</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Upload offers displayed in the customer floating bell popup (Image 3 & 4) with direct redirects to saree material categories.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0873F7] hover:bg-[#0060D5] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Offer</span>
        </button>
      </div>

      {/* Grid of Notifications */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 text-[#0873F7] animate-spin" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="p-4 space-y-3">
                {/* Banner Thumbnail */}
                <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">
                  <img
                    src={notif.image_url}
                    alt={notif.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs ${
                      notif.status === 'Active'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    {notif.status}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <h3 className="font-bold text-sm text-gray-900 leading-snug">
                    {notif.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span className="font-medium">{notif.time_ago || 'Recently'}</span>
                    <span>•</span>
                    <span className="font-bold text-[#0873F7] bg-blue-50 px-2 py-0.5 rounded-md">
                      {notif.material_category || 'Saree Category'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 font-mono truncate">
                    Redirect: {notif.link_url}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleStatus(notif)}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    notif.status === 'Active'
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {notif.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(notif)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-[#0873F7] hover:bg-white transition-colors cursor-pointer"
                    title="Edit Offer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(notif.id, notif.title)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-700">No Offer Notifications Yet</h3>
          <p className="text-xs text-gray-400 mt-1">Click &apos;Add New Offer&apos; to publish latest deals to your storefront.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10"
            >
              <div className="bg-[#0873F7] text-white p-5 flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <span>{form.id ? 'Edit Offer Notification' : 'Create Offer Notification'}</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Offer Title (With Emojis) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Big Fashion Festival is LIVE 🔥"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0873F7]"
                  />
                </div>

                {/* Redirect Target / Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Saree Material Category / Redirect Target *
                  </label>
                  <select
                    value={form.link_url}
                    onChange={e => {
                      const selected = TARGET_PRESETS.find(p => p.link === e.target.value);
                      setForm(prev => ({
                        ...prev,
                        link_url: e.target.value,
                        material_category: selected?.material || prev.material_category,
                      }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0873F7] bg-white cursor-pointer"
                  >
                    {TARGET_PRESETS.map(p => (
                      <option key={p.link} value={p.link}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Link override */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Or Custom Redirect URL
                  </label>
                  <input
                    type="text"
                    placeholder="/kanchicotton or https://..."
                    value={form.link_url}
                    onChange={e => setForm(prev => ({ ...prev, link_url: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-[#0873F7]"
                  />
                </div>

                {/* Relative Time tag */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Display Time (e.g. Just now, 24 hrs ago)
                  </label>
                  <input
                    type="text"
                    value={form.time_ago}
                    onChange={e => setForm(prev => ({ ...prev, time_ago: e.target.value }))}
                    placeholder="Just now"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#0873F7]"
                  />
                </div>

                {/* Image Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Offer Thumbnail Image *
                  </label>
                  
                  {/* Preview */}
                  <div className="w-full h-28 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden mb-2 relative">
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Preset quick selection */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, image_url: img.url }))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          form.image_url === img.url
                            ? 'bg-[#0873F7] text-white border-[#0873F7]'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>

                  {/* Upload button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 border border-dashed border-gray-300 hover:border-[#0873F7] rounded-xl text-xs font-bold text-gray-600 hover:text-[#0873F7] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Custom Image</span>
                  </button>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="text-xs font-bold text-gray-700">Status:</label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={form.status === 'Active'}
                      onChange={() => setForm(prev => ({ ...prev, status: 'Active' }))}
                      className="text-[#0873F7] focus:ring-[#0873F7]"
                    />
                    <span>Active</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={form.status === 'Inactive'}
                      onChange={() => setForm(prev => ({ ...prev, status: 'Inactive' }))}
                      className="text-[#0873F7] focus:ring-[#0873F7]"
                    />
                    <span>Inactive</span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 rounded-xl bg-[#0873F7] hover:bg-[#0060D5] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Offer'}
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
