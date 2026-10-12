import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  MapPin, Package, CreditCard, Check, ChevronLeft, ChevronRight,
  Plus, Truck, Shield, Tag, Wallet, Landmark, Banknote
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Product, ensureProductImages } from '../data/products';
import { SEOHead } from '../components/SEOHead';
import { isGooglePayIndiaSupported, triggerGooglePayIndia } from '../../lib/googlePayIndia';
import { GooglePayModal } from '../components/GooglePayModal';

interface SavedAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number;
  image: string;
  quantity: number;
  category?: string;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ orderId: string; trackingNumber: string; method?: string; status?: string; txnId?: string } | null>(null);

  // Buy Now mode
  const buyNowProductId = searchParams.get('buyNow');
  const buyNowQty = parseInt(searchParams.get('qty') || '1', 10);
  const [buyNowProduct, setBuyNowProduct] = useState<CheckoutItem | null>(null);
  const [loadingBuyNow, setLoadingBuyNow] = useState(!!buyNowProductId);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '', phone: '', address_line_1: '', address_line_2: '',
    city: '', state: '', postal_code: ''
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Card' | 'UPI'>('UPI');
  const [isGpayModalOpen, setIsGpayModalOpen] = useState(false);
  const [isNativeGpaySupported, setIsNativeGpaySupported] = useState(false);
  const [pendingGpayOrderId, setPendingGpayOrderId] = useState<string>('');

  // Detect Google Pay India (Tez) Web API support on user browser
  useEffect(() => {
    async function checkGpay() {
      try {
        const supported = await isGooglePayIndiaSupported();
        setIsNativeGpaySupported(supported);
      } catch {
        setIsNativeGpaySupported(false);
      }
    }
    checkGpay();
  }, []);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount_type: string; discount_value: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Load buy-now product if applicable
  useEffect(() => {
    if (!buyNowProductId) { setLoadingBuyNow(false); return; }

    async function loadProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', buyNowProductId)
          .single();

        if (error || !data) throw error || new Error('Product not found');

        const images = ensureProductImages(data);
        setBuyNowProduct({
          id: data.id,
          name: data.name,
          price: data.price,
          compare_at_price: data.compare_at_price,
          image: images[0] || data.image_url || '',
          quantity: buyNowQty,
          category: data.category,
        });
      } catch (err) {
        console.error('Failed to load buy-now product:', err);
        toast.error('Product not found');
        navigate('/');
      } finally {
        setLoadingBuyNow(false);
      }
    }
    loadProduct();
  }, [buyNowProductId]);

  // Load user data and addresses
  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsAddingNew(true); return; }

        // Pre-fill name/phone
        const fullName = user.user_metadata?.full_name || '';
        const phone = user.user_metadata?.phone || '';
        setNewAddress(prev => ({
          ...prev,
          full_name: prev.full_name || fullName,
          phone: prev.phone || phone,
        }));

        // Try loading from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setNewAddress(prev => ({
            ...prev,
            full_name: prev.full_name || profile.full_name || '',
            phone: prev.phone || profile.phone || '',
          }));
        }

        // Load saved addresses from localStorage
        try {
          const stored = localStorage.getItem(`addresses_${user.id}`);
          if (stored) {
            const addrs = JSON.parse(stored) as SavedAddress[];
            if (addrs.length > 0) {
              setSavedAddresses(addrs);
              const def = addrs.find(a => a.is_default) || addrs[0];
              setSelectedAddressId(def.id);
            } else {
              setIsAddingNew(true);
            }
          } else {
            setIsAddingNew(true);
          }
        } catch {
          setIsAddingNew(true);
        }
      } catch {
        setIsAddingNew(true);
      }
    }
    loadUserData();
  }, []);

  // Determine checkout items
  const checkoutItems: CheckoutItem[] = buyNowProduct
    ? [buyNowProduct]
    : cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        compare_at_price: (item as any).compare_at_price,
        image: item.image || (item.images && item.images[0]) || '',
        quantity: item.quantity,
        category: item.category,
      }));

  // Price calculations
  const mrpTotal = checkoutItems.reduce((sum, item) => {
    const mrp = item.compare_at_price || Math.round(item.price * 1.4);
    return sum + mrp * item.quantity;
  }, 0);
  const sellingTotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = mrpTotal - sellingTotal;
  const platformFee = 0;
  const deliveryFee = 0; // Free delivery

  // Calculate coupon discount
  const couponDiscount = couponApplied
    ? couponApplied.discount_type === 'Percentage'
      ? Math.round(sellingTotal * (couponApplied.discount_value / 100))
      : Math.min(couponApplied.discount_value, sellingTotal)
    : 0;
  const totalAmount = Math.max(0, sellingTotal + platformFee + deliveryFee - couponDiscount);
  const youSave = discount;

  // Delivery date (7 days from now)
  const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const deliveryDateStr = deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  // Get selected address object
  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);

  // Handle new address save
  const handleSaveNewAddress = () => {
    if (!newAddress.full_name || !newAddress.phone || !newAddress.address_line_1 || !newAddress.city || !newAddress.state || !newAddress.postal_code) {
      toast.error('Please fill in all required address fields');
      return false;
    }
    if (!/^[1-9][0-9]{5}$/.test(newAddress.postal_code.trim())) {
      toast.error('Please enter a valid 6-digit PIN code');
      return false;
    }

    const addr: SavedAddress = {
      id: 'addr_' + Date.now(),
      ...newAddress,
      is_default: savedAddresses.length === 0,
    };

    const updated = [addr, ...savedAddresses];
    setSavedAddresses(updated);
    setSelectedAddressId(addr.id);
    setIsAddingNew(false);

    // Persist to localStorage
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) localStorage.setItem(`addresses_${user.id}`, JSON.stringify(updated));
    }).catch(() => {});

    return true;
  };

  // Coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { setCouponError('Please enter a coupon code'); return; }
    setCouponLoading(true);
    setCouponError('');
    const codeUpper = couponCode.trim().toUpperCase();
    try {
      // 1. First try the coupons table
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', codeUpper)
        .eq('status', 'Active')
        .maybeSingle();

      if (!error && data) {
        // Found in coupons table
        if (data.product_id) {
          const matchesProduct = checkoutItems.some(item => item.id === data.product_id);
          if (!matchesProduct) {
            setCouponError('This coupon is not applicable to the items in your cart');
            setCouponApplied(null);
            setCouponLoading(false);
            return;
          }
        }
        const discValue = Number(data.discount_value);
        const saving = data.discount_type === 'Percentage'
          ? Math.round(sellingTotal * (discValue / 100))
          : Math.min(discValue, sellingTotal);
        setCouponApplied({ code: data.code, discount_type: data.discount_type, discount_value: discValue });
        setCouponError('');
        toast.success(`Coupon ${data.code} applied! You save ₹${saving.toLocaleString('en-IN')}`);
        return;
      }

      // 2. Fallback: check product offer_details for matching coupon_code
      const productIds = checkoutItems.map(item => item.id);
      const { data: products } = await supabase
        .from('products')
        .select('id, offer_enabled, offer_details')
        .in('id', productIds)
        .eq('offer_enabled', true);

      if (products && products.length > 0) {
        for (const prod of products) {
          const details = typeof prod.offer_details === 'string' ? JSON.parse(prod.offer_details) : prod.offer_details;
          if (details?.coupon_code?.toUpperCase() === codeUpper) {
            const discValue = Number(details.coupon_discount || 0);
            const saving = Math.round(sellingTotal * (discValue / 100));
            setCouponApplied({ code: codeUpper, discount_type: 'Percentage', discount_value: discValue });
            setCouponError('');
            toast.success(`Coupon ${codeUpper} applied! You save ₹${saving.toLocaleString('en-IN')}`);
            return;
          }
        }
      }

      // Not found anywhere
      setCouponError('Invalid or expired coupon code');
      setCouponApplied(null);
    } catch (err) {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
    toast.info('Coupon removed');
  };

  // Step 1 → Step 2
  const handleContinueToConfirm = () => {
    if (isAddingNew || savedAddresses.length === 0) {
      if (!handleSaveNewAddress()) return;
    }
    if (!selectedAddressId && savedAddresses.length > 0) {
      toast.error('Please select a delivery address');
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  // Step 2 → Step 3
  const handleContinueToPayment = () => {
    setStep(3);
    window.scrollTo(0, 0);
  };

  // Core Order Finalizer (handles DB inserts, inventory update, and Supabase payment logging)
  const finalizeOrderPlacement = async (
    orderId: string,
    trackingNumber: string,
    method: 'Google Pay' | 'COD' | 'Card',
    paymentStatus: 'Completed' | 'Pending',
    txnId: string,
    payerVpa?: string,
    rawDetails?: any
  ) => {
    setIsProcessing(true);
    try {
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch {}

      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      const shippingAddress = addr ? {
        full_name: addr.full_name,
        phone: addr.phone,
        address: `${addr.address_line_1}${addr.address_line_2 ? ', ' + addr.address_line_2 : ''}`,
        city: addr.city,
        state: addr.state,
        pincode: addr.postal_code,
        tracking_number: trackingNumber,
      } : {
        full_name: newAddress.full_name,
        phone: newAddress.phone,
        address: `${newAddress.address_line_1}${newAddress.address_line_2 ? ', ' + newAddress.address_line_2 : ''}`,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.postal_code,
        tracking_number: trackingNumber,
      };

      // 1. Insert order
      const orderPayload = {
        id: orderId,
        status: paymentStatus === 'Completed' ? 'Confirmed' : 'Order Placed',
        payment_method: method === 'Google Pay' ? 'UPI' : method,
        payment_status: paymentStatus,
        subtotal: sellingTotal,
        discount_amount: discount,
        tax_amount: 0,
        shipping_fee: deliveryFee,
        total_amount: totalAmount,
        total_price: totalAmount,
        shipping_address: shippingAddress,
        ...(userId ? { user_id: userId } : {}),
      };

      const { error: orderError } = await supabase.from('orders').insert([orderPayload]);
      if (orderError) {
        delete (orderPayload as any).user_id;
        const { error: retryErr } = await supabase.from('orders').insert([orderPayload]);
        if (retryErr) throw retryErr;
      }

      // 2. Insert order items
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const orderItems = checkoutItems.map(item => ({
        order_id: orderId,
        product_id: uuidRegex.test(item.id) ? item.id : null,
        quantity: item.quantity,
        price_at_time: item.price,
        price: item.price,
        total_price: item.price * item.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);

      // 3. Deduct stock
      for (const item of checkoutItems) {
        if (uuidRegex.test(item.id)) {
          try {
            const { error: rpcErr } = await supabase.rpc('decrement_stock', {
              p_product_id: item.id,
              p_qty: item.quantity,
            });
            if (rpcErr) {
              const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', item.id).single();
              if (prod) {
                await supabase.from('products').update({ stock_quantity: Math.max(0, prod.stock_quantity - item.quantity) }).eq('id', item.id);
              }
            }
          } catch {}
        }
      }

      // 4. Log transaction into Supabase payments table
      try {
        const { error: edgeErr } = await supabase.functions.invoke('verify-google-pay', {
          body: {
            orderId,
            amount: totalAmount,
            txnId,
            payerVpa: payerVpa || null,
            paymentMethod: method,
            userId,
            customerName: shippingAddress.full_name,
            customerPhone: shippingAddress.phone,
            rawDetails: rawDetails || {},
          },
        });

        if (edgeErr) {
          // Direct fallback to payments table
          await supabase.from('payments').insert({
            order_id: orderId,
            user_id: userId,
            customer_name: shippingAddress.full_name,
            customer_phone: shippingAddress.phone,
            amount: totalAmount,
            currency: 'INR',
            payment_method: method,
            gateway_txn_id: txnId,
            payer_vpa: payerVpa || null,
            status: paymentStatus === 'Completed' ? 'Completed' : 'Initiated',
            metadata: rawDetails || {},
          });
        }
      } catch (payLogErr) {
        console.warn('Payment logging fallback triggered:', payLogErr);
        try {
          await supabase.from('payments').insert({
            order_id: orderId,
            user_id: userId,
            customer_name: shippingAddress.full_name,
            customer_phone: shippingAddress.phone,
            amount: totalAmount,
            currency: 'INR',
            payment_method: method,
            gateway_txn_id: txnId,
            payer_vpa: payerVpa || null,
            status: paymentStatus === 'Completed' ? 'Completed' : 'Initiated',
          });
        } catch {}
      }

      // 5. Clear cart
      if (!buyNowProductId) {
        clearCart();
      }

      setIsGpayModalOpen(false);
      setOrderPlaced({ orderId, trackingNumber, method, status: paymentStatus, txnId });
      toast.success(method === 'Google Pay' ? 'Google Pay payment successful!' : 'Order placed successfully!');
      window.dispatchEvent(new Event('orders_updated'));
    } catch (err: any) {
      console.error('Order placement failed:', err);
      toast.error('Order failed: ' + (err.message || 'Please try again'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Place Order / Initiate Payment
  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) return;

    if (isAddingNew || savedAddresses.length === 0) {
      if (!handleSaveNewAddress()) return;
    }
    if (!selectedAddressId && savedAddresses.length > 0) {
      toast.error('Please select a delivery address');
      return;
    }

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const trackingNumber = `AANYA-${datePart}-${randomSuffix}`;
    const orderId = pendingGpayOrderId || ('ord_' + Math.random().toString(36).substring(2, 10));
    setPendingGpayOrderId(orderId);

    const addr = savedAddresses.find(a => a.id === selectedAddressId);
    const custName = addr?.full_name || newAddress.full_name || 'Customer';
    const custPhone = addr?.phone || newAddress.phone || '';

    // Flow for Google Pay / UPI
    if (paymentMethod === 'UPI') {
      if (isNativeGpaySupported) {
        setIsProcessing(true);
        try {
          const res = await triggerGooglePayIndia({
            amount: totalAmount,
            orderId,
            customerName: custName,
            customerPhone: custPhone,
          });

          if (res.success && res.transactionId) {
            await finalizeOrderPlacement(
              orderId,
              trackingNumber,
              'Google Pay',
              'Completed',
              res.transactionId,
              res.payerVpa,
              res.rawDetails
            );
            return;
          } else {
            // User dismissed native sheet, fallback to QR modal
            setIsProcessing(false);
            setIsGpayModalOpen(true);
            return;
          }
        } catch (err) {
          setIsProcessing(false);
          setIsGpayModalOpen(true);
          return;
        }
      } else {
        // Desktop / Non-Android: Open Google Pay QR Modal
        setIsGpayModalOpen(true);
        return;
      }
    }

    // Flow for Cash on Delivery
    if (paymentMethod === 'COD') {
      await finalizeOrderPlacement(
        orderId,
        trackingNumber,
        'COD',
        'Pending',
        `COD-${Date.now()}`
      );
      return;
    }

    // Flow for Card
    await finalizeOrderPlacement(
      orderId,
      trackingNumber,
      'Card',
      'Pending',
      `CARD-${Date.now()}`
    );
  };

  // Loading state
  if (loadingBuyNow) {
    return (
      <div className="min-h-screen bg-[#F9FAF7]">
        <AnnouncementBar /><Navigation />
        <div className="pt-32 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#698156]" /></div>
      </div>
    );
  }

  // Empty cart
  if (checkoutItems.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  // Order Success Screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F9FAF7]">
        <SEOHead title="Order Confirmed" canonicalUrl="/checkout" noIndex={true} />
        <AnnouncementBar /><Navigation />
        <div className="pt-24 sm:pt-28 lg:pt-14 pb-20 px-4">
          <div className="max-w-lg mx-auto text-center bg-white rounded-3xl p-8 sm:p-12 shadow-sm">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10" strokeWidth={3} />
            </div>
            <h1 className="font-serif text-3xl text-gray-900 mb-3">Order Placed!</h1>
            <p className="text-gray-500 text-sm mb-6">Thank you for shopping with Aanya Fashions</p>

            <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <span className="font-bold text-gray-900">{orderPlaced.orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tracking</span>
                <span className="font-bold text-[#698156]">{orderPlaced.trackingNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Payment</span>
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  {orderPlaced.method || paymentMethod}
                  {orderPlaced.status === 'Completed' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">PAID</span>
                  )}
                </span>
              </div>
              {orderPlaced.txnId && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Txn / UTR</span>
                  <span className="font-mono font-bold text-gray-800 text-xs bg-white px-2 py-0.5 rounded border border-gray-200">{orderPlaced.txnId}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Est. Delivery</span>
                <span className="font-bold text-emerald-600">{deliveryDateStr}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/orders')}
                className="flex-1 py-3 bg-[#698156] text-white rounded-xl font-bold text-sm hover:bg-[#546944] transition-colors"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Steps config
  const steps = [
    { num: 1, label: 'Address', icon: MapPin },
    { num: 2, label: 'Confirm', icon: Package },
    { num: 3, label: 'Payment', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      <SEOHead title="Secure Checkout" canonicalUrl="/checkout" noIndex={true} />
      <AnnouncementBar /><Navigation />

      <div className="pt-24 sm:pt-28 lg:pt-14 pb-20 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    step === s.num
                      ? 'bg-[#698156] text-white shadow-md'
                      : step > s.num
                        ? 'bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  {s.label}
                </button>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ${step > s.num ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content (Left 2/3) */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* ═══ STEP 1: DELIVERY ADDRESS ═══ */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <h2 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#698156]" />
                      Select Delivery Address
                    </h2>

                    {/* Saved Addresses */}
                    {savedAddresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => { setSelectedAddressId(addr.id); setIsAddingNew(false); }}
                        className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all ${
                          selectedAddressId === addr.id && !isAddingNew
                            ? 'border-[#698156] ring-2 ring-[#698156]/20 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-gray-900">{addr.full_name}</p>
                            <p className="text-xs text-gray-600">{addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ''}</p>
                            <p className="text-xs text-gray-600">{addr.city}, {addr.state} — {addr.postal_code}</p>
                            <p className="text-xs text-gray-500">Phone: {addr.phone}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            selectedAddressId === addr.id && !isAddingNew
                              ? 'border-[#698156] bg-[#698156]'
                              : 'border-gray-300'
                          }`}>
                            {selectedAddressId === addr.id && !isAddingNew && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add New Address */}
                    {!isAddingNew ? (
                      <button
                        onClick={() => setIsAddingNew(true)}
                        className="w-full bg-white rounded-xl p-4 border-2 border-dashed border-gray-300 hover:border-[#698156] flex items-center justify-center gap-2 text-sm font-semibold text-[#698156] transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Address
                      </button>
                    ) : (
                      <div className="bg-white rounded-xl p-5 border-2 border-[#698156] ring-2 ring-[#698156]/20 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-[#698156]" />
                          New Delivery Address
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Full Name *</label>
                            <input type="text" value={newAddress.full_name} onChange={e => setNewAddress(p => ({ ...p, full_name: e.target.value }))}
                              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20" placeholder="Enter full name" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Phone *</label>
                            <input type="tel" value={newAddress.phone} onChange={e => setNewAddress(p => ({ ...p, phone: e.target.value }))}
                              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20" placeholder="10-digit phone" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Address Line 1 *</label>
                          <input type="text" value={newAddress.address_line_1} onChange={e => setNewAddress(p => ({ ...p, address_line_1: e.target.value }))}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20" placeholder="Flat, House no., Street" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Address Line 2</label>
                          <input type="text" value={newAddress.address_line_2} onChange={e => setNewAddress(p => ({ ...p, address_line_2: e.target.value }))}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20" placeholder="Landmark (optional)" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">City *</label>
                            <input type="text" value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))}
                              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20" placeholder="City" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">State *</label>
                            <input type="text" value={newAddress.state} onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))}
                              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20" placeholder="State" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">PIN Code *</label>
                            <input type="text" maxLength={6} value={newAddress.postal_code} onChange={e => setNewAddress(p => ({ ...p, postal_code: e.target.value.replace(/\D/g, '') }))}
                              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20" placeholder="6-digit PIN" />
                          </div>
                        </div>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleContinueToConfirm}
                      className="w-full py-4 bg-[#698156] text-white rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#546944] transition-colors shadow-lg cursor-pointer"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ STEP 2: CONFIRM DETAILS ═══ */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <h2 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#698156]" />
                      Confirm Your Order
                    </h2>

                    {/* Delivery Address Card */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#698156] uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Delivering to
                          </p>
                          <p className="font-bold text-sm text-gray-900">{selectedAddress?.full_name}</p>
                          <p className="text-xs text-gray-600">
                            {selectedAddress?.address_line_1}
                            {selectedAddress?.address_line_2 ? `, ${selectedAddress.address_line_2}` : ''}
                          </p>
                          <p className="text-xs text-gray-600">
                            {selectedAddress?.city}, {selectedAddress?.state} — {selectedAddress?.postal_code}
                          </p>
                          <p className="text-xs text-gray-500">Phone: {selectedAddress?.phone}</p>
                        </div>
                        <button
                          onClick={() => setStep(1)}
                          className="text-xs font-bold text-[#698156] hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Products List */}
                    <div className="space-y-3">
                      {checkoutItems.map(item => (
                        <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-200 flex gap-4">
                          <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-lg bg-gray-50 flex-shrink-0" />
                          <div className="flex-grow min-w-0 space-y-1">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-gray-400">{item.category || 'Fashion'} • Free Size • Qty: {item.quantity}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                              {item.compare_at_price && (
                                <span className="text-xs text-gray-400 line-through">₹{(item.compare_at_price * item.quantity).toLocaleString('en-IN')}</span>
                              )}
                            </div>
                            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Est. Delivery: {deliveryDateStr}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ═══ COUPON CODE INPUT ═══ */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5 text-[#698156]" />
                        Have a Coupon Code?
                      </div>

                      {couponApplied ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span className="text-sm font-bold text-emerald-700">{couponApplied.code}</span>
                              <span className="text-xs text-emerald-600 ml-2">
                                {couponApplied.discount_type === 'Percentage' ? `${couponApplied.discount_value}% off` : `₹${couponApplied.discount_value} off`}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                              onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                              className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 font-mono font-bold uppercase"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCoupon}
                              disabled={couponLoading}
                              className="px-5 py-2.5 bg-[#698156] hover:bg-[#546944] text-white text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {couponLoading ? 'Checking…' : 'Apply'}
                            </button>
                          </div>
                          {couponError && (
                            <p className="text-xs text-rose-500 font-medium">{couponError}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" /> Change Address
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleContinueToPayment}
                        className="flex-1 py-3.5 bg-[#698156] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#546944] transition-colors shadow-lg cursor-pointer"
                      >
                        Continue <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ═══ STEP 3: PAYMENT ═══ */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <h2 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#698156]" />
                      Choose Payment Method
                    </h2>

                    {/* Payment Options */}
                    <div className="space-y-3">
                      {[
                        { id: 'UPI' as const, label: 'Google Pay (UPI)', desc: 'Instant 1-Tap GPay app & QR Code transfer', icon: Wallet, badge: 'Instant' },
                        { id: 'COD' as const, label: 'Cash on Delivery', desc: 'Pay when you receive your order', icon: Banknote, badge: 'Popular' },
                        { id: 'Card' as const, label: 'Credit / Debit Card', desc: 'Pay via Card or Net Banking', icon: CreditCard, badge: null },
                      ].map(option => (
                        <div
                          key={option.id}
                          onClick={() => setPaymentMethod(option.id)}
                          className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all flex items-center gap-4 ${
                            paymentMethod === option.id
                              ? 'border-[#698156] ring-2 ring-[#698156]/20 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === option.id ? 'bg-[#698156] text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <option.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">{option.label}</span>
                              {option.badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  option.badge === 'Instant'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {option.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{option.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            paymentMethod === option.id ? 'border-[#698156] bg-[#698156]' : 'border-gray-300'
                          }`}>
                            {paymentMethod === option.id && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Google Pay Active Info Box */}
                    {paymentMethod === 'UPI' && (
                      <div className="bg-[#F8FBF7] border border-[#698156]/20 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-xs">
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center p-1.5 flex-shrink-0 shadow-xs">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                            alt="Google Pay"
                            className="w-full h-auto object-contain"
                          />
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          <p className="font-bold text-gray-900 text-sm mb-0.5">Google Pay India (NPCI UPI)</p>
                          {isNativeGpaySupported ? (
                            <p className="text-[#698156] font-semibold">
                              ✓ 1-Tap Google Pay available! Tap below to authorize directly in the Google Pay app.
                            </p>
                          ) : (
                            <p>
                              Clicking below will display a dynamic Google Pay QR Code and instant UPI payment window for your phone.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'Card' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 font-medium">
                        💡 For digital cards and instant bank payments, select <strong>Google Pay (UPI)</strong> or choose <strong>Cash on Delivery</strong>.
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(2)}
                        className="py-3.5 px-6 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={isProcessing}
                        onClick={handlePlaceOrder}
                        className={`flex-1 py-3.5 text-white rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          paymentMethod === 'UPI' ? 'bg-[#1A73E8] hover:bg-[#1557b0]' : 'bg-[#698156] hover:bg-[#546944]'
                        }`}
                      >
                        {isProcessing ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                        ) : paymentMethod === 'UPI' ? (
                          <>Pay with Google Pay • ₹{totalAmount.toLocaleString('en-IN')}</>
                        ) : (
                          <>Place Order • ₹{totalAmount.toLocaleString('en-IN')}</>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price Summary Sidebar (Right 1/3) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-32 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Price Details ({checkoutItems.reduce((s, i) => s + i.quantity, 0)} Item{checkoutItems.length > 1 ? 's' : ''})
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Total MRP</span>
                    <span className="font-medium text-gray-900">₹{mrpTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount on MRP</span>
                      <span className="font-semibold">−₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[#698156]">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Coupon ({couponApplied?.code})
                      </span>
                      <span className="font-semibold">−₹{couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span className="font-medium text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-emerald-600">FREE</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {youSave > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-emerald-700">
                      You'll save ₹{youSave.toLocaleString('en-IN')} on this order
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  Safe & Secure Payments • Easy Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Pay Verification Modal (QR code / UPI fallback) */}
      <GooglePayModal
        isOpen={isGpayModalOpen}
        onClose={() => setIsGpayModalOpen(false)}
        orderId={pendingGpayOrderId}
        amount={totalAmount}
        customerName={savedAddresses.find(a => a.id === selectedAddressId)?.full_name || newAddress.full_name}
        customerPhone={savedAddresses.find(a => a.id === selectedAddressId)?.phone || newAddress.phone}
        onPaymentSuccess={async (txnId, payerVpa, raw) => {
          const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const randomSuffix = Math.floor(10000 + Math.random() * 90000);
          const trackingNumber = `AANYA-${datePart}-${randomSuffix}`;
          await finalizeOrderPlacement(
            pendingGpayOrderId,
            trackingNumber,
            'Google Pay',
            'Completed',
            txnId,
            payerVpa,
            raw
          );
        }}
      />

      <Footer />
    </div>
  );
}