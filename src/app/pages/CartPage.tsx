import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Shield, Heart, CreditCard, Tag } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

export function CartPage() {
  const { cartItems, updateQuantity, removeItem, isLoading } = useCart();
  const { addToWishlist } = useWishlist();
  const navigate = useNavigate();

  // Price calculations
  const mrpTotal = cartItems.reduce((total, item) => {
    const mrp = item.compare_at_price || item.originalPrice || Math.round(item.price * 1.4);
    return total + mrp * item.quantity;
  }, 0);
  const sellingTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const discount = mrpTotal - sellingTotal;
  const platformFee = 0; // Free
  const deliveryFee = sellingTotal > 2000 ? 0 : 99;
  const totalAmount = sellingTotal + platformFee + deliveryFee;
  const youSave = discount + (deliveryFee === 0 ? 99 : 0);

  const handleMoveToWishlist = async (item: any) => {
    await addToWishlist(item);
    removeItem(item.id);
  };

  const handleBuyNow = (item: any) => {
    navigate(`/checkout?buyNow=${item.id}&qty=${item.quantity}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      <AnnouncementBar />
      <Navigation />
      
      <div className="pt-20 sm:pt-24 lg:pt-6 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] mb-2">Your Shopping Bag</h1>
            <p className="text-gray-500 text-sm">
              {cartItems.length > 0 
                ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your bag`
                : 'Your bag is empty'}
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-serif text-gray-800 mb-4">Your bag is empty</h2>
              <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-[#698156] text-white rounded-full font-medium"
                >
                  Continue Shopping
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence>
                  {cartItems.map((item) => {
                    const itemMrp = item.compare_at_price || item.originalPrice || Math.round(item.price * 1.4);
                    const itemDiscount = itemMrp - item.price;
                    const discountPercent = Math.round((itemDiscount / itemMrp) * 100);

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 sm:p-5 flex gap-4">
                          {/* Product Image */}
                          <Link to={`/product/${item.id}`} className="flex-shrink-0">
                            <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-gray-50">
                              <img
                                src={item.image || (item.images && item.images[0])}
                                alt={item.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          </Link>

                          {/* Product Details */}
                          <div className="flex-grow min-w-0 space-y-2">
                            <Link to={`/product/${item.id}`}>
                              <h3 className="font-serif text-sm sm:text-base text-gray-900 hover:text-[#698156] transition-colors line-clamp-2 leading-snug">
                                {item.name}
                              </h3>
                            </Link>
                            
                            <p className="text-xs text-gray-400 uppercase tracking-wider">{item.category || 'Sarees'}</p>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-base font-bold text-gray-900">₹{item.price.toLocaleString('en-IN')}</span>
                              {itemDiscount > 0 && (
                                <>
                                  <span className="text-sm text-gray-400 line-through">₹{itemMrp.toLocaleString('en-IN')}</span>
                                  <span className="text-xs font-bold text-orange-600">({discountPercent}% OFF)</span>
                                </>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">Qty:</span>
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-8">
                                <button 
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-8 h-full hover:bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-8 h-full hover:bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-xs text-gray-400 ml-1">
                                × ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="border-t border-gray-100 flex divide-x divide-gray-100">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="flex-1 py-2.5 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                          <button
                            onClick={() => handleMoveToWishlist(item)}
                            className="flex-1 py-2.5 text-xs font-semibold text-gray-500 hover:text-pink-600 hover:bg-pink-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Heart className="w-3.5 h-3.5" />
                            Move to Wishlist
                          </button>
                          <button
                            onClick={() => handleBuyNow(item)}
                            className="flex-1 py-2.5 text-xs font-semibold text-[#698156] hover:text-white hover:bg-[#698156] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Buy Now
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-32 border border-gray-100">
                  <h3 className="font-serif text-lg text-[#1A1A1A] mb-5 uppercase tracking-wider text-xs font-bold text-gray-500">
                    Price Details ({cartItems.length} Item{cartItems.length > 1 ? 's' : ''})
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

                    <div className="flex justify-between text-gray-600">
                      <span>Platform Fee</span>
                      <span className="font-medium text-emerald-600">FREE</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span className={`font-medium ${deliveryFee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                      </span>
                    </div>

                    {deliveryFee > 0 && (
                      <p className="text-xs text-[#698156] bg-[#F4F6F2] px-3 py-2 rounded-lg">
                        Add ₹{(2000 - sellingTotal).toLocaleString('en-IN')} more for free delivery!
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t border-dashed border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Total Amount</span>
                      <span className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {youSave > 0 && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">
                        You'll save ₹{youSave.toLocaleString('en-IN')} on this order
                      </span>
                    </div>
                  )}

                  <Link to="/checkout" className="block w-full mt-5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-[#698156] text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wider hover:bg-[#546944] transition-colors shadow-lg hover:shadow-xl"
                    >
                      Place Order
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-green-500" />
                      100% Secure Payments • Easy Returns
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