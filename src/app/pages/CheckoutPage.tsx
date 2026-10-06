import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router';
import { CheckCircle2, CreditCard, Wallet, Landmark, Truck, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { ProfileModal } from '../components/ProfileModal';
import { isUserProfileComplete, getUserProfileDetails, UserProfileDetails } from '../../lib/userProfile';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart, isLoading } = useCart();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null); // Added orderId state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    try {
      const prof = getUserProfileDetails();
      if (prof.name || prof.phone || prof.address) {
        const parts = (prof.name || '').split(' ');
        setFormData(prev => ({
          ...prev,
          firstName: prev.firstName || parts[0] || '',
          lastName: prev.lastName || parts.slice(1).join(' ') || '',
          email: prev.email || prof.email || '',
          phone: prev.phone || prof.phone || '',
          address: prev.address || prof.address || '',
        }));
      }
    } catch (e) {}

    supabase.auth.getUser().then((res: any) => {
      const user = res?.data?.user;
      if (user) {
        setFormData(prev => ({
          ...prev,
          email: prev.email || user.email || '',
          phone: prev.phone || user.phone || user.user_metadata?.phone || '',
          firstName: prev.firstName || user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || '',
          lastName: prev.lastName || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.last_name || '',
        }));
      }
    });
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const shipping = subtotal > 2000 ? 0 : 150;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!isUserProfileComplete()) {
      setShowProfileModal(true);
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleProfileSaveSuccess = (details: UserProfileDetails) => {
    const parts = (details.name || '').split(' ');
    setFormData(prev => ({
      ...prev,
      firstName: parts[0] || prev.firstName,
      lastName: parts.slice(1).join(' ') || prev.lastName,
      email: details.email || prev.email,
      phone: details.phone || prev.phone,
      address: details.address || prev.address,
    }));

    if (step === 2) {
      handlePlaceOrder(details);
    } else {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handlePlaceOrder = async (overriddenDetails?: UserProfileDetails) => {
    if (!overriddenDetails && !isUserProfileComplete()) {
      setShowProfileModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } catch (e) {
        console.warn('Auth check skipped:', e);
      }

      const activeFirstName = overriddenDetails
        ? (overriddenDetails.name || '').split(' ')[0]
        : formData.firstName;
      const activeLastName = overriddenDetails
        ? (overriddenDetails.name || '').split(' ').slice(1).join(' ')
        : formData.lastName;
      const activeEmail = overriddenDetails?.email || formData.email;
      const activePhone = overriddenDetails?.phone || formData.phone;
      const activeAddress = overriddenDetails?.address || formData.address;

      // 1. Generate unique Order ID & Tracking Number
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const trackingNumber = `AANYA-${datePart}-${randomSuffix}`;
      const generatedOrderId = 'ord_' + Math.random().toString(36).substring(2, 10);

      const orderPayload = {
        id: generatedOrderId,
        user_id: user?.id || null,
        total_amount: total,
        total_price: total,
        status: 'Pending',
        payment_method: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'cod' ? 'COD' : 'Card',
        payment_status: paymentMethod === 'cod' ? 'Pending' : 'Success',
        shipping_address: {
          first_name: activeFirstName,
          last_name: activeLastName,
          email: activeEmail,
          phone: activePhone,
          address: activeAddress,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          tracking_number: trackingNumber,
        }
      };

      // 2. Insert to Supabase orders table
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderError) {
        console.error('Supabase Order Insert Error:', orderError);
        // Fallback without user_id if profile foreign key is not present
        delete (orderPayload as any).user_id;
        const { error: retryError } = await supabase
          .from('orders')
          .insert([orderPayload]);
        if (retryError) {
          throw retryError;
        }
      }

      // 3. Insert order items & deduct stock
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const effectiveOrderId = order?.id || generatedOrderId;
      const orderItemsData = cartItems.map(item => ({
        order_id: effectiveOrderId,
        product_id: uuidRegex.test(item.id) ? item.id : null,
        quantity: item.quantity,
        price_at_time: item.price,
        total_price: (item.price || 0) * item.quantity
      }));
      await supabase.from('order_items').insert(orderItemsData);

      // Decrement stock in database for each ordered product
      for (const item of cartItems) {
        if (uuidRegex.test(item.id)) {
          const { data: prod } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.id)
            .single();
          if (prod && prod.stock_quantity != null) {
            const nextStock = Math.max(0, prod.stock_quantity - item.quantity);
            await supabase
              .from('products')
              .update({ stock_quantity: nextStock })
              .eq('id', item.id);
          }
        }
      }

      toast.success(`Order placed successfully! Tracking #${trackingNumber}`);
      window.dispatchEvent(new Event('orders_updated'));

      // 4. Clear the cart
      await clearCart();
      
      // Navigate to orders page directly
      navigate('/orders');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
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
        <div className="pt-20 sm:pt-24 lg:pt-6 pb-20 px-4 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-serif mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">Thank you for your purchase. We'll send you an email confirmation shortly.</p>
          <Link to="/" className="inline-block bg-[#698156] text-white px-6 py-3 rounded-full hover:bg-[#546944]">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnnouncementBar />
      <Navigation />

      <div className="pt-20 sm:pt-24 lg:pt-6 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 3 ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto text-center py-20 bg-white rounded-3xl shadow-sm px-6"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="font-serif text-4xl text-[#1A1A1A] mb-4">Order Placed Successfully!</h1>
                <p className="text-gray-600 mb-8">Thank you for shopping with us. Your order #{orderId?.slice(0, 8).toUpperCase()} has been placed and will be delivered soon.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/orders" className="px-8 py-4 bg-[#698156] text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
                    Track My Order
                  </Link>
                  <Link to="/" className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-all">
                    Continue Shopping
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="checkout" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-4 mb-8">
                    {step === 2 && (
                      <button onClick={() => setStep(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    )}
                    <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A]">
                      {step === 1 ? 'Shipping Address' : 'Payment Method'}
                    </h1>
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm">
                    {step === 1 ? (
                      <form onSubmit={handleProceedToPayment} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                            <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none" placeholder="Jane" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                            <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none" placeholder="Doe" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                            <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none" placeholder="jane.doe@example.com" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                            <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none" placeholder="+91 98765 43210" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Complete Address *</label>
                          <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none" placeholder="House/Flat No., Street, Landmark" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                           <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code *</label>
                            <input required type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none" placeholder="400001" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                            <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none" placeholder="City" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                            <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none" placeholder="State" />
                          </div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-[#698156] text-white rounded-full font-medium hover:bg-[#546944] shadow-lg">
                          Proceed to Payment
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-[#698156] bg-[#F4F6F2]/30' : 'border-gray-200'}`}>
                            <input type="radio" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                            <Wallet className="w-6 h-6 text-blue-600 mr-4" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">UPI (GPay, PhonePe, Paytm)</h4>
                              <div className="flex gap-2 mt-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-4 object-contain" alt="UPI" />
                                <img src="https://cdn.simpleicons.org/googlepay" className="h-4 object-contain" alt="GPay" />
                                <img src="https://cdn.simpleicons.org/phonepe/5F259F" className="h-4 object-contain" alt="PhonePe" />
                                <img src="https://cdn.simpleicons.org/paytm/00B9F5" className="h-3 object-contain" alt="Paytm" />
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'upi' ? 'border-[#698156]' : 'border-gray-300'}`}>
                              {paymentMethod === 'upi' && <div className="w-3 h-3 bg-[#698156] rounded-full" />}
                            </div>
                          </label>
                          <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#698156] bg-[#F4F6F2]/30' : 'border-gray-200'}`}>
                            <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                            <Truck className="w-6 h-6 text-orange-600 mr-4" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Cash on Delivery</h4>
                              <p className="text-xs text-gray-500 mt-1">Pay via Cash or UPI at your doorstep</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#698156]' : 'border-gray-300'}`}>
                              {paymentMethod === 'cod' && <div className="w-3 h-3 bg-[#698156] rounded-full" />}
                            </div>
                          </label>
                          <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'netbanking' ? 'border-[#698156] bg-[#F4F6F2]/30' : 'border-gray-200'}`}>
                            <input type="radio" value="netbanking" checked={paymentMethod === 'netbanking'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                            <Landmark className="w-6 h-6 text-green-600 mr-4" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Net Banking & Cards</h4>
                              <div className="flex gap-2 mt-2">
                                <img src="https://cdn.simpleicons.org/visa/1434CB" className="h-3 object-contain" alt="Visa" />
                                <img src="https://cdn.simpleicons.org/mastercard" className="h-4 object-contain" alt="Mastercard" />
                                <img src="/payment-logos/rupay.png" className="h-4 object-contain" alt="RuPay" />
                                <span className="text-[10px] text-gray-500 font-bold ml-1 border-l pl-2 border-gray-300">50+ Banks</span>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'netbanking' ? 'border-[#698156]' : 'border-gray-300'}`}>
                              {paymentMethod === 'netbanking' && <div className="w-3 h-3 bg-[#698156] rounded-full" />}
                            </div>
                          </label>
                        </div>
                        <button 
                          disabled={isProcessing}
                          onClick={() => handlePlaceOrder()} 
                          className={`w-full py-4 bg-[#698156] text-white rounded-full font-medium shadow-lg flex items-center justify-center gap-2 ${isProcessing ? 'opacity-50' : ''}`}
                        >
                          <ShieldCheck className="w-5 h-5" />
                          {isProcessing ? 'Processing...' : `Pay ₹${total.toLocaleString('en-IN')} & Place Order`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-3xl shadow-sm sticky top-32">
                    <h3 className="font-serif text-xl mb-6">Order Details</h3>
                    <div className="space-y-4 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <div className="flex gap-3 items-center">
                            <img src={item.image} alt={item.name} className="w-12 h-16 object-cover rounded-lg" />
                            <div>
                              <p className="text-[#1A1A1A] font-medium text-sm truncate w-32">{item.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium">₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 mb-6 text-sm text-gray-600 border-t border-gray-100 pt-4">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-medium">Total Payable</span>
                        <span className="text-2xl font-serif text-[#698156]">₹{total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Profile completion modal when placing order */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSaveSuccess={handleProfileSaveSuccess}
        title="My Profile"
        subtitle="Please enter your profile information to continue"
        actionButtonText="Save & Continue to Order"
      />

      <Footer />
    </div>
  );
}