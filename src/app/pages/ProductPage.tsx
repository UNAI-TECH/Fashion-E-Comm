import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { Star, Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, ZoomIn, CreditCard, CheckCircle2, Loader2, DollarSign, MapPin } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { fetchProducts, Product } from '../data/products';
import { toast } from 'sonner';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'none' | 'online' | 'cash' | 'success'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderReference, setOrderReference] = useState<{ id: string; method: string; total: number } | null>(null);

  const [orderForm, setOrderForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    cardNumber: '',
    cardHolder: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderForm({ ...orderForm, [e.target.name]: e.target.value });
  };

  const handleCreateOrder = async (paymentType: 'Card' | 'COD') => {
    if (!product) return;
    if (!orderForm.fullName || !orderForm.phone || !orderForm.address || !orderForm.city || !orderForm.pincode) {
      toast.error('Please fill in all shipping address fields');
      return;
    }
    if (paymentType === 'Card' && (!orderForm.cardNumber || !orderForm.cardHolder)) {
      toast.error('Please enter Cardholder Name and Card Number');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const totalAmount = (product.price || 0) * quantity;
      const shippingDetails = {
        full_name: orderForm.fullName,
        phone: orderForm.phone,
        address: orderForm.address,
        city: orderForm.city,
        pincode: orderForm.pincode,
        card_holder: orderForm.cardHolder || undefined,
        card_number: orderForm.cardNumber ? `•••• •••• •••• ${orderForm.cardNumber.slice(-4)}` : undefined,
      };

      const orderPayload = {
        status: 'Pending',
        payment_method: paymentType === 'Card' ? 'Card' : 'COD',
        payment_status: paymentType === 'Card' ? 'Success' : 'Pending',
        total_amount: totalAmount,
        shipping_address: shippingDetails,
        ...(user?.id ? { user_id: user.id } : {})
      };

      // 1. Create order in Supabase Table Editor using supabaseAdmin (service_role)
      let finalOrder: any = null;
      const { data: createdOrders, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert([orderPayload])
        .select();

      if (orderError) {
        console.error('Supabase Orders Insert Error:', orderError);
        // Retry without user_id if profile is unlinked
        delete orderPayload.user_id;
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from('orders')
          .insert([orderPayload])
          .select();

        if (retryError) {
          console.error('Supabase Admin Insert Retry Error:', retryError);
          toast.error('Supabase Error: ' + retryError.message);
        } else {
          finalOrder = retryData?.[0];
          console.log('Supabase Admin Insert Success:', retryData);
          toast.success(
            paymentType === 'Card'
              ? 'Online Order Placed & Saved to Supabase Table Editor!'
              : 'Cash Order Booked & Saved to Supabase Table Editor!'
          );
        }
      } else {
        finalOrder = createdOrders?.[0];
        console.log('Supabase Orders Insert Success:', createdOrders);
        toast.success(
          paymentType === 'Card'
            ? 'Online Order Placed & Saved to Supabase Table Editor!'
            : 'Cash Order Booked & Saved to Supabase Table Editor!'
        );
      }

      // 2. Always persist order to local storage cache so My Orders icon immediately shows all booked orders
      const orderRecord = {
        id: finalOrder?.id || ('ord_' + Math.random().toString(36).substring(2, 9)),
        created_at: finalOrder?.created_at || new Date().toISOString(),
        status: 'Pending',
        payment_method: paymentType === 'Card' ? 'Card' : 'COD',
        payment_status: paymentType === 'Card' ? 'Success' : 'Pending',
        total_amount: totalAmount,
        total_price: totalAmount,
        shipping_address: shippingDetails,
        order_items: [
          {
            quantity: quantity,
            price: product.price,
            products: {
              name: product.name,
              images: (product.images && product.images.length > 0) ? product.images : [product.image],
            }
          }
        ]
      };

      try {
        const existing = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
        localStorage.setItem('local_placed_orders', JSON.stringify([orderRecord, ...existing]));
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }

      // Close modal box automatically
      setIsBuyNowModalOpen(false);
      setCheckoutMethod('none');
    } catch (err: any) {
      console.error('Order creation handler error:', err);
      toast.error('Order Error: ' + (err.message || 'Check Supabase connection'));
      setIsBuyNowModalOpen(false);
      setCheckoutMethod('none');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          const itemImages = (data.images && data.images.length > 0) 
            ? data.images 
            : (data.image_url ? [data.image_url] : ['https://images.unsplash.com/photo-1604176354204-926873ff34b0?q=80&w=1000&auto=format&fit=crop']);
            
          setProduct({
            ...data,
            image: itemImages[0],
            images: itemImages,
            colors: data.colors || ['#D4AF37'],
            rating: data.rating || 4.5,
          });
        } else {
          throw new Error('No data found');
        }
      } catch (error) {
        console.error('Error loading product from DB, falling back to mock data:', error);
        try {
          const allProducts = await fetchProducts();
          const mockProduct = allProducts.find(p => p.id === id);
          if (mockProduct) {
            setProduct(mockProduct);
          } else {
            toast.error('Product not found');
          }
        } catch (fallbackError) {
          console.error('Error in mock fallback:', fallbackError);
          toast.error('Product not found');
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || product.compare_at_price,
        image: product.image,
        rating: product.rating,
        colors: product.colors
      } as any);
      toast.success(`${product.name} added to your Cart!`);
    }
  };

  const handleWishlistToggle = async () => {
    if (product) {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    }
  };

  const handleBuyNow = () => {
    if (product) {
      setIsBuyNowModalOpen(true);
      setCheckoutMethod('none');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <AnnouncementBar />
        <Navigation />
        <div className="pt-40 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <AnnouncementBar />
        <Navigation />
        <div className="pt-40 text-center">
          <h1 className="text-2xl font-serif">Product not found</h1>
          <Link to="/" className="text-[#D4AF37] hover:underline mt-4 inline-block">Return to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navigation />

      <div className="pt-44 sm:pt-48 lg:pt-52 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8 text-gray-600">
            <Link to="/" className="hover:text-[#D4AF37]">Home</Link>
            <span>/</span>
            <Link to={`/category/${product.category.toLowerCase()}`} className="hover:text-[#D4AF37]">{product.category}</Link>
            <span>/</span>
            <span className="text-[#D4AF37] truncate">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="relative mb-4 border border-[#D4AF37] p-2 bg-white rounded-[2rem] aspect-square flex items-center justify-center overflow-hidden group shadow-md"
              >
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-contain rounded-[1.8rem]" 
                />
              </motion.div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-bold block mb-2">Aanya Fashions</span>
                <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] leading-tight">{product.name}</h1>
                <div className="w-16 h-px bg-[#D4AF37] my-4"></div>
              </div>

              {/* Blockquote Description */}
              <div className="border-l-2 border-[#D4AF37] pl-4 italic text-gray-700 text-lg my-6">
                "{product.description || 'Premium quality traditional wear crafted with elegance.'}"
              </div>

              {/* Standard Description Paragraph */}
              <p className="text-gray-500 leading-relaxed text-sm">
                This design fuses rich Indian textile traditions with modern silhouettes. Handcrafted using standard heritage drapes and premium weaves, this garment is curated to adapt perfectly to the modern posture. Every thread, bead, and seam is carefully supervised to represent pristine, sustainable luxury.
              </p>

              {/* Rating / Feedback */}
              <div className="flex items-center gap-4 text-sm text-gray-500 py-1">
                <div className="flex text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="font-medium text-xs tracking-wider uppercase text-gray-400">({product.rating} customer rating)</span>
              </div>

              {/* Signature / Brand info */}
              <div className="py-2 border-b border-gray-100">
                <h4 className="font-serif text-2xl text-[#1A1A1A] mb-0.5">Aanya Fashions</h4>
                <span className="text-[9px] tracking-[0.25em] text-[#D4AF37] font-bold block uppercase">Handcrafted Luxury Heritage</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 py-2 my-2">
                <span className="text-4xl text-[#D4AF37] font-serif">₹{product.price.toLocaleString('en-IN')}</span>
                {product.compare_at_price && (
                  <span className="text-2xl text-gray-400 line-through">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                )}
              </div>

              {/* Size Selector */}
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Select Size</span>
                  {selectedSize && (
                    <span className="text-xs font-bold text-[#800000] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                      Selected: {selectedSize}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => (
                    <motion.button
                      key={size}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 px-4 border text-xs font-black transition-all rounded-xl cursor-pointer ${
                        selectedSize === size
                          ? 'border-[#800000] bg-[#800000] text-white shadow-sm'
                          : 'border-gray-200 text-gray-800 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 py-2">
                <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Quantity</span>
                <div className="flex items-center border border-gray-300 h-11">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-full hover:bg-gray-50 flex items-center justify-center text-gray-500"> - </button>
                  <span className="w-11 text-center font-bold text-sm text-gray-800">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-11 h-full hover:bg-gray-50 flex items-center justify-center text-gray-500"> + </button>
                </div>
              </div>

              {/* Call To Action Buttons */}
              <div className="flex gap-4 pt-2">
                <motion.button 
                  onClick={handleAddToCart} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex-1 h-14 bg-[#FFF9E6] hover:bg-[#F5E6BE] text-[#800000] border-2 border-[#F5E6BE] rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#800000]" /> Add to Cart
                </motion.button>
              </div>

              <motion.button 
                onClick={handleBuyNow} 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                className="w-full h-14 bg-[#FFF0F5] hover:bg-[#FFE4E1] text-[#800000] border-2 border-rose-200 rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-[#800000]" /> Buy Now (Online or Cash)
              </motion.button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-[#D4AF37]" />
                  <span className="text-sm">Fast Shipping</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-6 h-6 text-[#D4AF37]" />
                  <span className="text-sm">Easy Returns</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-[#D4AF37]" />
                  <span className="text-sm">Authenticity Check</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Now Process Modal */}
      <AnimatePresence>
        {isBuyNowModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsBuyNowModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6 text-gray-500 hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {checkoutMethod === 'none' && (
                <div className="space-y-6 text-center pt-4">
                  <h3 className="font-serif text-3xl text-gray-900">Select Payment Method</h3>
                  <p className="text-gray-500 text-sm">Choose Online Payment (Card) or Cash on Delivery to book your order.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <button
                      onClick={() => setCheckoutMethod('online')}
                      className="p-6 border-2 border-gray-100 hover:border-[#800000] rounded-2xl flex flex-col items-center gap-3 transition-all group hover:bg-[#FFF0F5]/20 text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FFF0F5] text-[#800000] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <span className="font-black text-gray-900 text-base">Online Payment</span>
                      <span className="text-[11px] text-gray-500">Credit / Debit Card Details & Instant Order</span>
                    </button>

                    <button
                      onClick={() => setCheckoutMethod('cash')}
                      className="p-6 border-2 border-gray-100 hover:border-[#800000] rounded-2xl flex flex-col items-center gap-3 transition-all group hover:bg-[#FFF9F0]/30 text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FFF9F0] text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <span className="font-black text-gray-900 text-base">Cash on Delivery</span>
                      <span className="text-[11px] text-gray-500">Pay Cash upon Doorstep Delivery</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Online Payment (Card Details Form) */}
              {checkoutMethod === 'online' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <button 
                      onClick={() => setCheckoutMethod('none')}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div>
                      <h3 className="font-serif text-2xl text-gray-900">Online Card Payment</h3>
                      <p className="text-xs text-gray-500">Enter card & shipping details to place order</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {/* Shipping Address */}
                    <div className="bg-gray-50 p-3.5 rounded-2xl space-y-2.5 border border-gray-100">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#800000]" /> Shipping Address
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Full Name *"
                          value={orderForm.fullName}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                        />
                        <input
                          type="text"
                          name="phone"
                          placeholder="Phone Number *"
                          value={orderForm.phone}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                        />
                      </div>
                      <input
                        type="text"
                        name="address"
                        placeholder="Street Address / House No *"
                        value={orderForm.address}
                        onChange={handleInputChange}
                        className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          name="city"
                          placeholder="City *"
                          value={orderForm.city}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                        />
                        <input
                          type="text"
                          name="pincode"
                          placeholder="Pincode *"
                          value={orderForm.pincode}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                        />
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="bg-[#FFF0F5]/30 p-3.5 rounded-2xl space-y-2.5 border border-rose-100">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#800000]" /> Card Information
                      </p>
                      <input
                        type="text"
                        name="cardHolder"
                        placeholder="Cardholder Name *"
                        value={orderForm.cardHolder}
                        onChange={handleInputChange}
                        className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                      />
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="Card Number (16 Digits) *"
                        maxLength={19}
                        value={orderForm.cardNumber}
                        onChange={handleInputChange}
                        className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000] font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setCheckoutMethod('none')}
                      className="py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting}
                      onClick={() => handleCreateOrder('Card')}
                      className="flex-1 py-3.5 bg-gradient-to-r from-[#800000] via-[#990000] to-[#800000] hover:from-black hover:to-[#800000] text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-[#800000]/25 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                        </>
                      ) : (
                        <>
                          Book Order (Online Payment) <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Cash on Delivery Form */}
              {checkoutMethod === 'cash' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <button 
                      onClick={() => setCheckoutMethod('none')}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div>
                      <h3 className="font-serif text-2xl text-gray-900">Cash on Delivery Booking</h3>
                      <p className="text-xs text-gray-500">Enter delivery details to book your order</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="bg-[#FFF9F0] p-3 rounded-2xl border border-amber-200 flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-amber-900 font-medium">
                        Pay <span className="font-black text-[#800000]">₹{(product.price * quantity).toLocaleString()}</span> in cash when package arrives at your doorstep.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-2xl space-y-2.5 border border-gray-100">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#800000]" /> Delivery Contact & Address
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Full Name *"
                          value={orderForm.fullName}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                        />
                        <input
                          type="text"
                          name="phone"
                          placeholder="Phone Number *"
                          value={orderForm.phone}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                        />
                      </div>
                      <input
                        type="text"
                        name="address"
                        placeholder="Street Address / House No *"
                        value={orderForm.address}
                        onChange={handleInputChange}
                        className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          name="city"
                          placeholder="City *"
                          value={orderForm.city}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                        />
                        <input
                          type="text"
                          name="pincode"
                          placeholder="Pincode *"
                          value={orderForm.pincode}
                          onChange={handleInputChange}
                          className="w-full text-xs px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setCheckoutMethod('none')}
                      className="py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
                    >
                      Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting}
                      onClick={() => handleCreateOrder('COD')}
                      className="flex-1 py-3.5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-black hover:to-amber-900 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-amber-900/20 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Booking Order...
                        </>
                      ) : (
                        <>
                          Book Order (Cash on Delivery) <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Success View */}
              {checkoutMethod === 'success' && orderReference && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-serif text-3xl text-gray-900">Order Confirmed!</h3>
                    <p className="text-gray-500 text-xs mt-1">Thank you for your purchase. All order details are saved to Supabase.</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl text-left space-y-2 border border-gray-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order Ref:</span>
                      <span className="font-bold font-mono text-gray-900">#{orderReference.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Type:</span>
                      <span className="font-bold text-gray-900">{orderReference.method}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-sm">
                      <span className="text-gray-700">Total Amount:</span>
                      <span className="text-[#800000]">₹{orderReference.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsBuyNowModalOpen(false);
                        setCheckoutMethod('none');
                      }}
                      className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setIsBuyNowModalOpen(false);
                        navigate('/orders');
                      }}
                      className="flex-1 py-3 bg-[#800000] hover:bg-black text-white rounded-xl font-bold text-xs shadow-md"
                    >
                      View My Orders
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}