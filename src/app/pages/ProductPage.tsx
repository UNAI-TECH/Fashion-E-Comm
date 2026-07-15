import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { Star, Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase } from '../../lib/supabase';
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
  const [checkoutMethod, setCheckoutMethod] = useState<'none' | 'online' | 'offline'>('none');

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
      addToCart(product, quantity);
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

              {/* Quantity */}
              <div className="flex items-center gap-4 py-2">
                <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Quantity</span>
                <div className="flex items-center border border-gray-300 h-11">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-full hover:bg-gray-50 flex items-center justify-center text-gray-500"> - </button>
                  <span className="w-11 text-center font-bold text-sm text-gray-800">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-11 h-full hover:bg-gray-50 flex items-center justify-center text-gray-500"> + </button>
                </div>
              </div>

              {/* Buttons with Spotlight Style */}
              <div className="flex gap-4 pt-2">
                <motion.button 
                  onClick={handleAddToCart} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex-1 h-12 bg-white text-[#D4AF37] border border-[#D4AF37] font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2 hover:bg-[#D4AF37] hover:text-white transition-all duration-300"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </motion.button>
                <motion.button 
                  onClick={handleWishlistToggle} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  className={`w-12 h-12 border flex items-center justify-center transition-colors ${
                    isInWishlist(product.id) 
                      ? 'border-red-500 bg-red-50 text-red-500' 
                      : 'border-gray-200 text-gray-400 hover:border-[#D4AF37] hover:text-[#D4AF37] bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </motion.button>
              </div>

              <motion.button 
                onClick={handleBuyNow} 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                className="w-full h-12 bg-[#D4AF37] text-white border border-[#D4AF37] font-bold text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-[#D4AF37] transition-all duration-300 shadow-sm"
              >
                Buy Now
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
                  <h3 className="font-serif text-3xl text-gray-900">Select Checkout Option</h3>
                  <p className="text-gray-500 text-sm">Please choose how you would like to proceed with your purchase.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <button
                      onClick={() => setCheckoutMethod('online')}
                      className="p-6 border-2 border-gray-100 hover:border-[#D4AF37] rounded-2xl flex flex-col items-center gap-3 transition-all group hover:bg-[#FFF0F5]/10"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FFF0F5] text-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-gray-900">Online Payment</span>
                      <span className="text-[11px] text-gray-400">Pay securely via Cards, UPI, or Netbanking</span>
                    </button>

                    <button
                      onClick={() => setCheckoutMethod('offline')}
                      className="p-6 border-2 border-gray-100 hover:border-[#D4AF37] rounded-2xl flex flex-col items-center gap-3 transition-all group hover:bg-[#FFF0F5]/10"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FFF0F5] text-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-gray-900">Offline Order</span>
                      <span className="text-[11px] text-gray-400">Order via WhatsApp or Cash on Delivery</span>
                    </button>
                  </div>
                </div>
              )}

              {checkoutMethod === 'online' && (
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <button 
                      onClick={() => setCheckoutMethod('none')}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-500" />
                    </button>
                    <h3 className="font-serif text-2xl text-gray-900">Online Checkout Process</h3>
                  </div>

                  <div className="space-y-4 py-2">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D4AF37] flex-shrink-0 flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Add to Digital Bag</h4>
                        <p className="text-gray-500 text-xs mt-0.5">We will securely add your selected item(s) to your shopping cart.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D4AF37] flex-shrink-0 flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Shipping Details</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Enter your contact info and secure shipping address.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D4AF37] flex-shrink-0 flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Instant Payment</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Pay via secure gateway using UPI, Credit/Debit cards, or Netbanking.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setCheckoutMethod('none')}
                      className="flex-1 py-3.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-bold transition-all text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={async () => {
                        await addToCart(product, quantity);
                        setIsBuyNowModalOpen(false);
                        navigate('/checkout');
                      }}
                      className="flex-1 py-3.5 bg-[#D4AF37] hover:bg-black text-white rounded-xl font-bold shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {checkoutMethod === 'offline' && (
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <button 
                      onClick={() => setCheckoutMethod('none')}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-500" />
                    </button>
                    <h3 className="font-serif text-2xl text-gray-900">Offline Order Process</h3>
                  </div>

                  <div className="space-y-4 py-2">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D4AF37] flex-shrink-0 flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Share Details via WhatsApp</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Click order button below to share product details directly with our support executive.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D4AF37] flex-shrink-0 flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Order Confirmation</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Our representative will verify availability and confirm your order over message/call.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F5] text-[#D4AF37] flex-shrink-0 flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Cash on Delivery / Pay at Store</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Pay in cash when package is delivered to your doorstep, or collect and pay in-store.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setCheckoutMethod('none')}
                      className="flex-1 py-3.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-bold transition-all text-sm"
                    >
                      Back
                    </button>
                    <a
                      href={`https://wa.me/919876543210?text=Hi%20Aanya%20Fashions,%20I'd%20like%20to%20order%20the%20${encodeURIComponent(product.name)}%20(ID:%20${product.id})%20with%20quantity%20${quantity}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-all text-sm flex items-center justify-center gap-2 text-center"
                    >
                      Order via WhatsApp
                    </a>
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