import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IndianRupee, ShoppingBag, Users, Package, ArrowUpRight,
  Plus, Trash2, Search, Store, X, RefreshCw, ChevronRight,
  Phone, Mail, MapPin, ImageIcon, LayoutDashboard,
  ClipboardList, Menu, ChevronLeft, CreditCard, LogOut,
  Sparkles, Shirt, Upload, Star, Receipt,
  Minus, ShoppingCart, ArrowRight, Tags, Boxes
} from 'lucide-react';
import { AdminHeroModelsSection } from './AdminHeroModelsSection';
import { AdminBillingSection } from './AdminBillingSection';
import { AdminCategories } from './AdminCategories';
import { AdminInventorySection } from './AdminInventorySection';
import { saveHeroModel } from '../../data/heroModels';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { fetchProducts, markProductDeleted, getDeletedProductIds, ensureProductImages, buildComplementaryAngles } from '../../data/products';
import { toast } from 'sonner';

/* ─── Types ─── */
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    id: string; name: string; images?: string[]; image_url?: string;
  };
}

interface ShippingAddress {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  customer_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  [key: string]: any;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address?: ShippingAddress;
  customer_name?: string;
  user_name?: string;
  name?: string;
  created_at: string;
  order_items?: OrderItem[];
  [key: string]: any;
}

interface Payment {
  id: string; order_id: string; user_id: string;
  method: string; status: string; amount: number; created_at: string;
}

interface DbProduct {
  id: string; name: string; category: string;
  price: number; compare_at_price?: number;
  images: string[]; image_url?: string;
  description?: string; status: string; created_at?: string;
  stock_quantity?: number;
  sku?: string;
  low_stock_threshold?: number;
  [key: string]: any;
}

interface AdminCartItem {
  product: DbProduct;
  quantity: number;
}

interface DerivedUser {
  id: string; email: string; name: string;
  phone: string; city: string; state: string;
  orderCount: number; created_at: string;
}

/* ─── Category colours ─── */
const CAT_COLORS: Record<string, string> = {
  Sarees: '#698156', Kurtis: '#849E70', Lehengas: '#546944',
  'Salwar Sets': '#047857', Western: '#7C3AED', Maxi: '#c2410c',
};

/* ─── Nav items ─── */
export type NavTab = 'overview' | 'hero-models' | 'products' | 'inventory' | 'categories' | 'billing' | 'orders' | 'customers' | 'payments';
export const VALID_TABS: readonly NavTab[] = [
  'overview', 'hero-models', 'products', 'inventory', 'categories', 'billing', 'orders', 'customers', 'payments'
] as const;
export const isValidTab = (tab: any): tab is NavTab => VALID_TABS.includes(tab);

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Dashboard',        icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'hero-models', label: 'Hero Models',      icon: <Sparkles className="w-5 h-5" /> },
  { id: 'products',    label: 'Catalog Products', icon: <Package className="w-5 h-5" /> },
  { id: 'inventory',   label: 'Inventory Stock',  icon: <Boxes className="w-5 h-5" /> },
  { id: 'categories',  label: 'Categories',       icon: <Tags className="w-5 h-5" /> },
  { id: 'billing',     label: 'Manual Billing / POS', icon: <Receipt className="w-5 h-5" /> },
  { id: 'orders',      label: 'Orders',            icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'customers',   label: 'Customers',         icon: <Users className="w-5 h-5" /> },
  { id: 'payments',    label: 'Payments',          icon: <CreditCard className="w-5 h-5" /> },
];

/* ─── Customer name extraction helper ─── */
function getFormattedCustomerName(addr: ShippingAddress = {}, order: Partial<Order> = {}): string {
  let name = (
    `${addr.first_name || addr.firstName || ''} ${addr.last_name || addr.lastName || ''}`.trim() ||
    addr.full_name || addr.fullName || addr.name || addr.customer_name ||
    order.customer_name || order.user_name || order.name || ''
  ).trim();

  if (!name || name.toLowerCase() === 'customer') {
    try {
      const saved = localStorage.getItem('user_profile_details');
      if (saved) {
        const prof = JSON.parse(saved);
        if (prof.name) name = prof.name;
      }
    } catch (e) {}
  }

  if (!name || name.toLowerCase() === 'customer') {
    if (addr.email && addr.email !== '—') {
      const emailUser = addr.email.split('@')[0];
      const parts = emailUser.split(/[\._-]/).filter(Boolean);
      name = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    } else if (addr.phone && addr.phone !== '—') {
      name = `User (${addr.phone})`;
    } else if (order.user_id || order.id) {
      name = `User #${String(order.user_id || order.id).slice(0, 6)}`;
    } else {
      name = 'App User';
    }
  }

  return name;
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export function AdminAanyaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Helper to resolve initial active tab from URL query param, path, localStorage, or fallback to 'overview'
  const getInitialTab = (): NavTab => {
    // 1. Query parameter (?tab=...)
    const queryTab = searchParams.get('tab') as NavTab;
    if (queryTab && isValidTab(queryTab)) {
      return queryTab;
    }

    // 2. URL path suffix (/admin/hero-models, /admin/billing, /admin/products, etc.)
    const path = location.pathname.toLowerCase().replace(/\/+$/, '');
    if (path.endsWith('/hero-models')) return 'hero-models';
    if (path.endsWith('/products')) return 'products';
    if (path.endsWith('/inventory')) return 'inventory';
    if (path.endsWith('/categories')) return 'categories';
    if (path.endsWith('/billing') || path.endsWith('/pos')) return 'billing';
    if (path.endsWith('/orders')) return 'orders';
    if (path.endsWith('/customers')) return 'customers';
    if (path.endsWith('/payments')) return 'payments';
    if (path.endsWith('/dashboard') || path.endsWith('/overview')) return 'overview';

    // 3. Saved localStorage state so reloading always lands back on the exact same page
    try {
      const savedTab = localStorage.getItem('admin_active_tab') as NavTab;
      if (savedTab && isValidTab(savedTab)) {
        return savedTab;
      }
    } catch (e) {}

    return 'overview';
  };

  const [activeTab, setActiveTabState] = useState<NavTab>(getInitialTab);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  // Synchronize tab changes: updates React state, saves to localStorage, and updates URL query param ?tab=...
  const setActiveTab = useCallback((newTab: NavTab) => {
    setActiveTabState(newTab);
    try {
      localStorage.setItem('admin_active_tab', newTab);
    } catch (e) {}
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Ensure URL reflects current activeTab immediately on mount
  useEffect(() => {
    const queryTab = searchParams.get('tab');
    if (!queryTab || queryTab !== activeTab) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('tab', activeTab);
        return next;
      }, { replace: true });
    }
  }, []);

  // Listen to browser Back/Forward or direct URL query changes
  useEffect(() => {
    const queryTab = searchParams.get('tab') as NavTab;
    if (queryTab && isValidTab(queryTab) && queryTab !== activeTab) {
      setActiveTabState(queryTab);
      try {
        localStorage.setItem('admin_active_tab', queryTab);
      } catch (e) {}
    }
  }, [searchParams, activeTab]);

  /* ── Data state ── */
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [customers, setCustomers]   = useState<DerivedUser[]>([]);

  /* ── UI ── */
  const [isLoading, setIsLoading]       = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [adding, setAdding]             = useState(false);
  const [imgPreview, setImgPreview]     = useState('');
  const [selectedCust, setSelectedCust] = useState<DerivedUser | null>(null);
  const [productToDelete, setProductToDelete] = useState<DbProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [featureOnHero, setFeatureOnHero] = useState(false);
  const [billingInitialProduct, setBillingInitialProduct] = useState<DbProduct | null>(null);
  const [billingInitialProducts, setBillingInitialProducts] = useState<any[] | null>(() => {
    try {
      const saved = sessionStorage.getItem('admin_billing_initial_products');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [adminCart, setAdminCart] = useState<AdminCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('admin_pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);

  // Auto-persist adminCart across reloads
  useEffect(() => {
    try {
      localStorage.setItem('admin_pos_cart', JSON.stringify(adminCart));
    } catch (e) {}
  }, [adminCart]);

  /* ── Admin Catalog Multi-Buy Cart & Checkout Helpers ── */
  const getProductCartQty = useCallback((productId: string) => {
    const item = adminCart.find(i => String(i.product.id) === String(productId));
    return item ? item.quantity : 0;
  }, [adminCart]);

  const handleAddToCart = useCallback((product: DbProduct) => {
    setAdminCart(prev => {
      const idx = prev.findIndex(i => String(i.product.id) === String(product.id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCheckoutDrawerOpen(true);
    toast.success(`"${product.name}" added to cart`);
  }, []);

  const handleDecrementCart = useCallback((productId: string) => {
    setAdminCart(prev => {
      const idx = prev.findIndex(i => String(i.product.id) === String(productId));
      if (idx < 0) return prev;
      if (prev[idx].quantity <= 1) {
        return prev.filter(i => String(i.product.id) !== String(productId));
      }
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: next[idx].quantity - 1 };
      return next;
    });
  }, []);

  const handleRemoveFromCart = useCallback((productId: string) => {
    setAdminCart(prev => prev.filter(i => String(i.product.id) !== String(productId)));
  }, []);

  const handleClearCart = useCallback(() => {
    setAdminCart([]);
    toast.info('Catalog selection cleared');
  }, []);

  const handleQuickBuyNow = useCallback((product: DbProduct) => {
    setAdminCart(prev => {
      const idx = prev.findIndex(i => String(i.product.id) === String(product.id));
      if (idx >= 0) {
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCheckoutDrawerOpen(true);
  }, []);

  const handleProceedToPOSBilling = useCallback(() => {
    if (adminCart.length === 0) {
      toast.error('No products selected. Please add products to cart first.');
      return;
    }

    const itemsForBilling = adminCart.map(item => ({
      ...item.product,
      quantity: item.quantity,
    }));

    try {
      sessionStorage.setItem('admin_billing_initial_products', JSON.stringify(itemsForBilling));
    } catch (e) {}
    setBillingInitialProducts(itemsForBilling);
    setIsCheckoutDrawerOpen(false);
    setActiveTab('billing');
    toast.success(`${itemsForBilling.length} product(s) transferred to POS Billing invoice!`);
  }, [adminCart, setActiveTab]);

  const cartTotalCount = adminCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = adminCart.reduce((sum, item) => sum + (Number(item.product.price) || 0) * item.quantity, 0);

  /* ── Form ── */
  const emptyForm = { 
    name: '', 
    category: 'Sarees', 
    price: '', 
    compare_at_price: '', 
    stock_quantity: 25,
    image_url: '', 
    images: [] as string[],
    description: '', 
    status: 'Published' 
  };
  const [form, setForm] = useState(emptyForm);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  /* ─── Load Supabase data using service-role client (bypasses RLS) ─── */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use supabaseAdmin (service role) to bypass RLS policies
      const [prodsRes, ordersRes, paymentsRes] = await Promise.all([
        supabaseAdmin.from('products').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('orders').select('*, order_items(*, products(*))').order('created_at', { ascending: false }),
        supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false }),
      ]);

      // Log & toast detailed errors for each table
      if (prodsRes.error) {
        console.error('[Admin] Products error:', prodsRes.error);
        toast.error('Products: ' + prodsRes.error.message);
      }
      if (ordersRes.error) {
        console.error('[Admin] Orders error:', ordersRes.error);
        toast.error('Orders: ' + ordersRes.error.message);
      }
      if (paymentsRes.error) {
        console.error('[Admin] Payments error:', paymentsRes.error);
        toast.error('Payments: ' + paymentsRes.error.message);
      }

      // --- Products: merge Supabase DB products + local mock catalog ---
      const dbProdsRaw = prodsRes.data || [];
      let mockProds: any[] = [];
      try {
        mockProds = await fetchProducts();
      } catch (e) {
        console.warn('fetchProducts fallback error:', e);
      }
      // Normalize mock products to match DbProduct shape
      const normalizedMock = mockProds.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        compare_at_price: p.compare_at_price || p.originalPrice || null,
        images: p.images || (p.image ? [p.image] : []),
        image_url: p.image || null,
        description: p.description || null,
        status: p.status || 'Published',
        created_at: null,
      }));
      // Merge: Supabase DB first (override mocks with same id)
      const deletedSet = getDeletedProductIds();
      const allProdsMap = new Map<string, DbProduct>();
      normalizedMock.forEach((p: any) => allProdsMap.set(p.id, p));
      dbProdsRaw.forEach((p: any) => allProdsMap.set(p.id, p));

      const activeProducts = Array.from(allProdsMap.values()).filter(p => 
        !deletedSet.has(String(p.id).toLowerCase()) && 
        !deletedSet.has((p.name || '').trim().toLowerCase())
      );
      setDbProducts(activeProducts);

      // --- Orders ---
      const ordersData: Order[] = ordersRes.data || [];
      // Also check localStorage for any locally cached orders
      let localOrders: any[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
      } catch (e) {}
      const allOrdersMap = new Map<string, Order>();
      localOrders.forEach((o: any) => allOrdersMap.set(o.id, o));
      ordersData.forEach((o: any) => allOrdersMap.set(o.id, o));
      const allOrders = Array.from(allOrdersMap.values());
      setOrders(allOrders);

      // --- Payments ---
      setPayments(paymentsRes.data || []);


      const customerMap = new Map<string, DerivedUser>();
      allOrders.forEach((o: Order) => {
        const addr = o.shipping_address || {};
        const key = o.user_id || addr.phone || addr.email || o.id;
        const custName = getFormattedCustomerName(addr, o);
        const email = addr.email || '—';
        const phone = addr.phone || '—';
        const city = addr.city || '—';
        const state = addr.state || '—';

        if (customerMap.has(key)) {
          const existing = customerMap.get(key)!;
          existing.orderCount += 1;
          if (existing.name.startsWith('User (') || existing.name.startsWith('User #') || existing.name === 'App User') {
            if (custName && !custName.startsWith('User (') && !custName.startsWith('User #')) {
              existing.name = custName;
            }
          }
          if (existing.email === '—' && email !== '—') existing.email = email;
          if (existing.phone === '—' && phone !== '—') existing.phone = phone;
          if (existing.city === '—' && city !== '—') existing.city = city;
          if (existing.state === '—' && state !== '—') existing.state = state;
        } else {
          customerMap.set(key, {
            id: key,
            email,
            name: custName,
            phone,
            city,
            state,
            orderCount: 1,
            created_at: o.created_at,
          });
        }
      });
      setCustomers(Array.from(customerMap.values()));

      console.log('[Admin] Loaded:', {
        products: allProdsMap.size,
        orders: allOrders.length,
        payments: (paymentsRes.data || []).length,
        customers: customerMap.size,
      });

    } catch (err: any) {
      console.error('[Admin] loadData crash:', err);
      toast.error('Dashboard load failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ─── Update order status → Supabase ─── */
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabaseAdmin.from('orders').update({ status }).eq('id', id);
    if (error) { toast.error('Update failed: ' + error.message); return; }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast.success(`Order status → ${status}`);
  };

  /* ─── Keyboard listener for modals (Escape key closes modals) ─── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (productToDelete && !isDeleting) setProductToDelete(null);
        if (isAddOpen && !adding) setIsAddOpen(false);
        if (selectedCust) setSelectedCust(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productToDelete, isDeleting, isAddOpen, adding, selectedCust]);

  /* ─── Sync real-time deletions across tabs ─── */
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('products_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PRODUCT_DELETED') {
          const { id, name } = event.data;
          setDbProducts(prev => prev.filter(p => 
            String(p.id).toLowerCase() !== String(id).toLowerCase() && 
            (!name || p.name.trim().toLowerCase() !== name.trim().toLowerCase())
          ));
        }
      };
    } catch (e) {}

    return () => {
      if (bc) bc.close();
    };
  }, []);

  /* ─── Delete product → Supabase ─── */
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const id = productToDelete.id;
    const prodName = productToDelete.name;
    setIsDeleting(true);

    try {
      const { error: err1 } = await supabaseAdmin.from('products').delete().eq('id', id);
      if (err1) console.warn('Supabase product delete by id notice:', err1);
      if (prodName) {
        const { error: err2 } = await supabaseAdmin.from('products').delete().eq('name', prodName);
        if (err2) console.warn('Supabase product delete by name notice:', err2);
      }
    } catch (e) {
      console.warn('Supabase product delete error:', e);
    }

    // Persist deleted product ID/name in storage & broadcast to all open windows/tabs instantly
    markProductDeleted(id, prodName);

    // Update in-page state
    setDbProducts(prev => prev.filter(p => 
      String(p.id).toLowerCase() !== String(id).toLowerCase() && 
      (!prodName || p.name.trim().toLowerCase() !== prodName.trim().toLowerCase())
    ));
    toast.success(`"${prodName}" removed from store`);
    setIsDeleting(false);
    setProductToDelete(null);
  };

  /* ─── Image management for Add Product ─── */
  const handleAddImageUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error('Please enter an image URL');
      return;
    }
    setForm(prev => {
      const nextImages = [...(prev.images || []), trimmed];
      return {
        ...prev,
        images: nextImages,
        image_url: nextImages[0] || ''
      };
    });
    setUrlInput('');
    toast.success('Photo added to gallery');
  };

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
          const filePath = `${form.category.toLowerCase()}/${fileName}`;
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
        setForm(prev => {
          const nextImages = [...(prev.images || []), ...newUrls];
          return {
            ...prev,
            images: nextImages,
            image_url: nextImages[0] || ''
          };
        });
        toast.success(`Uploaded ${newUrls.length} ${newUrls.length === 1 ? 'image' : 'images'} successfully!`);
      }
    } catch (err) {
      toast.error('Failed to process image upload');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm(prev => {
      const nextImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: nextImages,
        image_url: nextImages[0] || ''
      };
    });
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return;
    setForm(prev => {
      const target = prev.images[index];
      const rest = prev.images.filter((_, i) => i !== index);
      const nextImages = [target, ...rest];
      return {
        ...prev,
        images: nextImages,
        image_url: nextImages[0] || ''
      };
    });
    toast.success('Set as primary storefront image');
  };

  const handleAutofillAngles = () => {
    const primary = form.images[0] || form.image_url.trim() || (form.category === 'Sarees' ? '/saree_s1.jpg' : '/kurti_k1.jpg');
    const angles = buildComplementaryAngles(primary, form.category, form.name);
    const existing = form.images.length > 0 ? form.images : (form.image_url.trim() ? [form.image_url.trim()] : [primary]);
    const combined = Array.from(new Set([...existing, ...angles]));
    setForm(prev => ({
      ...prev,
      images: combined,
      image_url: combined[0] || ''
    }));
    toast.success(`Auto-added ${angles.length} complementary fashion angles!`);
  };

  /* ─── Add product → Supabase & Local Storefront ─── */
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }

    // Gather all images (either uploaded to form.images, or typed into form.image_url)
    let imagesList = [...(form.images || [])];
    if (form.image_url.trim() && !imagesList.includes(form.image_url.trim())) {
      imagesList.unshift(form.image_url.trim());
    }

    if (imagesList.length === 0) {
      imagesList = [form.category === 'Sarees' ? '/saree_s1.jpg' : '/kurti_k1.jpg'];
    }

    // Guarantee full angle set for product page & catalog
    const guaranteedImages = ensureProductImages({
      id: 'temp',
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      images: imagesList,
      image: imagesList[0],
      rating: 5,
      status: form.status,
      colors: []
    });

    const primaryImg = guaranteedImages[0];

    setAdding(true);
    try {
      const productPayload = {
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        stock_quantity: Number(form.stock_quantity) || 25,
        image_url: primaryImg,
        images: guaranteedImages,
        image: primaryImg,
        description: form.description.trim() || null,
        status: form.status,
      };

      let createdProduct: any = null;
      try {
        const { data, error } = await supabaseAdmin.from('products').insert(productPayload).select().single();
        if (!error && data) {
          createdProduct = data;
        } else if (error) {
          console.warn('Supabase DB product insert notice:', error);
        }
      } catch (dbErr) {
        console.warn('Supabase product insert notice:', dbErr);
      }

      if (!createdProduct) {
        createdProduct = {
          id: 'prod_' + Date.now(),
          ...productPayload,
          created_at: new Date().toISOString()
        };
      }

      // Sync to local_admin_products cache for instant storefront availability
      try {
        const raw = localStorage.getItem('local_admin_products');
        const existing = raw ? JSON.parse(raw) : [];
        const updated = [createdProduct, ...existing.filter((p: any) => p.id !== createdProduct.id && p.name !== createdProduct.name)];
        localStorage.setItem('local_admin_products', JSON.stringify(updated));
      } catch (e) {}

      setDbProducts(prev => [createdProduct, ...prev.filter(p => p.id !== createdProduct.id)]);
      window.dispatchEvent(new Event('products_updated'));
      window.dispatchEvent(new Event('storage'));

      // If requested, also feature this newly inserted product on the homepage hero model
      if (featureOnHero) {
        try {
          await saveHeroModel({
            label: createdProduct.name,
            subtitle: `Discover Trending ${createdProduct.category}`,
            color: CAT_COLORS[createdProduct.category] || '#698156',
            src: createdProduct.image_url || primaryImg || '/model_1.png',
            productId: createdProduct.id,
            productName: createdProduct.name,
            price: createdProduct.price,
            link: `/product/${createdProduct.id}`,
            status: 'Active',
            display_order: 1,
          });
          toast.success(`'${createdProduct.name}' featured on homepage model!`);
        } catch (heroErr) {
          console.warn('Hero model auto-link notice:', heroErr);
        }
      }

      toast.success(`'${createdProduct.name}' published to store with ${guaranteedImages.length} images!`);
      setIsAddOpen(false); 
      setImgPreview(''); 
      setUrlInput('');
      setForm(emptyForm); 
      setFeatureOnHero(false);
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    } finally { setAdding(false); }
  };

  /* ─── Derived metrics ─── */
  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0)
    || orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  /* Weekly revenue from real order dates */
  const weeklyData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]));
    orders.forEach(o => { const d = days[new Date(o.created_at).getDay()]; map[d] += (o.total_amount || 0); });
    return days.map(d => ({ day: d, revenue: map[d] }));
  })();

  /* Category split from real products */
  const catData = (() => {
    const map: Record<string, number> = {};
    dbProducts.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
    const total = dbProducts.length || 1;
    return Object.entries(map).map(([name, count]) => ({
      name, value: Math.round((count / total) * 100), color: CAT_COLORS[name] || '#aaa',
    }));
  })();

  /* Monthly revenue (last 6 months) from orders */
  const monthlyData = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const m = months[new Date(o.created_at).getMonth()];
      map[m] = (map[m] || 0) + (o.total_amount || 0);
    });
    return months.filter(m => map[m] > 0).map(m => ({ month: m, revenue: map[m] }));
  })();

  /* Status badge */
  const badge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'shipped':    return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'cancelled':  return 'bg-[#F4F6F2] text-[#698156] border border-[#DCE4D7]';
      case 'completed':  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:           return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  /* Product image */
  const prodImg = (p: DbProduct) =>
    (p.images && p.images.length > 0 ? p.images[0] : null) || p.image_url || '';

  /* Filtered products */
  const filtered = dbProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen bg-[#F7F5F0] overflow-hidden font-sans">

      {/* ═══ LEFT SIDEBAR ═══ */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full z-30 overflow-hidden shadow-sm"
      >
        {/* Logo area with collapse toggle button right near the logo */}
        <div className={`flex items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-1 flex-col gap-1.5'} py-4 border-b border-gray-100 min-h-[88px]`}>
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center justify-center focus:outline-none group cursor-pointer"
            title="Go to Admin Dashboard"
          >
            <img
              src="/logo.png"
              alt="Aanya Fashions"
              className={`${sidebarOpen ? 'h-13 max-h-13' : 'h-8 max-h-8'} w-auto object-contain flex-shrink-0 group-hover:scale-105 transition-all`}
            />
          </button>

          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-1.5 rounded-lg border border-gray-200/80 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all cursor-pointer shadow-xs flex-shrink-0"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-5 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#698156]/15 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-[#F4F6F2]'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-[#698156]' : ''}`}>{item.icon}</span>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-sm font-bold whitespace-nowrap overflow-hidden">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && sidebarOpen && (
                  <div className="ml-auto w-2 h-2 bg-[#698156] rounded-full flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 pb-6 space-y-1 border-t border-gray-100 pt-4">
          <Link to="/"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-[#F4F6F2] transition-all"
            title={!sidebarOpen ? 'Storefront' : undefined}
          >
            <Store className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-bold">View Store</span>}
          </Link>

          <button
            onClick={() => {
              if (window.confirm('Sign out from Admin Portal?')) {
                logout();
                navigate('/login');
                toast.success('Signed out successfully');
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-[#F4F6F2] transition-all cursor-pointer"
            title={!sidebarOpen ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className={`bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-4 flex items-center justify-between flex-shrink-0 transition-all duration-300 ${isCheckoutDrawerOpen ? 'lg:mr-[380px]' : ''}`}>
          <div>
            <h1 className="font-serif text-xl font-bold text-gray-900 capitalize">
              {activeTab === 'overview' ? 'Dashboard Overview' :
               activeTab === 'hero-models' ? 'Hero Models & Outfits' :
               activeTab === 'products' ? 'Catalog Products' :
               activeTab === 'inventory' ? 'Inventory Stock Management' :
               activeTab === 'categories' ? 'Categories Management' :
               activeTab === 'billing' ? 'Manual Billing & POS' :
               activeTab === 'orders' ? 'Customer Orders' :
               activeTab === 'customers' ? 'Customer Directory' : 'Payment Records'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Live data from Supabase · Last synced {new Date().toLocaleTimeString('en-IN')}</p>
          </div>

          <div className="flex items-center gap-3">
            {cartTotalCount > 0 && (
              <button
                type="button"
                onClick={() => setIsCheckoutDrawerOpen(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-[#F4F6F2] border border-[#DCE4D7] text-[#546944] hover:bg-[#698156]/15 rounded-full text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title="Toggle checkout sidebar"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#698156]" />
                <span>{isCheckoutDrawerOpen ? 'Close Cart' : `Cart (${cartTotalCount})`}</span>
              </button>
            )}
            <button onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2 bg-[#698156] hover:bg-[#546944] text-white rounded-full text-xs font-bold shadow-md transition-all cursor-pointer">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </header>

        {/* Scrollable page body */}
        <main className={`flex-1 overflow-y-auto p-6 space-y-6 transition-all duration-300 ${isCheckoutDrawerOpen ? 'lg:mr-[380px]' : ''}`}>

          {/* ─── TAB: OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <IndianRupee className="w-5 h-5" />, color: 'text-[#698156]', bg: 'bg-amber-50', sub: `${payments.length} payment records` },
                  { label: 'Total Orders', value: `${orders.length}`, icon: <ShoppingBag className="w-5 h-5" />, color: 'text-[#698156]', bg: 'bg-[#F4F6F2]', sub: `${orders.filter(o => o.status === 'Delivered').length} delivered` },
                  { label: 'Products', value: `${dbProducts.length}`, icon: <Package className="w-5 h-5" />, color: 'text-blue-700', bg: 'bg-blue-50', sub: `${dbProducts.filter(p => p.status === 'Published').length} published` },
                  { label: 'Customers', value: `${customers.length}`, icon: <Users className="w-5 h-5" />, color: 'text-emerald-700', bg: 'bg-emerald-50', sub: 'from order records' },
                ].map(({ label, value, icon, color, bg, sub }) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">{label}</div>
                    <div className="text-2xl font-serif font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-400 mt-1">{sub}</div>
                  </motion.div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Weekly Revenue Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-serif text-base font-bold text-gray-900">Weekly Revenue</h3>
                      <p className="text-xs text-gray-400">Live from orders table</p>
                    </div>
                    <span className="text-xs font-bold text-[#698156] bg-[#F4F6F2] px-3 py-1 rounded-full">INR ₹</span>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#698156" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#698156" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={11} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#698156" strokeWidth={2.5}
                          fillOpacity={1} fill="url(#revGrad)" dot={{ r: 3, fill: '#698156', strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Pie */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-serif text-base font-bold text-gray-900">Category Split</h3>
                    <p className="text-xs text-gray-400">Based on {dbProducts.length} catalog products</p>
                  </div>
                  {catData.length > 0 ? (
                    <>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={catData} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                              paddingAngle={3} dataKey="value">
                              {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: any) => `${v}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-1.5">
                        {catData.map(c => (
                          <div key={c.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="text-gray-600 truncate">{c.name} <span className="text-gray-400">({c.value}%)</span></span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">No products yet</div>
                  )}
                </div>
              </div>

              {/* Monthly Bar Chart */}
              {monthlyData.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-serif text-base font-bold text-gray-900">Monthly Revenue Breakdown</h3>
                      <p className="text-xs text-gray-400">Aggregated from all orders in Supabase</p>
                    </div>
                  </div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} stroke="#9CA3AF" fontSize={11} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                          formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#698156" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent 5 orders */}
              {orders.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-base font-bold text-gray-900">Recent Orders</h3>
                    <button onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#698156] hover:underline flex items-center gap-1">
                      All Orders <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="text-xs uppercase font-bold text-gray-400 tracking-wider bg-gray-50">
                        <tr>
                          <th className="p-3 text-left">Order</th>
                          <th className="p-3 text-left">Customer</th>
                          <th className="p-3 text-left">Amount</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.slice(0, 5).map(o => {
                          const addr = o.shipping_address || {};
                          const name = getFormattedCustomerName(addr, o);
                          return (
                            <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="p-3 font-mono text-xs font-bold text-gray-800">#{String(o.id).slice(0, 8)}</td>
                              <td className="p-3 font-medium">{name}</td>
                              <td className="p-3 font-bold text-[#698156]">₹{(o.total_amount || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge(o.status)}`}>{o.status || 'Pending'}</span></td>
                              <td className="p-3 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {orders.length === 0 && !isLoading && (
                <EmptyCard icon={<ShoppingBag />} title="No orders yet" sub="Orders placed in the store will appear here from Supabase." />
              )}
            </div>
          )}

          {/* ─── TAB: PRODUCTS ─── */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input type="text" placeholder="Search products…"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 transition-all shadow-2xs" />
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyCard icon={<Package />} title="No products" sub="Add your first product — it will be saved to Supabase and appear in your store immediately." />
              ) : (
                /*  ── Clean, Non-overlapping Responsive Product Grid ── */
                <div className={`grid gap-4 ${
                  isCheckoutDrawerOpen
                    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                }`}>
                  {filtered.map(product => {
                    const img = prodImg(product);
                    const qtyInCart = getProductCartQty(product.id);
                    return (
                      <motion.div key={product.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden group flex flex-col justify-between">
                        {/* Compact clean image */}
                        <div className="relative overflow-hidden bg-gray-50 h-44 sm:h-48 w-full">
                          {img ? (
                            <img src={img} alt={product.name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                          {/* Status badge */}
                          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs ${
                            product.status === 'Published' ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
                            {product.status || 'Draft'}
                          </div>
                          {/* Stock quantity badge */}
                          <div className={`absolute top-2 right-9 px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs ${
                            (product.stock_quantity ?? 25) === 0
                              ? 'bg-rose-600 text-white'
                              : (product.stock_quantity ?? 25) <= 10
                              ? 'bg-amber-600 text-white'
                              : 'bg-black/60 text-white backdrop-blur-xs'
                          }`}>
                            {(product.stock_quantity ?? 25) === 0 ? 'Out of Stock' : `Stock: ${product.stock_quantity ?? 25}`}
                          </div>
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDelete(product);
                            }}
                            title="Delete this product"
                            className="absolute top-2 right-2 p-1.5 bg-white/95 hover:bg-[#F4F6F2] hover:text-rose-600 text-gray-500 rounded-md shadow-2xs transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Category tag */}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white rounded text-[10px] font-medium backdrop-blur-sm">
                            {product.category}
                          </div>
                        </div>

                        {/* Info below image */}
                        <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                          <div className="space-y-1">
                            <h4 className="font-serif font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 h-9" title={product.name}>
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[#698156] font-bold text-xs sm:text-sm">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                              {product.compare_at_price && (
                                <span className="text-gray-400 line-through text-[11px]">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                              )}
                            </div>
                          </div>

                          {/* Cart Action Button - Clean, single full-width button, zero overlapping */}
                          {qtyInCart > 0 ? (
                            <div className="flex items-center justify-between bg-[#F4F6F2] border border-[#DCE4D7] rounded-xl p-1 shadow-2xs">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDecrementCart(product.id);
                                }}
                                title="Decrease quantity"
                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-[#698156] hover:bg-[#698156]/15 shadow-2xs transition active:scale-90 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-[#2F3C25]">
                                {qtyInCart} in Cart
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                title="Increase quantity"
                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-[#698156] hover:bg-[#698156]/15 shadow-2xs transition active:scale-90 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              className="w-full py-2 px-3 bg-[#F4F6F2] hover:bg-[#698156] text-[#698156] hover:text-white border border-[#DCE4D7] font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                              title="Add product to checkout sidebar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Sticky bottom floating checkout bar - only show when sidebar is closed */}
              {cartTotalCount > 0 && !isCheckoutDrawerOpen && (
                <div className="sticky bottom-6 z-30 mx-auto max-w-2xl bg-gray-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F6F2]0/20 text-[#849E70] border border-[#698156]/30 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold flex items-center gap-2">
                        <span>{cartTotalCount} {cartTotalCount === 1 ? 'item' : 'items'} in Cart</span>
                        <span className="text-[#849E70] font-extrabold text-base">₹{cartTotalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">Multi-item selection ready for checkout</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-xs text-gray-400 hover:text-white px-2.5 py-1.5 transition rounded-lg hover:bg-white/10 cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutDrawerOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-[#698156] to-[#546944] hover:from-[#546944] hover:to-[#435436] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Checkout & Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: ORDERS ─── */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              {orders.length === 0 ? (
                <EmptyCard icon={<ShoppingBag />} title="No orders yet" sub="Orders placed in the store will appear here from Supabase in real time." />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-gray-900">All Orders ({orders.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                        <tr>
                          {['Order ID', 'Customer', 'Contact', 'Amount', 'Payment', 'Status', 'Date', 'Update'].map(h => (
                            <th key={h} className="p-4 text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map(order => {
                          const addr = order.shipping_address || {};
                          const name = getFormattedCustomerName(addr, order);
                          return (
                            <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="p-4 font-mono text-xs font-bold text-gray-800">#{String(order.id).slice(0, 8)}</td>
                              <td className="p-4">
                                <div className="font-semibold text-gray-900">{name}</div>
                                <div className="text-xs text-gray-400">{addr.city || ''}{addr.state ? `, ${addr.state}` : ''}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-xs flex items-center gap-1 text-gray-600"><Phone className="w-3 h-3" />{addr.phone || '—'}</div>
                                <div className="text-xs flex items-center gap-1 text-gray-400"><Mail className="w-3 h-3" />{addr.email || '—'}</div>
                              </td>
                              <td className="p-4 font-bold text-[#698156]">₹{(order.total_amount || 0).toLocaleString('en-IN')}</td>
                              <td className="p-4 text-xs text-gray-600">{order.payment_method || '—'}</td>
                              <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge(order.status)}`}>{order.status || 'Pending'}</span></td>
                              <td className="p-4 text-xs text-gray-400 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="p-4">
                                <select value={order.status || 'Pending'}
                                  onChange={e => updateOrderStatus(order.id, e.target.value)}
                                  className="px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs font-bold border border-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-[#698156]/20">
                                  <option value="Pending">Pending</option>
                                  <option value="Order Placed">Order Placed</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: CUSTOMERS ─── */}
          {activeTab === 'customers' && (
            <div className="space-y-5">
              {customers.length === 0 ? (
                <EmptyCard icon={<Users />} title="No customers yet" sub="Customers who place orders will appear here, built from real Supabase order data." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {customers.map(cust => (
                    <motion.div key={cust.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 cursor-pointer hover:shadow-md hover:border-[#698156]/40 transition-all"
                      onClick={() => setSelectedCust(cust)}>
                      <div className="w-14 h-14 bg-[#698156]/10 text-[#698156] rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 uppercase">
                        {cust.name[0]}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-serif font-bold text-[#698156] hover:underline leading-tight cursor-pointer">{cust.name}</span>
                          <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            {cust.orderCount} order{cust.orderCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{cust.email}</span></div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{cust.phone}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{cust.city}{cust.state !== '—' ? `, ${cust.state}` : ''}</div>
                        <div className="text-xs text-gray-400">First order: {new Date(cust.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: PAYMENTS ─── */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              {payments.length === 0 ? (
                <EmptyCard icon={<CreditCard />} title="No payment records" sub="Payment records saved during checkout will appear here from Supabase." />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-serif text-base font-bold text-gray-900">Payment Records ({payments.length})</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Total collected: <span className="text-[#698156] font-bold">₹{payments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString('en-IN')}</span></p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 tracking-wider">
                        <tr>
                          {['Payment ID', 'Order ID', 'Method', 'Amount', 'Status', 'Date'].map(h => (
                            <th key={h} className="p-4 text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payments.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="p-4 font-mono text-xs font-bold text-gray-800">#{String(p.id).slice(0, 8)}</td>
                            <td className="p-4 font-mono text-xs text-gray-500">#{String(p.order_id).slice(0, 8)}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">{p.method || '—'}</span>
                            </td>
                            <td className="p-4 font-bold text-[#698156]">₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                            <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge(p.status)}`}>{p.status || 'Pending'}</span></td>
                            <td className="p-4 text-xs text-gray-400 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: HERO MODELS ─── */}
          {activeTab === 'hero-models' && (
            <AdminHeroModelsSection
              products={dbProducts}
              onRefreshProducts={loadData}
            />
          )}

          {/* ─── TAB: MANUAL BILLING & POS ─── */}
          {activeTab === 'billing' && (
            <AdminBillingSection
              products={dbProducts}
              initialProduct={billingInitialProduct}
              initialProducts={billingInitialProducts}
              onClearInitialProduct={() => setBillingInitialProduct(null)}
              onClearInitialProducts={() => {
                setBillingInitialProducts(null);
                try {
                  sessionStorage.removeItem('admin_billing_initial_products');
                } catch (e) {}
              }}
              onOrderCreated={(order) => {
                setOrders(prev => [order, ...prev]);
              }}
            />
          )}

          {/* ─── TAB: INVENTORY STOCK ─── */}
          {activeTab === 'inventory' && (
            <AdminInventorySection
              products={dbProducts}
              onRefreshProducts={loadData}
              onNavigateToCatalog={(searchQ) => {
                if (searchQ) setSearchQuery(searchQ);
                setActiveTab('products');
              }}
            />
          )}

          {/* ─── TAB: CATEGORIES ─── */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <AdminCategories />
            </div>
          )}

        </main>
      </div>

      {/* ═══ CUSTOMER DETAIL CARD MODAL ═══ */}
      <AnimatePresence>
        {selectedCust && (() => {
          const custOrders = orders.filter(o =>
            o.user_id === selectedCust.id ||
            (o.shipping_address?.phone && o.shipping_address.phone === selectedCust.phone) ||
            (o.shipping_address?.email && o.shipping_address.email === selectedCust.email)
          );
          const statusCfg: Record<string, { cls: string; label: string }> = {
            delivered:  { cls: 'bg-green-100 text-green-700 border-green-200', label: 'Delivered' },
            pending:    { cls: 'bg-amber-100 text-amber-700 border-amber-200',  label: 'Pending' },
            cancelled:  { cls: 'bg-red-100 text-red-700 border-red-200',        label: 'Cancelled' },
            processing: { cls: 'bg-blue-100 text-blue-700 border-blue-200',     label: 'Processing' },
          };
          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedCust(null)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              >
                {/* Close - dark color */}
                <button
                  onClick={() => setSelectedCust(null)}
                  className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-800 transition-colors cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header - Light cream/gold colors */}
                <div className="bg-gradient-to-br from-[#FFF8EE] to-[#FFF0D6] border-b border-[#698156]/20 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#698156]/15 border-2 border-[#698156]/40 flex items-center justify-center text-2xl font-bold uppercase flex-shrink-0 text-[#698156]">
                      {selectedCust.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 truncate">{selectedCust.name}</h2>
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs mt-0.5">
                        <Phone className="w-3 h-3 flex-shrink-0 text-[#698156]" />
                        <span>{selectedCust.phone}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-gray-500 text-xs mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#698156]" />
                        <span>{selectedCust.city}{selectedCust.state !== '—' ? `, ${selectedCust.state}` : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="bg-[#698156]/10 border border-[#698156]/20 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#698156]" />
                      <span className="text-sm font-bold text-[#698156]">{selectedCust.orderCount} Order{selectedCust.orderCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                <div className="p-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Orders</h3>
                  {custOrders.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">No orders found</div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {custOrders.map((order, idx) => {
                        const st = (order.status || 'pending').toLowerCase();
                        const cfg = statusCfg[st] || { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: order.status };
                        const date = order.created_at
                          ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—';
                        return (
                          <div key={order.id} className="flex items-center justify-between #FFFFFF rounded-xl px-3 py-2.5 border border-[#698156]/20">
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-800">Order {idx + 1}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5">{date}</div>
                            </div>
                            <div className="text-sm font-bold text-[#698156] mx-3">
                              Rs.{(order.total_amount || 0).toLocaleString('en-IN')}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ═══ COMPACT ADD PRODUCT MODAL (EASY TO CLOSE VIA X, ESC, CANCEL, OR BACKDROP) ═══ */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !adding && setIsAddOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="#FFFFFF rounded-2xl sm:rounded-3xl shadow-2xl max-w-md sm:max-w-xl w-full max-h-[90vh] flex flex-col relative my-auto overflow-hidden border border-[#DCE4D7]"
            >
              {/* Modal header - Fixed at Top */}
              <div className="flex-shrink-0 bg-[#F4F6F2] backdrop-blur-md border-b border-[#DCE4D7] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="Aanya" className="h-7 w-auto object-contain mix-blend-multiply" />
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-gray-900 leading-tight">Add New Product</h3>
                    <p className="text-[10px] text-[#698156] font-medium">Publish directly to Supabase catalog & storefront</p>
                  </div>
                </div>
                {/* Prominent Close X button */}
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-rose-100 border border-gray-200 hover:border-rose-200 text-gray-500 hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                  title="Close (Esc)"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body - Scrollable Form */}
              <form id="add-product-form" onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5">
                {/* Product Title */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-600 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Maroon Silk Saree"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20"
                  />
                </div>

                {/* Category + Selling Price + MRP + Initial Stock */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-600 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 cursor-pointer"
                    >
                      {['Sarees','Kurtis','Lehengas','Salwar Sets','Western','Maxi','Tradition'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-600 mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 4999"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-600 mb-1">
                      MRP (₹) <span className="text-gray-400 font-normal">opt</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 6999"
                      value={form.compare_at_price}
                      onChange={e => setForm({ ...form, compare_at_price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-600 mb-1">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      value={form.stock_quantity ?? 25}
                      onChange={e => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-[#F4F6F2] rounded-xl text-xs border border-[#DCE4D7] outline-none focus:ring-2 focus:ring-[#698156]/20 font-bold text-[#2F3C25]"
                    />
                  </div>
                </div>

                {/* Product Images & Gallery Section */}
                <div className="bg-[#F4F6F2] rounded-xl p-3 border border-[#DCE4D7] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-700">
                        Product Gallery Images *
                      </label>
                      <p className="text-[10px] text-gray-400 leading-tight">
                        Upload multiple photos or paste URLs (shows in store & 2-column detail page)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutofillAngles}
                      className="text-[10px] font-bold text-[#698156] hover:text-[#546944] bg-white hover:bg-[#F4F6F2] border border-[#DCE4D7] px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Automatically generate matching angle shots for this category"
                    >
                      <Sparkles className="w-3 h-3 text-[#698156]" />
                      Autofill Angles
                    </button>
                  </div>

                  {/* Upload button + URL input row */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Device File Upload Button */}
                    <label className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#698156] to-[#546944] hover:from-[#546944] hover:to-[#435436] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 text-center select-none">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Uploading...' : 'Upload Photos (Multiple)'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={isUploading}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* URL Input */}
                    <div className="flex-[1.4] flex gap-1.5 items-center">
                      <input
                        type="url"
                        placeholder="Or paste image URL..."
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-white rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddImageUrl()}
                        className="px-2.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Gallery Thumbnails List */}
                  {form.images && form.images.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                        <span>{form.images.length} photo{form.images.length > 1 ? 's' : ''} in gallery</span>
                        <span className="text-gray-400">Click ★ to set main thumbnail</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                        {form.images.map((imgSrc, idx) => (
                          <div
                            key={idx}
                            className={`relative group flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 bg-white shadow-2xs transition-all ${
                              idx === 0 ? 'border-pink-500 ring-2 ring-[#698156]/30' : 'border-gray-200 hover:border-[#698156]'
                            }`}
                          >
                            <img
                              src={imgSrc}
                              alt={`Angle ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Badge */}
                            <div className="absolute top-1 left-1 pointer-events-none">
                              {idx === 0 ? (
                                <span className="bg-[#F4F6F2]0 text-white text-[8px] font-black px-1 py-0.5 rounded shadow-xs">
                                  #1 MAIN
                                </span>
                              ) : (
                                <span className="bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1 py-0.5 rounded">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMakePrimary(idx)}
                                  title="Make Primary Image"
                                  className="w-6 h-6 rounded-full bg-white/90 text-amber-500 hover:bg-white flex items-center justify-center cursor-pointer transition-all shadow"
                                >
                                  <Star className="w-3 h-3 fill-amber-500" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                title="Remove photo"
                                className="w-6 h-6 rounded-full bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center cursor-pointer transition-all shadow"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#DCE4D7] rounded-xl p-2.5 text-center bg-white/60">
                      <p className="text-[11px] font-semibold text-gray-600">No images uploaded yet</p>
                      <p className="text-[10px] text-gray-400">
                        Upload photos from your computer or click "Autofill Angles" to generate sample fashion views.
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Fabric, embroidery, care instructions…"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white rounded-xl text-xs border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 resize-none leading-relaxed"
                  />
                </div>

                {/* Feature on Homepage Hero Model */}
                <div
                  className={`border rounded-xl p-2.5 transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                    featureOnHero ? 'bg-[#F4F6F2] border-[#698156] ring-1 ring-[#698156]/20' : 'bg-gray-50/80 border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setFeatureOnHero(!featureOnHero)}
                >
                  <input
                    type="checkbox"
                    checked={featureOnHero}
                    onChange={e => setFeatureOnHero(e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 text-[#698156] rounded focus:ring-[#698156] cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-gray-900 flex items-center gap-1 leading-tight">
                      <Sparkles className="w-3 h-3 text-[#698156]" />
                      Show on Homepage Hero Model (Model Dress)
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                      If checked, a model wearing this dress will appear in the homepage hero coverflow.
                    </p>
                  </div>
                </div>
              </form>

              {/* Modal Footer - Fixed at Bottom */}
              <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-[#DCE4D7] px-4 py-2.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-product-form"
                  disabled={adding}
                  className="px-4 py-1.5 bg-[#698156] hover:bg-[#546944] text-white rounded-full text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                >
                  {adding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing…</span>
                    </>
                  ) : (
                    'Publish to Store'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ UNIQUE LUXURY DELETE CONFIRMATION MODAL (CENTERED) ═══ */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
                    {prodImg(productToDelete) ? (
                      <img
                        src={prodImg(productToDelete)}
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
                      <span className="text-xs font-bold text-[#698156]">
                        ₹{(productToDelete.price || 0).toLocaleString('en-IN')}
                      </span>
                      {productToDelete.compare_at_price && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{productToDelete.compare_at_price.toLocaleString('en-IN')}
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

      {/* ═══ CHECKOUT & ORDER REVIEW DRAWER / MODAL ═══ */}
      {/* ═══ CHECKOUT & ORDER REVIEW SIDEBAR DRAWER ═══ */}
      <AnimatePresence>
        {isCheckoutDrawerOpen && (
          <>
            {/* Mobile-only backdrop overlay (hidden on lg+ screens so catalog remains 100% interactive) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsCheckoutDrawerOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-[190] cursor-pointer"
            />

            {/* Slide-over Right Sidebar - Docked alongside the catalog on desktop */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[360px] lg:w-[380px] bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 z-[200]"
            >
              {/* Sidebar Header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-pink-50/80 via-white to-rose-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#698156] to-[#546944] text-white flex items-center justify-center shadow-md shadow-[#698156]/20 shrink-0">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-gray-900 text-base">Checkout & Order Review</h3>
                    <p className="text-xs text-gray-500">
                      {cartTotalCount} {cartTotalCount === 1 ? 'item' : 'items'} selected for POS Billing
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
                  title="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List - Scrollable */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
                {/* Helpful guide badge */}
                <div className="bg-[#F4F6F2] border border-[#DCE4D7] rounded-xl p-2.5 flex items-center gap-2 text-xs text-[#2F3C25]">
                  <Plus className="w-3.5 h-3.5 text-[#698156] shrink-0" />
                  <span>Click <b>+ Add to Cart</b> on any product to add it here.</span>
                </div>

                {adminCart.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 space-y-3">
                    <ShoppingCart className="w-14 h-14 mx-auto text-gray-300 stroke-1" />
                    <p className="text-sm font-medium">Your checkout selection is empty.</p>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Click "+ Add to Cart" on any product in the catalog to add items here.
                    </p>
                  </div>
                ) : (
                  adminCart.map((item) => {
                    const img = prodImg(item.product);
                    const itemTotal = (Number(item.product.price) || 0) * item.quantity;
                    return (
                      <div
                        key={item.product.id}
                        className="p-3 bg-gray-50/90 hover:bg-gray-50 rounded-2xl border border-gray-100 flex gap-3 transition"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-20 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0">
                          {img ? (
                            <img src={img} alt={item.product.name} className="w-full h-full object-cover object-top" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          {/* Row 1: Full title and Remove button */}
                          <div className="flex items-start justify-between gap-1.5">
                            <h4
                              className="font-serif font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2"
                              title={item.product.name}
                            >
                              {item.product.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              title="Remove item"
                              className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-[#F4F6F2] transition cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Row 2: Category and unit price */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-200/70 px-1.5 py-0.5 rounded">
                              {item.product.category || 'General'}
                            </span>
                            <span>₹{(Number(item.product.price) || 0).toLocaleString('en-IN')} each</span>
                          </div>

                          {/* Row 3: Stepper and Line Total */}
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/50">
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleDecrementCart(item.product.id)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-gray-50 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item.product)}
                                className="w-5 h-5 flex items-center justify-center rounded bg-gray-50 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <span className="text-sm font-bold text-[#698156]">
                              ₹{itemTotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer - Clean, Full-Width Non-Clumsy CTA */}
              {adminCart.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 space-y-3.5 shrink-0">
                  <div className="bg-white rounded-2xl p-3.5 border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Items Subtotal ({cartTotalCount} items)</span>
                      <span className="font-semibold text-gray-900">₹{cartTotalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Est. GST (5% in POS)</span>
                      <span className="font-semibold text-gray-900">₹{Math.round(cartTotalPrice * 0.05).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex items-center justify-between font-bold text-sm">
                      <span className="text-gray-900">Est. Total Payable</span>
                      <span className="text-rose-600 text-base">₹{Math.round(cartTotalPrice * 1.05).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Single Clean Full-Width CTA Button */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleProceedToPOSBilling}
                      className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#698156] to-[#546944] hover:from-[#546944] hover:to-[#435436] text-white font-bold text-sm shadow-md shadow-[#698156]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Proceed to POS Billing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={() => setIsCheckoutDrawerOpen(false)}
                        className="text-xs text-gray-500 hover:text-gray-800 font-medium transition cursor-pointer"
                      >
                        Hide Sidebar
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="text-xs text-gray-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

/* ── Helper: Empty state card ── */
function EmptyCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8' })
          : icon}
      </div>
      <div>
        <h3 className="font-serif text-xl font-bold text-gray-700">{title}</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">{sub}</p>
      </div>
    </div>
  );
}
