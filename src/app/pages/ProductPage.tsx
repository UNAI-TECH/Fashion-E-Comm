import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { Star, Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase } from '../../lib/supabase';
import { Product } from '../data/products';
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
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Product not found');
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

  const handleBuyNow = async () => {
    if (product) {
      await addToCart(product, quantity);
      navigate('/checkout'); // Fixed: navigate to checkout instead of cart
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

      <div className="pt-32 pb-20 px-4">
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
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative mb-4 rounded-3xl overflow-hidden aspect-square group">
                <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-zoom-in">
                  <ZoomIn className="w-12 h-12 text-white" />
                </motion.div>
                <button onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setSelectedImage((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </motion.div>

              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button key={index} onClick={() => setSelectedImage(index)} className={`aspect-square rounded-xl overflow-hidden border-2 ${selectedImage === index ? 'border-[#D4AF37]' : 'border-gray-200'}`}>
                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1A1A]">{product.name}</h1>
              
              <div className="flex items-center gap-4">
                <div className="flex text-[#D4AF37]">
                   {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-[#D4AF37]' : ''}`} />
                    ))}
                </div>
                <span className="text-gray-500 font-medium">({product.rating})</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-4xl text-[#D4AF37]">₹{product.price.toLocaleString('en-IN')}</span>
                {product.compare_at_price && (
                   <span className="text-2xl text-gray-400 line-through">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed text-lg">{product.description || 'Premium quality traditional wear crafted with elegance.'}</p>

              {/* Quantity */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex items-center border border-gray-300 rounded-full h-14">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-full hover:bg-gray-50 flex items-center justify-center"> - </button>
                  <span className="w-14 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-14 h-full hover:bg-gray-50 flex items-center justify-center"> + </button>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button onClick={handleAddToCart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 h-14 bg-white text-[#D4AF37] border-2 border-[#D4AF37] rounded-full font-bold flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Add to Cart
                </motion.button>
                <motion.button onClick={handleWishlistToggle} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-14 h-14 bg-gray-50 text-gray-800 rounded-full font-bold shadow-lg flex items-center justify-center">
                  <Heart className={`w-6 h-6 transition-colors ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </motion.button>
              </div>
              <motion.button onClick={handleBuyNow} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full h-14 bg-[#D4AF37] text-white rounded-full font-bold shadow-lg mt-4">
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
      <Footer />
    </div>
  );
}