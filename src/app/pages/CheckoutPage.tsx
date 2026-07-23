import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router';
import { CheckCircle2, CreditCard, Wallet, Landmark, Truck, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart, isLoading } = useCart();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null); // Added orderId state
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

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const shipping = subtotal > 2000 ? 0 : 150;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to place an order');
        return;
      }

      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'Pending',
          payment_method: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'cod' ? 'COD' : 'Card',
          payment_status: paymentMethod === 'cod' ? 'Pending' : 'Success',
          shipping_address: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItemsData = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // 3. Create a payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          order_id: order.id,
          method: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'cod' ? 'COD' : 'Net Banking',
          status: paymentMethod === 'cod' ? 'Pending' : 'Completed',
          amount: total
        });

      if (paymentError) throw paymentError;

      // 4. Clear the cart
      await clearCart();
      
      setOrderId(order.id); // Set the order ID
      setStep(3);
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <AnnouncementBar />
        <Navigation />
        <div className="pt-40 pb-20 px-4 text-center">
          <h2 className="text-2xl font-serif mb-6">Your cart is empty</h2>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-[#D4AF37] text-white rounded-full">
            Start Shopping
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <AnnouncementBar />
      <Navigation />

      <div className="pt-32 pb-20 px-4">
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
                  <Link to="/orders" className="px-8 py-4 bg-[#1A1A1A] text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
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
                        <button type="submit" className="w-full py-4 bg-[#1A1A1A] text-white rounded-full font-medium hover:bg-black shadow-lg">
                          Proceed to Payment
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-[#D4AF37] bg-[#FFF0F5]/30' : 'border-gray-200'}`}>
                            <input type="radio" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                            <Wallet className="w-6 h-6 text-blue-600 mr-4" />
                            <div className="flex-1">
                              <h4 className="font-medium">UPI (GPay, PhonePe, Paytm)</h4>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'upi' ? 'border-[#D4AF37]' : 'border-gray-300'}`}>
                              {paymentMethod === 'upi' && <div className="w-3 h-3 bg-[#D4AF37] rounded-full" />}
                            </div>
                          </label>
                          <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#D4AF37] bg-[#FFF0F5]/30' : 'border-gray-200'}`}>
                            <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                            <Truck className="w-6 h-6 text-orange-600 mr-4" />
                            <div className="flex-1">
                              <h4 className="font-medium">Cash on Delivery</h4>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#D4AF37]' : 'border-gray-300'}`}>
                              {paymentMethod === 'cod' && <div className="w-3 h-3 bg-[#D4AF37] rounded-full" />}
                            </div>
                          </label>
                          <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'netbanking' ? 'border-[#D4AF37] bg-[#FFF0F5]/30' : 'border-gray-200'}`}>
                            <input type="radio" value="netbanking" checked={paymentMethod === 'netbanking'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                            <Landmark className="w-6 h-6 text-green-600 mr-4" />
                            <div className="flex-1">
                              <h4 className="font-medium">Net Banking (All Major Banks)</h4>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'netbanking' ? 'border-[#D4AF37]' : 'border-gray-300'}`}>
                              {paymentMethod === 'netbanking' && <div className="w-3 h-3 bg-[#D4AF37] rounded-full" />}
                            </div>
                          </label>
                        </div>
                        <button 
                          disabled={isProcessing}
                          onClick={handlePlaceOrder} 
                          className={`w-full py-4 bg-[#D4AF37] text-white rounded-full font-medium shadow-lg flex items-center justify-center gap-2 ${isProcessing ? 'opacity-50' : ''}`}
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
                        <span className="text-2xl font-serif text-[#D4AF37]">₹{total.toLocaleString('en-IN')}</span>
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