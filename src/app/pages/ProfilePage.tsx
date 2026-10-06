import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Package,
  Heart,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Camera,
  Edit2,
  Plus,
  Trash2,
  LogOut,
  ShieldCheck,
  Search,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Phone,
  Mail,
  Home as HomeIcon,
  Briefcase,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { AuthModal } from '../components/AuthModal';
import {
  getUserProfileDetails,
  saveUserProfileDetails,
  getUserProfileImage,
  UserProfileDetails
} from '../../lib/userProfile';

interface SavedAddressItem {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  type?: 'Home' | 'Work' | 'Other';
  is_default: boolean;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
];

export function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isLoading: authLoading, updateProfile, signOut } = useCustomerAuth();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const activeTab = searchParams.get('tab') || 'profile';
  const selectedOrderIdParam = searchParams.get('orderId') || '';

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Profile details state
  const [profileForm, setProfileForm] = useState<UserProfileDetails>(getUserProfileDetails());
  const [avatarImage, setAvatarImage] = useState<string>(getUserProfileImage());
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Track order state
  const [trackSearchId, setTrackSearchId] = useState(selectedOrderIdParam);
  const [activeTrackOrder, setActiveTrackOrder] = useState<any | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<SavedAddressItem[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<{
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: 'Home' | 'Work' | 'Other';
    is_default: boolean;
  }>({
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: 'Maharashtra',
    postal_code: '',
    country: 'India',
    type: 'Home',
    is_default: true,
  });

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Sync profile details when user / profile changes
  useEffect(() => {
    const stored = getUserProfileDetails();
    const meta = (user?.user_metadata || {}) as any;
    setProfileForm({
      name: stored.name || profile?.full_name || meta.full_name || meta.name || '',
      phone: stored.phone || profile?.phone || meta.phone || '',
      gender: stored.gender || profile?.gender || meta.gender || 'Female',
      email: stored.email || profile?.email || user?.email || '',
      address: stored.address || '',
      city: stored.city || '',
      pincode: stored.pincode || '',
      state: stored.state || '',
    });
    setAvatarImage(getUserProfileImage());
  }, [user, profile]);

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    if (!user?.id) return;
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Exception fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  // Sync active track order if orderId param changes or orders arrive
  useEffect(() => {
    if (orders.length > 0) {
      if (trackSearchId) {
        const found = orders.find(
          (o) =>
            o.id === trackSearchId ||
            (o.id && o.id.toLowerCase().includes(trackSearchId.toLowerCase())) ||
            (o.order_number && o.order_number.toLowerCase().includes(trackSearchId.toLowerCase()))
        );
        if (found) {
          setActiveTrackOrder(found);
          return;
        }
      }
      // Default to latest order if none specified
      if (!activeTrackOrder) {
        setActiveTrackOrder(orders[0]);
      }
    }
  }, [orders, trackSearchId]);

  // Fetch saved addresses from Supabase & localStorage fallback
  const fetchAddresses = async () => {
    if (!user?.id) return;
    setAddressesLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setAddresses(data);
      } else {
        // Fallback to local storage if addresses table empty
        const local = localStorage.getItem('user_saved_addresses');
        if (local) {
          try {
            setAddresses(JSON.parse(local));
          } catch {
            setAddresses([]);
          }
        } else {
          // Create initial address from profile details if available
          const prof = getUserProfileDetails();
          if (prof.address) {
            const initialAddr: SavedAddressItem = {
              id: 'default-local-1',
              full_name: prof.name || profile?.full_name || 'Customer',
              phone: prof.phone || profile?.phone || '',
              address_line_1: prof.address,
              city: prof.city || 'Mumbai',
              state: prof.state || 'Maharashtra',
              postal_code: prof.pincode || '400001',
              country: 'India',
              type: 'Home',
              is_default: true,
            };
            setAddresses([initialAddr]);
            localStorage.setItem('user_saved_addresses', JSON.stringify([initialAddr]));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
    }
  }, [user?.id]);

  // Handle avatar image selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Image size must be under 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarImage(result);
        localStorage.setItem('user_profile_image', result);
        toast.success('Avatar selected! Click "Save Changes" to apply.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle saving profile details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    const cleanPhone = profileForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSavingProfile(true);
    try {
      // 1. Save to local storage & broadcast
      saveUserProfileDetails(profileForm, avatarImage);

      // 2. Save to Supabase profiles
      if (user?.id) {
        await updateProfile({
          full_name: profileForm.name.trim(),
          phone: cleanPhone,
          gender: profileForm.gender,
          avatar_url: avatarImage || undefined,
        });
      }

      toast.success('Profile details saved successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle address form submit (Add or Edit)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.full_name.trim()) {
      toast.error('Please enter recipient full name');
      return;
    }
    const cleanPhone = addressForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!addressForm.address_line_1.trim()) {
      toast.error('Please enter building/house details');
      return;
    }
    if (!addressForm.city.trim()) {
      toast.error('Please enter city');
      return;
    }
    if (!addressForm.postal_code.trim() || addressForm.postal_code.trim().length < 6) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }

    try {
      if (editingAddressId) {
        // Update in Supabase
        if (user?.id) {
          await supabase
            .from('addresses')
            .update({
              full_name: addressForm.full_name,
              phone: cleanPhone,
              address_line_1: addressForm.address_line_1,
              address_line_2: addressForm.address_line_2,
              city: addressForm.city,
              state: addressForm.state,
              postal_code: addressForm.postal_code,
              country: addressForm.country,
              is_default: addressForm.is_default,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingAddressId);
        }

        // Update local list
        setAddresses((prev) =>
          prev.map((addr) =>
            addr.id === editingAddressId
              ? {
                  ...addr,
                  ...addressForm,
                  phone: cleanPhone,
                }
              : addressForm.is_default
              ? { ...addr, is_default: false }
              : addr
          )
        );
        toast.success('Address updated successfully!');
      } else {
        // Add new address
        const newId = `addr_${Date.now()}`;
        const newAddressObj: SavedAddressItem = {
          id: newId,
          full_name: addressForm.full_name,
          phone: cleanPhone,
          address_line_1: addressForm.address_line_1,
          address_line_2: addressForm.address_line_2,
          city: addressForm.city,
          state: addressForm.state,
          postal_code: addressForm.postal_code,
          country: addressForm.country,
          type: addressForm.type,
          is_default: addresses.length === 0 ? true : addressForm.is_default,
        };

        if (user?.id) {
          const { data, error } = await supabase.from('addresses').insert([
            {
              user_id: user.id,
              full_name: addressForm.full_name,
              phone: cleanPhone,
              address_line_1: addressForm.address_line_1,
              address_line_2: addressForm.address_line_2,
              city: addressForm.city,
              state: addressForm.state,
              postal_code: addressForm.postal_code,
              country: addressForm.country,
              is_default: addressForm.is_default,
            },
          ]).select();

          if (data && data[0]) {
            newAddressObj.id = data[0].id;
          }
        }

        setAddresses((prev) => {
          const updated = addressForm.is_default
            ? [newAddressObj, ...prev.map((a) => ({ ...a, is_default: false }))]
            : [...prev, newAddressObj];
          localStorage.setItem('user_saved_addresses', JSON.stringify(updated));
          return updated;
        });

        // Also update primary userProfile details
        if (addressForm.is_default || addresses.length === 0) {
          saveUserProfileDetails({
            ...profileForm,
            address: `${addressForm.address_line_1}${addressForm.address_line_2 ? ', ' + addressForm.address_line_2 : ''}`,
            city: addressForm.city,
            state: addressForm.state,
            pincode: addressForm.postal_code,
          });
        }

        toast.success('New delivery address added!');
      }

      setIsAddressModalOpen(false);
      setEditingAddressId(null);
    } catch (err: any) {
      console.error('Error saving address:', err);
      toast.error('Failed to save address.');
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (id: string) => {
    try {
      if (user?.id) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
        await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      }
      setAddresses((prev) => {
        const updated = prev.map((a) => ({ ...a, is_default: a.id === id }));
        localStorage.setItem('user_saved_addresses', JSON.stringify(updated));
        return updated;
      });
      toast.success('Default address updated!');
    } catch (err) {
      toast.error('Could not update default address');
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: string) => {
    if (confirm('Are you sure you want to remove this address?')) {
      try {
        if (user?.id) {
          await supabase.from('addresses').delete().eq('id', id);
        }
        setAddresses((prev) => {
          const updated = prev.filter((a) => a.id !== id);
          localStorage.setItem('user_saved_addresses', JSON.stringify(updated));
          return updated;
        });
        toast.success('Address removed.');
      } catch (err) {
        toast.error('Failed to remove address.');
      }
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter by status
      if (orderStatusFilter !== 'All') {
        const st = (order.order_status || order.status || '').toLowerCase();
        if (orderStatusFilter === 'Processing' && !['placed', 'order placed', 'confirmed', 'packed', 'pending'].includes(st)) {
          return false;
        }
        if (orderStatusFilter === 'Shipped' && !['shipped', 'out for delivery'].includes(st)) {
          return false;
        }
        if (orderStatusFilter === 'Delivered' && st !== 'delivered') {
          return false;
        }
        if (orderStatusFilter === 'Cancelled' && !['cancelled', 'returned', 'refunded'].includes(st)) {
          return false;
        }
      }

      // Filter by search query
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const idMatch = (order.id || '').toLowerCase().includes(q) || (order.order_number || '').toLowerCase().includes(q);
        const itemMatch = (order.order_items || []).some((item: any) =>
          (item.products?.name || item.product_name || '').toLowerCase().includes(q)
        );
        return idMatch || itemMatch;
      }

      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Order tracking status step index helper
  const getTrackingStepIndex = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 5;
    if (s.includes('out for delivery')) return 4;
    if (s.includes('shipped')) return 3;
    if (s.includes('packed')) return 2;
    if (s.includes('confirmed')) return 1;
    return 0; // Placed
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
        </span>
      );
    }
    if (s.includes('shipped') || s.includes('out for delivery')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> {status}
        </span>
      );
    }
    if (s.includes('cancelled') || s.includes('returned')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" /> {status || 'Processing'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col selection:bg-[#698156]/20">
      <AnnouncementBar />
      <Navigation />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-8 pb-20">
        
        {/* Unauthenticated State */}
        {!authLoading && !isAuthenticated && (
          <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#F4F6F2] flex items-center justify-center mb-6 border border-[#698156]/20 shadow-inner">
              <User className="w-10 h-10 text-[#698156]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
              Sign In to Your Account
            </h1>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              Access your order tracking, purchase history, saved wishlist styles, and delivery addresses in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#698156] hover:bg-[#586e47] text-white font-bold rounded-2xl shadow-lg shadow-[#698156]/20 transition-all cursor-pointer text-sm"
              >
                Sign In / Register
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-2xl transition-all text-sm text-center"
              >
                Return to Shop
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated State */}
        {isAuthenticated && (
          <div className="space-y-8">
            {/* Top Welcome / Profile Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#FAFBF8] to-[#F4F6F2] border border-[#698156]/15 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                {/* User Info */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="relative group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#698156]/30 shadow-md bg-white flex items-center justify-center">
                      {avatarImage ? (
                        <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#698156] to-[#88a570] text-white flex items-center justify-center text-3xl font-serif font-bold">
                          {(profileForm.name || profile?.full_name || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="hero-avatar-upload"
                      className="absolute bottom-0 right-0 p-2 bg-[#698156] hover:bg-[#586e47] text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
                      title="Update Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        id="hero-avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-3xl font-serif font-bold text-gray-900">
                        {profileForm.name || profile?.full_name || 'Valued Customer'}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                        Verified Member
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-gray-600 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {profile?.email || user?.email}
                      </span>
                      {profileForm.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          +91 {profileForm.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats Badges */}
                <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 md:pb-0">
                  <div
                    onClick={() => setActiveTab('orders')}
                    className="flex-1 md:flex-initial px-4 py-3 bg-white/80 backdrop-blur-xs border border-gray-200/80 rounded-2xl cursor-pointer hover:border-[#698156]/40 transition-all shadow-xs min-w-[95px] text-center"
                  >
                    <p className="text-xs text-gray-500 font-medium">Orders</p>
                    <p className="text-lg font-bold text-gray-900">{orders.length}</p>
                  </div>
                  <div
                    onClick={() => setActiveTab('wishlist')}
                    className="flex-1 md:flex-initial px-4 py-3 bg-white/80 backdrop-blur-xs border border-gray-200/80 rounded-2xl cursor-pointer hover:border-[#698156]/40 transition-all shadow-xs min-w-[95px] text-center"
                  >
                    <p className="text-xs text-gray-500 font-medium">Wishlist</p>
                    <p className="text-lg font-bold text-[#698156]">{wishlistItems.length}</p>
                  </div>
                  <div
                    onClick={() => setActiveTab('addresses')}
                    className="flex-1 md:flex-initial px-4 py-3 bg-white/80 backdrop-blur-xs border border-gray-200/80 rounded-2xl cursor-pointer hover:border-[#698156]/40 transition-all shadow-xs min-w-[95px] text-center"
                  >
                    <p className="text-xs text-gray-500 font-medium">Addresses</p>
                    <p className="text-lg font-bold text-gray-900">{addresses.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center justify-between border-b border-gray-200 overflow-x-auto scrollbar-none gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                {[
                  { id: 'profile', label: 'Profile Details', icon: User },
                  { id: 'track', label: 'Track Order', icon: Truck },
                  { id: 'orders', label: 'Order History', icon: Package },
                  { id: 'wishlist', label: 'Saved Wishlist', icon: Heart, count: wishlistItems.length },
                  { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-t-xl ${
                        isActive
                          ? 'border-[#698156] text-[#698156] bg-white'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#698156]' : 'text-gray-400'}`} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#698156]/15 text-[#698156]">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sign Out Shortcut */}
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to sign out?')) {
                    await signOut();
                    navigate('/');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-6">

              {/* TAB 1: PROFILE DETAILS */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                        Personal Information
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Manage your profile details, contact information, and shipping preferences.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                      User ID: {user?.id.slice(0, 8)}...
                    </span>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Avatar Upload Center */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-6 p-4 rounded-2xl bg-[#FDFBF7] border border-gray-100">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#698156]/40 shadow-sm bg-white flex items-center justify-center">
                          {avatarImage ? (
                            <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                        <label
                          htmlFor="profile-tab-avatar"
                          className="absolute -bottom-1 -right-1 p-2 bg-[#698156] hover:bg-[#586e47] text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
                        >
                          <Camera className="w-4 h-4" />
                          <input
                            id="profile-tab-avatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </label>
                      </div>
                      <div className="text-center sm:text-left space-y-1">
                        <p className="text-sm font-bold text-gray-900">Profile Photo</p>
                        <p className="text-xs text-gray-500">
                          Recommended format: JPG, PNG or WEBP (max 3MB).
                        </p>
                        {avatarImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarImage('');
                              localStorage.removeItem('user_profile_image');
                              toast.info('Photo removed.');
                            }}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline pt-1"
                          >
                            Remove current photo
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="e.g. Priya Sharma"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#698156] focus:ring-2 focus:ring-[#698156]/20 transition-all bg-white"
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Mobile Phone <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                            }
                            placeholder="9876543210"
                            className="w-full pl-14 pr-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#698156] focus:ring-2 focus:ring-[#698156]/20 transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* Email (Readonly verified) */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            readOnly
                            disabled
                            value={profileForm.email || user?.email || ''}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium bg-gray-50/80 text-gray-500 cursor-not-allowed"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Gender
                        </label>
                        <select
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#698156] focus:ring-2 focus:ring-[#698156]/20 transition-all bg-white"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    {/* Primary Shipping Address Shortcut */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Primary Shipping Address
                        </label>
                        <button
                          type="button"
                          onClick={() => setActiveTab('addresses')}
                          className="text-xs font-bold text-[#698156] hover:underline"
                        >
                          Manage Saved Addresses →
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        placeholder="House / Flat No., Landmark, Street, Locality..."
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-[#698156] focus:ring-2 focus:ring-[#698156]/20 transition-all bg-white"
                      />
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full sm:w-auto px-8 py-3.5 bg-[#698156] hover:bg-[#586e47] text-white font-bold rounded-2xl shadow-lg shadow-[#698156]/20 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      >
                        {isSavingProfile ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                          </>
                        ) : (
                          'Save Profile Details'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* TAB 2: TRACK ORDER */}
              {activeTab === 'track' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 max-w-4xl mx-auto"
                >
                  {/* Track Search Box */}
                  <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-2">
                      Live Order Tracking
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mb-6">
                      Enter your Order ID or tracking AWB number to check real-time dispatch and delivery status.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={trackSearchId}
                          onChange={(e) => setTrackSearchId(e.target.value)}
                          placeholder="e.g. AF-84920 or Order UUID..."
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#698156] focus:ring-2 focus:ring-[#698156]/20 transition-all"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!trackSearchId.trim()) {
                            toast.error('Please enter an Order ID');
                            return;
                          }
                          const found = orders.find(
                            (o) =>
                              o.id === trackSearchId.trim() ||
                              (o.id && o.id.toLowerCase().includes(trackSearchId.toLowerCase())) ||
                              (o.order_number && o.order_number.toLowerCase().includes(trackSearchId.toLowerCase()))
                          );
                          if (found) {
                            setActiveTrackOrder(found);
                            toast.success('Order found!');
                          } else {
                            toast.error('Order not found. Please verify the ID.');
                          }
                        }}
                        className="px-8 py-3.5 bg-[#698156] hover:bg-[#586e47] text-white font-bold rounded-2xl text-sm shadow-md shadow-[#698156]/20 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Track Shipment
                      </button>
                    </div>

                    {/* Quick Pick Recent Orders */}
                    {orders.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 overflow-x-auto text-xs">
                        <span className="text-gray-500 font-medium whitespace-nowrap">Recent Orders:</span>
                        {orders.slice(0, 4).map((o) => (
                          <button
                            key={o.id}
                            onClick={() => {
                              setActiveTrackOrder(o);
                              setTrackSearchId(o.id.slice(0, 8));
                            }}
                            className={`px-3 py-1 rounded-full border transition-all whitespace-nowrap font-medium ${
                              activeTrackOrder?.id === o.id
                                ? 'bg-[#698156] text-white border-[#698156]'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#698156]'
                            }`}
                          >
                            Order #{o.order_number || o.id.slice(0, 8)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Tracked Order Display */}
                  {activeTrackOrder ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm space-y-8">
                      {/* Tracking Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-bold font-serif text-gray-900">
                              Order #{activeTrackOrder.order_number || activeTrackOrder.id.slice(0, 8).toUpperCase()}
                            </h3>
                            {renderStatusBadge(activeTrackOrder.order_status || activeTrackOrder.status || 'Confirmed')}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Placed on{' '}
                            {new Date(activeTrackOrder.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const trackingId = activeTrackOrder.tracking_number || `AWB-${activeTrackOrder.id.slice(0, 10).toUpperCase()}`;
                              navigator.clipboard.writeText(trackingId);
                              setCopiedTracking(true);
                              toast.success('Tracking ID copied to clipboard!');
                              setTimeout(() => setCopiedTracking(false), 2000);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors"
                          >
                            {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                            <span>AWB: {activeTrackOrder.tracking_number || activeTrackOrder.id.slice(0, 8).toUpperCase()}</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Progress Stepper */}
                      <div className="py-4">
                        <div className="relative">
                          {/* Progress Line Background */}
                          <div className="absolute top-4 sm:top-5 left-4 right-4 h-1 bg-gray-100 z-0">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-700"
                              style={{
                                width: `${(getTrackingStepIndex(activeTrackOrder.order_status || activeTrackOrder.status) / 5) * 100}%`,
                              }}
                            />
                          </div>

                          {/* 6 Steps */}
                          <div className="relative z-10 flex justify-between">
                            {[
                              { label: 'Order Placed', desc: 'Received' },
                              { label: 'Confirmed', desc: 'Verified' },
                              { label: 'Packed', desc: 'QC Passed' },
                              { label: 'Shipped', desc: 'In Transit' },
                              { label: 'Out for Delivery', desc: 'Arriving Today' },
                              { label: 'Delivered', desc: 'Complete' },
                            ].map((step, idx) => {
                              const currentStep = getTrackingStepIndex(activeTrackOrder.order_status || activeTrackOrder.status);
                              const isCompleted = currentStep >= idx;
                              const isCurrent = currentStep === idx;

                              return (
                                <div key={step.label} className="flex flex-col items-center text-center max-w-[80px]">
                                  <div
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                      isCompleted
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                        : 'bg-white border-2 border-gray-200 text-gray-400'
                                    } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                                  >
                                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                                  </div>
                                  <p
                                    className={`text-[10px] sm:text-xs font-bold mt-2 leading-tight ${
                                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                                    }`}
                                  >
                                    {step.label}
                                  </p>
                                  <p className="text-[9px] text-gray-400 hidden sm:block mt-0.5">{step.desc}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Details Recap Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#FDFBF7] border border-gray-100 text-xs">
                        <div>
                          <p className="text-gray-500 font-semibold mb-1">Estimated Delivery</p>
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#698156]" />
                            {activeTrackOrder.estimated_delivery
                              ? new Date(activeTrackOrder.estimated_delivery).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Within 3 - 5 Business Days'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold mb-1">Courier Partner</p>
                          <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-[#698156]" />
                            {activeTrackOrder.courier_name || 'BlueDart Express / Delhivery'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold mb-1">Shipping Destination</p>
                          <p className="text-xs font-bold text-gray-900 line-clamp-2">
                            {typeof activeTrackOrder.shipping_address === 'string'
                              ? activeTrackOrder.shipping_address
                              : activeTrackOrder.shipping_address?.address ||
                                `${activeTrackOrder.shipping_address?.city || ''}, ${activeTrackOrder.shipping_address?.postal_code || ''}` ||
                                profileForm.address ||
                                'Registered Address'}
                          </p>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                          Package Contents ({activeTrackOrder.order_items?.length || 1} item
                          {(activeTrackOrder.order_items?.length || 1) > 1 ? 's' : ''})
                        </h4>
                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                          {(activeTrackOrder.order_items || []).map((item: any, i: number) => {
                            const prod = item.products || {};
                            const img =
                              (prod.images && prod.images[0]) || prod.image_url || prod.image || '/logo.png';
                            return (
                              <div key={i} className="p-4 flex items-center gap-4 bg-white">
                                <img
                                  src={img}
                                  alt={prod.name || item.product_name}
                                  className="w-16 h-20 object-cover rounded-xl border border-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-bold text-gray-900 truncate">
                                    {prod.name || item.product_name || 'Traditional Handcrafted Piece'}
                                  </h5>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Qty: {item.quantity || 1} {item.size ? `• Size: ${item.size}` : ''}
                                  </p>
                                  <p className="text-xs font-bold text-[#698156] mt-1">
                                    ₹{Number(item.price || activeTrackOrder.total_amount).toLocaleString('en-IN')}
                                  </p>
                                </div>
                                <Link
                                  to={prod.id ? `/product/${prod.id}` : '/'}
                                  className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-[#698156] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                  View Item
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                      <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-800">No active shipment selected</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Once you place an order with Aanya Fashions, real-time GPS courier tracking and dispatch timestamps will appear here.
                      </p>
                      <Link
                        to="/"
                        className="inline-block mt-4 px-6 py-2.5 bg-[#698156] text-white text-xs font-bold rounded-xl"
                      >
                        Explore Collections
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: ORDER HISTORY */}
              {activeTab === 'orders' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 max-w-5xl mx-auto"
                >
                  {/* Filters & Search */}
                  <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Status Pill Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            orderStatusFilter === st
                              ? 'bg-[#698156] text-white shadow-xs'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative min-w-[220px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search by Product or ID..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#698156]"
                      />
                    </div>
                  </div>

                  {/* Orders List */}
                  {ordersLoading ? (
                    <div className="py-20 text-center">
                      <RefreshCw className="w-8 h-8 text-[#698156] animate-spin mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-600">Loading your orders...</p>
                    </div>
                  ) : filteredOrders.length > 0 ? (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => {
                        const items = order.order_items || [];
                        const firstItem = items[0] || {};
                        const prod = firstItem.products || {};
                        const img =
                          (prod.images && prod.images[0]) || prod.image_url || prod.image || '/logo.png';

                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7 hover:border-[#698156]/30 transition-all space-y-6"
                          >
                            {/* Order Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#F4F6F2] flex items-center justify-center text-[#698156]">
                                  <Package className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm sm:text-base font-bold text-gray-900">
                                      Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                                    </h4>
                                    {renderStatusBadge(order.order_status || order.status || 'Confirmed')}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Placed on{' '}
                                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-right">
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-gray-400">Total Amount</p>
                                  <p className="text-base font-bold text-gray-900">
                                    ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="divide-y divide-gray-50">
                              {items.map((item: any, idx: number) => {
                                const itemProd = item.products || {};
                                const itemImg =
                                  (itemProd.images && itemProd.images[0]) ||
                                  itemProd.image_url ||
                                  itemProd.image ||
                                  img;
                                return (
                                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                                    <img
                                      src={itemImg}
                                      alt={itemProd.name || item.product_name}
                                      className="w-16 h-20 object-cover rounded-xl border border-gray-100"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-bold text-gray-900 truncate">
                                        {itemProd.name || item.product_name || 'Ethnic Wear Item'}
                                      </h5>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        Qty: {item.quantity || 1} {item.size ? `• Size: ${item.size}` : ''}
                                      </p>
                                      <p className="text-xs font-bold text-gray-800 mt-1">
                                        ₹{Number(item.price || order.total_amount).toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        addToCart(itemProd.id ? itemProd : { id: item.product_id, name: item.product_name, price: item.price, image: itemImg }, 1);
                                        toast.success('Item added to cart!');
                                      }}
                                      className="px-4 py-2 bg-gray-50 hover:bg-[#698156] text-gray-700 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-200 hover:border-transparent whitespace-nowrap"
                                    >
                                      Buy Again
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Order Actions Footer */}
                            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                Destination:{' '}
                                <span className="font-semibold text-gray-800">
                                  {typeof order.shipping_address === 'string'
                                    ? order.shipping_address
                                    : order.shipping_address?.city || 'Default Shipping'}
                                </span>
                              </p>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setActiveTrackOrder(order);
                                    setActiveTab('track');
                                    setTrackSearchId(order.id.slice(0, 8));
                                  }}
                                  className="px-5 py-2.5 bg-[#698156] hover:bg-[#586e47] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" /> Track Order
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                      <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h4 className="text-base font-serif font-bold text-gray-800">No orders found</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        You have not placed any orders matching your criteria yet. Explore our latest bridal and party wear collection!
                      </p>
                      <Link
                        to="/"
                        className="inline-block mt-4 px-6 py-2.5 bg-[#698156] text-white text-xs font-bold rounded-xl"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 4: SAVED WISHLIST */}
              {activeTab === 'wishlist' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                        Saved Wishlist
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later.
                      </p>
                    </div>
                    {wishlistItems.length > 0 && (
                      <Link
                        to="/sarees"
                        className="text-xs font-bold text-[#698156] hover:underline"
                      >
                        Explore More Styles →
                      </Link>
                    )}
                  </div>

                  {wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                      {wishlistItems.map((item) => {
                        const img =
                          (item.images && item.images[0]) || item.image || item.image_url || '/logo.png';
                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-[#698156]/30 transition-all"
                          >
                            {/* Product Image */}
                            <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                              <Link to={`/product/${item.id}`} className="block w-full h-full">
                                <img
                                  src={img}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </Link>
                              <button
                                onClick={() => {
                                  removeFromWishlist(item.id);
                                  toast.info('Item removed from wishlist.');
                                }}
                                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-500 hover:bg-rose-50 shadow-sm transition-all"
                                title="Remove from wishlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Product Details */}
                            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  {item.category || 'Ethnic Wear'}
                                </p>
                                <Link to={`/product/${item.id}`}>
                                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate hover:text-[#698156] transition-colors mt-0.5">
                                    {item.name}
                                  </h4>
                                </Link>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-sm font-bold text-gray-900">
                                    ₹{Number(item.price || 0).toLocaleString('en-IN')}
                                  </span>
                                  {item.original_price && item.original_price > item.price && (
                                    <span className="text-xs text-gray-400 line-through">
                                      ₹{Number(item.original_price).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  addToCart(item, 1);
                                  toast.success(`${item.name} added to cart!`);
                                }}
                                className="mt-3 w-full py-2 bg-[#698156] hover:bg-[#586e47] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm max-w-md mx-auto">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h4 className="text-base font-serif font-bold text-gray-800">
                        Your wishlist is currently empty
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Save traditional sarees, designer kurtis, and wedding lehengas you love by tapping the heart icon.
                      </p>
                      <Link
                        to="/sarees"
                        className="inline-block mt-5 px-6 py-2.5 bg-[#698156] text-white text-xs font-bold rounded-xl shadow-md"
                      >
                        Explore Sarees & Kurtis
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 5: DELIVERY ADDRESSES */}
              {activeTab === 'addresses' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 max-w-4xl mx-auto"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                        Delivery Addresses
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Manage your saved delivery destinations for seamless 1-click checkout.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm({
                          full_name: profileForm.name || profile?.full_name || '',
                          phone: profileForm.phone || profile?.phone || '',
                          address_line_1: '',
                          address_line_2: '',
                          city: profileForm.city || '',
                          state: profileForm.state || 'Maharashtra',
                          postal_code: profileForm.pincode || '',
                          country: 'India',
                          type: 'Home',
                          is_default: addresses.length === 0,
                        });
                        setIsAddressModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-[#698156] hover:bg-[#586e47] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#698156]/20 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Add New Address
                    </button>
                  </div>

                  {addressesLoading ? (
                    <div className="py-20 text-center">
                      <RefreshCw className="w-8 h-8 text-[#698156] animate-spin mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-600">Loading addresses...</p>
                    </div>
                  ) : addresses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-sm relative ${
                            addr.is_default
                              ? 'border-[#698156] ring-2 ring-[#698156]/15'
                              : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div>
                            {/* Badges */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                                {addr.type === 'Work' ? <Briefcase className="w-3 h-3" /> : <HomeIcon className="w-3 h-3" />}
                                {addr.type || 'Home'}
                              </span>

                              {addr.is_default && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-3 h-3 stroke-[3]" /> Default Address
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-gray-900">{addr.full_name}</h4>
                            <p className="text-xs font-semibold text-gray-600 mt-1 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400" /> +91 {addr.phone}
                            </p>

                            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                              {addr.address_line_1}
                              {addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                              <br />
                              {addr.city}, {addr.state} -{' '}
                              <strong className="text-gray-900 font-bold">{addr.postal_code}</strong>
                              <br />
                              {addr.country || 'India'}
                            </p>
                          </div>

                          {/* Address Action Bar */}
                          <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between gap-2">
                            <div>
                              {!addr.is_default && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-xs font-bold text-[#698156] hover:underline"
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAddressId(addr.id);
                                  setAddressForm({
                                    full_name: addr.full_name,
                                    phone: addr.phone,
                                    address_line_1: addr.address_line_1,
                                    address_line_2: addr.address_line_2 || '',
                                    city: addr.city,
                                    state: addr.state,
                                    postal_code: addr.postal_code,
                                    country: addr.country || 'India',
                                    type: addr.type || 'Home',
                                    is_default: addr.is_default,
                                  });
                                  setIsAddressModalOpen(true);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                                title="Edit address"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Delete address"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h4 className="text-base font-serif font-bold text-gray-800">No saved addresses yet</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Add a delivery address to ensure fast dispatch and accurate delivery tracking for your orders.
                      </p>
                      <button
                        onClick={() => setIsAddressModalOpen(true)}
                        className="mt-4 px-6 py-2.5 bg-[#698156] text-white text-xs font-bold rounded-xl"
                      >
                        Add Your First Address
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ADD / EDIT ADDRESS MODAL */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <h3 className="text-lg font-serif font-bold text-gray-900">
                  {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                </h3>
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Recipient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.full_name}
                      onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#698156]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                        })
                      }
                      placeholder="10-digit number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#698156]"
                    />
                  </div>
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Flat / House No. / Building / Apartment <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.address_line_1}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                    placeholder="e.g. Flat 402, Rose Villa, MG Road"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#698156]"
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Street / Colony / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.address_line_2}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                    placeholder="e.g. Near City Center Mall"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#698156]"
                  />
                </div>

                {/* City, State, PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#698156]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#698156] bg-white"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      PIN Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={addressForm.postal_code}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          postal_code: e.target.value.replace(/\D/g, '').slice(0, 6),
                        })
                      }
                      placeholder="400001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#698156]"
                    />
                  </div>
                </div>

                {/* Type & Default */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 mr-2">Address Type:</span>
                    {(['Home', 'Work', 'Other'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAddressForm({ ...addressForm, type: t })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          addressForm.type === t
                            ? 'bg-[#698156] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                      className="w-4 h-4 rounded text-[#698156] focus:ring-[#698156]"
                    />
                    <span className="text-xs font-semibold text-gray-700">Set as default</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#698156] hover:bg-[#586e47] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {editingAddressId ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal for Unauthenticated Users */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView="signin"
      />

      <Footer />
    </div>
  );
}
export default ProfilePage;
