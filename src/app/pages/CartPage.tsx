import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Shield } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';

export function CartPage() {
  const { cartItems, updateQuantity, removeItem, isLoading } = useCart();

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18); // 18% GST simulation
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <AnnouncementBar />
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1A1A] mb-4">Your Shopping Cart</h1>
            <p className="text-gray-600">Review your items and proceed to checkout</p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-serif text-gray-800 mb-4">Your cart is empty</h2>
              <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-[#D4AF37] text-white rounded-full font-medium"
                >
                  Continue Shopping
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center border border-gray-100"
                    >
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow flex items-center justify-between min-w-0">
                        <div className="space-y-1 min-w-0 pr-4">
                          <Link to={`/product/${item.id}`}>
                            <h3 className="font-serif text-base text-gray-900 hover:text-[#D4AF37] transition-colors truncate">
                              {item.name}
                            </h3>
                          </Link>
                          <div className="text-sm font-bold text-[#D4AF37]">
                            ₹{item.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm sticky top-32">
                  <h3 className="font-serif text-2xl text-[#1A1A1A] mb-6">Order Summary</h3>
                  
                  <div className="space-y-4 mb-6 text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium text-[#1A1A1A]">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-medium text-[#1A1A1A]">
                        {shipping === 0 ? 'Free' : `₹${shipping}`}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-xs text-[#D4AF37]">
                        Add items worth ₹{(2000 - subtotal).toLocaleString('en-IN')} more for free shipping!
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-6 mb-8">
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-medium text-[#1A1A1A]">Total</span>
                      <div className="text-right">
                        <span className="text-3xl font-serif text-[#D4AF37]">₹{total.toLocaleString('en-IN')}</span>
                        <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/checkout" className="block w-full">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center gap-2 font-medium hover:bg-black transition-colors shadow-lg hover:shadow-xl"
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </Link>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      Secure checkout powered by Razorpay
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}