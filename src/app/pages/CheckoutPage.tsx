import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router';
import {
  CheckCircle2,
  Wallet,
  Landmark,
  Truck,
  ChevronLeft,
  ShieldCheck,
  Tag,
  Plus,
  MapPin,
  Check
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

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

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart, isLoading } = useCart();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // Addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [saveAddressToBook, setSaveAddressToBook] = useState(true);

  // Address Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Fetch saved addresses from API & user profile
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Pre-fill email/name
          const fullName = user.user_metadata?.full_name || '';
          const parts = fullName.split(' ');
          setFormData(prev => ({
            ...prev,
            email: prev.email || user.email || '',
            firstName: prev.firstName || parts[0] || '',
            lastName: prev.lastName || parts.slice(1).join(' ') || '',
            phone: prev.phone || user.user_metadata?.phone || ''
          }));

          // Fetch saved addresses from server
          try {
            const addresses = await api.addresses.getAll();
            if (Array.isArray(addresses) && addresses.length > 0) {
              setSavedAddresses(addresses);
              const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
              setSelectedAddressId(defaultAddr.id);
            } else {
              setIsAddingNewAddress(true);
            }
          } catch {
            setIsAddingNewAddress(true);
          }
        } else {
          setIsAddingNewAddress(true);
        }
      } catch (err) {
        setIsAddingNewAddress(true);
      }
    };

    loadUserData();
  }, []);

  // Recalculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const shipping = subtotal > 2000 ? 0 : 150;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate and apply coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const res = await api.coupons.validate(couponCode.trim(), subtotal);
      if (res?.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        toast.success(`Coupon "${res.coupon.code}" applied! You saved ₹${res.coupon.discountAmount}`);
      } else {
        toast.error('Invalid coupon code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  // Proceed to payment after selecting or entering address
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (isAddingNewAddress || savedAddresses.length === 0) {
      if (!formData.firstName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
        toast.error('Please fill in all required address fields.');
        return;
      }

      // PIN code validation
      if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
        toast.error('Please enter a valid 6-digit Indian PIN code.');
        return;
      }

      // Save to server address book if checked
      if (saveAddressToBook) {
        try {
          const newAddr = (await api.addresses.create({
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.phone.trim(),
            address_line_1: formData.address.trim(),
            address_line_2: formData.address2.trim() || undefined,
            city: formData.city.trim(),
            state: formData.state.trim(),
            postal_code: formData.pincode.trim(),
            is_default: savedAddresses.length === 0
          })) as SavedAddress;
          if (newAddr && newAddr.id) {
            setSavedAddresses(prev => [newAddr, ...prev]);
            setSelectedAddressId(newAddr.id);
            setIsAddingNewAddress(false);
          }
        } catch {
          // If unauthenticated or save fails, proceed with form data
        }
      }
    }

    setStep(2);
    window.scrollTo(0, 0);
  };

  // Dynamically load Razorpay SDK
  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Complete Order Placement Flow
  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      // 1. Resolve selected address object
      let selectedAddrObj: any = null;
      if (selectedAddressId && !isAddingNewAddress) {
        const addr = savedAddresses.find(a => a.id === selectedAddressId);
        if (addr) {
          selectedAddrObj = {
            first_name: addr.full_name.split(' ')[0],
            last_name: addr.full_name.split(' ').slice(1).join(' '),
            phone: addr.phone,
            address: addr.address_line_1,
            address2: addr.address_line_2,
            city: addr.city,
            state: addr.state,
            pincode: addr.postal_code,
            country: 'India'
          };
        }
      }

      if (!selectedAddrObj) {
        selectedAddrObj = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India'
        };
      }

      // Format items payload
      const orderItemsPayload = cartItems.map(item => ({
        product_id: item.id,
        name: item.name,
        qty: item.quantity,
        price: item.price,
        size: item.selectedSize || 'Regular',
        color: item.selectedColor || null
      }));

      // If Razorpay Online selected
      if (paymentMethod === 'razorpay') {
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          toast.error('Razorpay SDK failed to load. Please check your internet connection or use COD.');
          setIsProcessing(false);
          return;
        }

        // Call backend to create Razorpay Order
        const rzpOrder = await api.payments.createRazorpayOrder(total, `rcpt_${Date.now()}`);

        if (rzpOrder.isSimulated) {
          // Dev / Test simulation mode
          const createRes = await api.orders.create({
            orderItems: orderItemsPayload,
            address: selectedAddrObj,
            paymentMethod: 'Razorpay',
            taxPrice: 0,
            shippingPrice: shipping,
            discountAmount,
            couponCode: appliedCoupon?.code,
            totalAmount: total
          });

          await api.payments.verifyPayment({
            order_id: createRes.order.id,
            isSimulated: true
          });

          setPlacedOrder(createRes.order);
          await clearCart();
          setStep(3);
          toast.success(`Order placed successfully! Tracking #${createRes.order.tracking_number}`);
          return;
        }

        // Production Razorpay modal
        const options = {
          key: rzpOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'Aanya Fashion',
          description: `Order Payment for ${cartItems.length} items`,
          order_id: rzpOrder.id,
          prefill: {
            name: `${selectedAddrObj.first_name} ${selectedAddrObj.last_name}`,
            email: formData.email,
            contact: selectedAddrObj.phone
          },
          theme: { color: '#698156' },
          handler: async (response: any) => {
            try {
              // 1. Create order on server
              const createRes = await api.orders.create({
                orderItems: orderItemsPayload,
                address: selectedAddrObj,
                paymentMethod: 'Razorpay',
                taxPrice: 0,
                shippingPrice: shipping,
                discountAmount,
                couponCode: appliedCoupon?.code,
                totalAmount: total
              });

              // 2. Authoritatively verify signature
              await api.payments.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: createRes.order.id
              });

              setPlacedOrder(createRes.order);
              await clearCart();
              setStep(3);
              toast.success(`Payment verified! Order #${createRes.order.order_number}`);
            } catch (err: any) {
              toast.error(err.message || 'Payment verification failed');
            }
          }
        };

        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.open();
        setIsProcessing(false);
        return;
      }

      // COD Flow
      const createRes = await api.orders.create({
        orderItems: orderItemsPayload,
        address: selectedAddrObj,
        paymentMethod: 'COD',
        taxPrice: 0,
        shippingPrice: shipping,
        discountAmount,
        couponCode: appliedCoupon?.code,
        totalAmount: total
      });

      setPlacedOrder(createRes.order);
      await clearCart();
      setStep(3);
      toast.success(`Order placed successfully! Tracking #${createRes.order.tracking_number}`);
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#698156]"></div>
      </div>
    );
  }

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-[#F9FAF7]">
        <AnnouncementBar />
        <Navigation />
        <div className="pt-24 pb-20 px-4 text-center max-w-md mx-auto">
          <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-serif mb-2 text-gray-900">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="inline-block bg-[#698156] text-white px-8 py-3.5 rounded-full font-medium hover:bg-[#546944] shadow-md transition-all">
            Explore Collection
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      <AnnouncementBar />
      <Navigation />

      <div className="pt-20 sm:pt-24 lg:pt-8 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 3 ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto text-center py-16 bg-white rounded-3xl shadow-sm px-8 border border-gray-100"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] mb-3">Order Confirmed!</h1>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  Thank you for shopping with Aanya Fashion. Your order has been registered in our database.
                </p>

                {placedOrder && (
                  <div className="bg-[#F9FAF7] p-5 rounded-2xl mb-8 text-left space-y-2 border border-gray-200/60">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Order Number:</span>
                      <span className="font-mono font-semibold text-gray-900">{placedOrder.order_number || placedOrder.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Tracking Number:</span>
                      <span className="font-mono font-bold text-[#698156]">{placedOrder.tracking_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Payment Method:</span>
                      <span className="font-medium text-gray-900">{placedOrder.payment_method}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                      <span className="text-gray-700 font-semibold">Total Amount:</span>
                      <span className="font-serif text-lg font-bold text-[#698156]">₹{Number(placedOrder.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/orders')}
                    className="px-8 py-3.5 bg-[#698156] text-white rounded-full font-medium shadow-md hover:bg-[#546944] transition-all"
                  >
                    Track Live Status
                  </button>
                  <Link
                    to="/"
                    className="px-8 py-3.5 bg-white border border-gray-300 text-gray-800 rounded-full font-medium hover:bg-gray-50 transition-all"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12"
              >
                {/* Main Left Section */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    {step === 2 && (
                      <button
                        onClick={() => setStep(1)}
                        className="p-2 hover:bg-gray-200/60 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                    )}
                    <h1 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A]">
                      {step === 1 ? '1. Delivery Address' : '2. Payment Method'}
                    </h1>
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                    {step === 1 ? (
                      <div className="space-y-6">
                        {/* Saved Addresses List */}
                        {savedAddresses.length > 0 && !isAddingNewAddress && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Select Delivery Address
                              </h3>
                              <button
                                onClick={() => setIsAddingNewAddress(true)}
                                className="text-xs font-semibold text-[#698156] hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add New Address
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {savedAddresses.map((addr) => (
                                <div
                                  key={addr.id}
                                  onClick={() => setSelectedAddressId(addr.id)}
                                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                    selectedAddressId === addr.id
                                      ? 'border-[#698156] bg-[#F4F6F2]/40'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="mt-1">
                                    <div
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        selectedAddressId === addr.id ? 'border-[#698156]' : 'border-gray-300'
                                      }`}
                                    >
                                      {selectedAddressId === addr.id && (
                                        <div className="w-2.5 h-2.5 bg-[#698156] rounded-full" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">{addr.full_name}</span>
                                      {addr.is_default && (
                                        <span className="text-[10px] uppercase font-bold bg-[#698156]/15 text-[#698156] px-2 py-0.5 rounded-full">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {addr.address_line_1}
                                      {addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {addr.city}, {addr.state} - {addr.postal_code}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 font-mono">Mobile: {addr.phone}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => {
                                setStep(2);
                                window.scrollTo(0, 0);
                              }}
                              className="w-full py-4 mt-4 bg-[#698156] text-white rounded-full font-medium hover:bg-[#546944] shadow-md transition-all"
                            >
                              Deliver to this Address
                            </button>
                          </div>
                        )}

                        {/* Add New Address Form */}
                        {(isAddingNewAddress || savedAddresses.length === 0) && (
                          <form onSubmit={handleProceedToPayment} className="space-y-5">
                            {savedAddresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setIsAddingNewAddress(false)}
                                className="text-xs text-gray-500 hover:text-gray-800 underline mb-2 block"
                              >
                                &larr; Back to saved addresses
                              </button>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                  First Name *
                                </label>
                                <input
                                  required
                                  type="text"
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                  placeholder="Aanya"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                  Last Name *
                                </label>
                                <input
                                  required
                                  type="text"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                  placeholder="Sharma"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                  Email Address *
                                </label>
                                <input
                                  required
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                  placeholder="aanya@example.com"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                  Mobile Phone (10 digits) *
                                </label>
                                <input
                                  required
                                  type="tel"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                  placeholder="9876543210"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Street Address / Flat No. *
                              </label>
                              <input
                                required
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                placeholder="House/Flat No., Building Name, Street"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Landmark / Area (Optional)
                              </label>
                              <input
                                type="text"
                                name="address2"
                                value={formData.address2}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                placeholder="Near City Mall, Sector 4"
                              />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                  PIN Code *
                                </label>
                                <input
                                  required
                                  type="text"
                                  name="pincode"
                                  value={formData.pincode}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                  placeholder="400001"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                  City *
                                </label>
                                <input
                                  required
                                  type="text"
                                  name="city"
                                  value={formData.city}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                  placeholder="Mumbai"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                  State *
                                </label>
                                <input
                                  required
                                  type="text"
                                  name="state"
                                  value={formData.state}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#698156] text-sm"
                                  placeholder="Maharashtra"
                                />
                              </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 pt-2">
                              <input
                                type="checkbox"
                                checked={saveAddressToBook}
                                onChange={(e) => setSaveAddressToBook(e.target.checked)}
                                className="rounded text-[#698156] focus:ring-[#698156]"
                              />
                              <span>Save this address to my account address book</span>
                            </label>

                            <button
                              type="submit"
                              className="w-full py-4 bg-[#698156] text-white rounded-full font-medium hover:bg-[#546944] shadow-md transition-all mt-4"
                            >
                              Proceed to Payment
                            </button>
                          </form>
                        )}
                      </div>
                    ) : (
                      /* Step 2: Payment Selection */
                      <div className="space-y-6">
                        <div className="space-y-3">
                          {/* Razorpay Online Option */}
                          <label
                            className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                              paymentMethod === 'razorpay'
                                ? 'border-[#698156] bg-[#F4F6F2]/40'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value="razorpay"
                              checked={paymentMethod === 'razorpay'}
                              onChange={() => setPaymentMethod('razorpay')}
                              className="hidden"
                            />
                            <Wallet className="w-6 h-6 text-blue-600 mr-4 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 text-sm">
                                  Online Payment (Razorpay Secure)
                                </h4>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Fastest
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                UPI (GPay, PhonePe, Paytm), Credit/Debit Cards & Netbanking
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[11px] font-medium text-gray-700">UPI</span>
                                <span className="text-[11px] font-medium text-gray-700">Cards</span>
                                <span className="text-[11px] font-medium text-gray-700">NetBanking</span>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                paymentMethod === 'razorpay' ? 'border-[#698156]' : 'border-gray-300'
                              }`}
                            >
                              {paymentMethod === 'razorpay' && (
                                <div className="w-2.5 h-2.5 bg-[#698156] rounded-full" />
                              )}
                            </div>
                          </label>

                          {/* COD Option */}
                          <label
                            className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                              paymentMethod === 'cod'
                                ? 'border-[#698156] bg-[#F4F6F2]/40'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value="cod"
                              checked={paymentMethod === 'cod'}
                              onChange={() => setPaymentMethod('cod')}
                              className="hidden"
                            />
                            <Truck className="w-6 h-6 text-orange-600 mr-4 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm">Cash on Delivery (COD)</h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Pay upon delivery at your doorstep
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                paymentMethod === 'cod' ? 'border-[#698156]' : 'border-gray-300'
                              }`}
                            >
                              {paymentMethod === 'cod' && (
                                <div className="w-2.5 h-2.5 bg-[#698156] rounded-full" />
                              )}
                            </div>
                          </label>
                        </div>

                        <button
                          disabled={isProcessing}
                          onClick={handlePlaceOrder}
                          className={`w-full py-4 bg-[#698156] text-white rounded-full font-medium shadow-lg flex items-center justify-center gap-2 hover:bg-[#546944] transition-all ${
                            isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          <ShieldCheck className="w-5 h-5" />
                          {isProcessing
                            ? 'Securing & Processing Order...'
                            : paymentMethod === 'cod'
                            ? `Place COD Order • ₹${total.toLocaleString('en-IN')}`
                            : `Pay Online • ₹${total.toLocaleString('en-IN')}`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Order Summary & Coupon */}
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-28 space-y-6">
                    <h3 className="font-serif text-xl text-gray-900">Order Summary</h3>

                    {/* Cart Items List */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex gap-3 items-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-14 object-cover rounded-lg flex-shrink-0"
                            />
                            <div>
                              <p className="text-gray-900 font-medium text-xs line-clamp-1 w-36">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Qty: {item.quantity} {item.selectedSize ? `• ${item.selectedSize}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-900">
                            ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Coupon Input */}
                    <div className="border-t border-gray-100 pt-4">
                      {appliedCoupon ? (
                        <div className="bg-green-50 border border-green-200/80 rounded-xl p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-green-600" />
                            <div>
                              <span className="font-mono text-xs font-bold text-green-800">
                                {appliedCoupon.code}
                              </span>
                              <p className="text-[10px] text-green-700">
                                Discount applied: ₹{appliedCoupon.discountAmount}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Coupon code (e.g. AANYA15)"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs uppercase outline-none focus:border-[#698156]"
                          />
                          <button
                            type="submit"
                            disabled={couponLoading || !couponCode.trim()}
                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
                          >
                            {couponLoading ? '...' : 'Apply'}
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2.5 text-xs text-gray-600 border-t border-gray-100 pt-4">
                      <div className="flex justify-between">
                        <span>Bag Subtotal</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-green-700 font-medium">
                          <span>Coupon Discount</span>
                          <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping Fee</span>
                        <span>{shipping === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `₹${shipping}`}</span>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-gray-900">Total Payable</span>
                        <span className="text-2xl font-serif font-bold text-[#698156]">
                          ₹{total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </div>
  );
}