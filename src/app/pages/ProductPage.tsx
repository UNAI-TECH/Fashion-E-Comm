import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { 
  Star, Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, 
  ChevronLeft, ChevronRight, ZoomIn, CreditCard, 
  Sparkles, X, Tag, 
  Copy, Check, FileText, Layers, Camera, Maximize2, MessageSquarePlus
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase } from '../../lib/supabase';
import { fetchProducts, Product, ensureProductImages } from '../data/products';
import { toast } from 'sonner';


/* ─── Review type for real DB reviews ─── */
interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
}

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Lightbox & coupon states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isCopiedCoupon, setIsCopiedCoupon] = useState(false);

  // Real reviews from DB
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Random related products
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const handleBuyNow = () => {
    if (!product) return;
    navigate(`/checkout?buyNow=${product.id}&qty=${quantity}`);
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
          const itemImages = ensureProductImages(data);
          setProduct({
            ...data,
            image: itemImages[0],
            images: itemImages,
            colors: data.colors || ['#698156'],
            rating: data.rating || 4.8,
          });
        } else {
          throw new Error('No data found');
        }
      } catch (error) {
        console.error('Error loading product from DB, falling back to mock data:', error);
        try {
          const allProducts = await fetchProducts();
          const mockProduct = allProducts.find(p => String(p.id) === String(id));
          if (mockProduct) {
            const itemImages = ensureProductImages(mockProduct);
            setProduct({
              ...mockProduct,
              image: itemImages[0],
              images: itemImages,
            });
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

  // Load real reviews from Supabase
  useEffect(() => {
    async function loadReviews() {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setReviews(data);
        }
      } catch (err) {
        console.warn('Reviews load notice:', err);
      } finally {
        setReviewsLoading(false);
      }
    }
    loadReviews();
  }, [id]);

  // Load random related products
  useEffect(() => {
    async function loadRelated() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'Published')
          .neq('id', id)
          .limit(8);

        if (!error && data) {
          const mapped = data.map(p => {
            const imgs = ensureProductImages(p);
            return { ...p, image: imgs[0], images: imgs };
          });
          setRelatedProducts(mapped);
        }
      } catch (err) {
        console.warn('Related products load notice:', err);
      }
    }
    loadRelated();
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
      window.dispatchEvent(new CustomEvent('open-cart'));
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <AnnouncementBar />
        <Navigation />
        <div className="pt-20 sm:pt-24 lg:pt-6 flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#698156]"></div>
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
        <div className="pt-20 sm:pt-24 lg:pt-6 text-center min-h-[400px] flex flex-col items-center justify-center">
          <h1 className="text-2xl font-serif">Product not found</h1>
          <Link to="/" className="text-[#698156] hover:underline mt-4 inline-block">Return to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Extract specs and offer from product data
  const specs = (product as any).specifications || {};
  const offerEnabled = (product as any).offer_enabled === true;
  const offerDetails = (product as any).offer_details || {};

  const isSaree = (product.category || '').toLowerCase().includes('saree') || (product.name || '').toLowerCase().includes('saree');
  const discountPercent = product.compare_at_price 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) 
    : null;

  const specAttributes = [
    { label: 'Brand', value: specs.brand || 'Aanya Fashions' },
    ...(specs.color ? [{ label: 'Color', value: specs.color }] : []),
    ...(specs.material ? [{ label: 'Material', value: specs.material }] : []),
    ...(specs.design ? [{ label: 'Design', value: specs.design }] : []),
    ...(specs.pattern ? [{ label: 'Pattern', value: specs.pattern }] : []),
    { label: 'Wash Care', value: specs.wash_care || 'Dry Clean Only' },
    ...(specs.occasion ? [{ label: 'Occasion', value: specs.occasion }] : []),
  ];

  const avgRating = reviews.length > 0 
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 
    : product.rating || 0;

  const images = product.images || [product.image];

  /* ─── Related Product Card Component ─── */
  const RelatedProductCard = ({ p }: { p: Product }) => {
    const img = ensureProductImages(p)[0];
    const disc = p.compare_at_price 
      ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
      : null;
    return (
      <Link
        to={`/product/${p.id}`}
        className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
      >
        <div className="aspect-[3/4] bg-[#FAF9F6] overflow-hidden">
          <img
            src={img}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-3 space-y-1.5 flex-grow flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-[#698156] font-bold uppercase tracking-wider">Aanya Fashions</p>
            <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mt-0.5">{p.name}</h4>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-sm font-bold text-gray-900">₹{p.price.toLocaleString('en-IN')}</span>
            {p.compare_at_price && (
              <span className="text-[11px] text-gray-400 line-through">₹{p.compare_at_price.toLocaleString('en-IN')}</span>
            )}
            {disc && disc > 0 && (
              <span className="text-[10px] font-bold text-orange-600">({disc}% OFF)</span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navigation />

      <div className="pt-24 sm:pt-28 lg:pt-14 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="text-[#698156] uppercase tracking-wider text-xs font-bold flex items-center gap-1.5 mb-6 flex-wrap">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to={`/category/${(product.category || 'all').toLowerCase()}`} className="hover:underline">{product.category || 'Product'}</Link>
            <span>/</span>
            <span className="truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DESKTOP LAYOUT: Left (Image + Related) | Right (Details)
              MOBILE LAYOUT:  Image → Details → Reviews → Related
              ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* ═══ LEFT COLUMN (Desktop: Image + Related Products) ═══ */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Main Image Carousel */}
              <div 
                className="relative aspect-[4/5] max-h-[520px] rounded-2xl overflow-hidden border border-gray-200/80 bg-[#FAF9F6] shadow-sm cursor-zoom-in group mx-auto w-full"
                onClick={() => {
                  setLightboxIndex(selectedImage);
                  setIsLightboxOpen(true);
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={images[selectedImage]}
                    alt={`${product.name} - View ${selectedImage + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    {selectedImage > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev - 1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-md transition-all cursor-pointer z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {selectedImage < images.length - 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev + 1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-md transition-all cursor-pointer z-10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/75 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5 z-10">
                    <Camera className="w-3.5 h-3.5 text-[#698156]" />
                    <span>{selectedImage + 1} / {images.length}</span>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                  <div className="p-2 bg-white/90 text-gray-900 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1.5 text-xs font-bold">
                    <Maximize2 className="w-3.5 h-3.5 text-[#698156]" />
                    <span>Zoom</span>
                  </div>
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 justify-center">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        selectedImage === idx ? 'border-[#698156] scale-105 shadow-md ring-2 ring-[#698156]/20' : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* ═══ RELATED PRODUCTS — Desktop only (below image, beside details) ═══ */}
              {relatedProducts.length > 0 && (
                <div className="hidden lg:block space-y-4 pt-2">
                  <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#698156]" />
                    You May Also Like
                  </h3>
                  <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                    {relatedProducts.slice(0, 8).map(p => (
                      <RelatedProductCard key={p.id} p={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ RIGHT COLUMN: PRODUCT DETAILS ═══ */}
            <div className="lg:col-span-5 space-y-5">
              {/* Header: Brand & Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#698156] font-black">
                    {specs.brand || 'Aanya Fashions'} • Sangria Heritage
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {product.category}
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl text-gray-900 leading-snug font-bold">
                  {product.name}
                </h1>
              </div>

              {/* Rating — only if reviews exist */}
              <div className="flex items-center gap-3">
                {reviews.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-800 shadow-2xs">
                    <span className="flex items-center gap-1 font-bold">
                      {avgRating} <Star className="w-3.5 h-3.5 fill-[#698156] text-[#698156]" />
                    </span>
                    <span className="w-px h-3.5 bg-gray-300"></span>
                    <span className="text-gray-500 font-medium">{reviews.length} {reviews.length === 1 ? 'Rating' : 'Ratings'}</span>
                  </div>
                )}
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  In Stock & Ready to Ship
                </span>
              </div>

              <div className="w-full h-px bg-gray-100"></div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl text-gray-900 font-bold tracking-tight">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-lg sm:text-xl text-gray-400 line-through font-normal">
                      MRP ₹{product.compare_at_price.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent && discountPercent > 0 && (
                    <span className="text-sm font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                      ({discountPercent}% OFF)
                    </span>
                  )}
                </div>
                <span className="text-xs text-emerald-700 font-semibold block">inclusive of all taxes</span>
              </div>

              {/* Size */}
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800 block">Size</span>
                  <span className="text-xs text-gray-500">{isSaree ? 'Traditional 5.5m Saree + 0.8m Blouse Piece' : 'Standard fit for all body types'}</span>
                </div>
                <span className="text-xs font-bold text-[#698156] bg-white px-3 py-1 rounded-full border border-[#DCE4D7]">Free Size</span>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest text-gray-600 font-bold">Quantity</span>
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden h-10 bg-white">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold cursor-pointer transition-colors"> - </button>
                  <span className="w-10 text-center font-bold text-sm text-gray-900">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold cursor-pointer transition-colors"> + </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <div className="flex gap-3">
                  <motion.button type="button" onClick={handleAddToCart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 h-14 bg-[#ff3e6c] hover:bg-[#e0355d] text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer">
                    <ShoppingBag className="w-4 h-4 text-white" /> ADD TO BAG
                  </motion.button>
                  <motion.button type="button" onClick={handleWishlistToggle} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 h-14 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-800 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                    <Heart className={`w-4 h-4 ${product && isInWishlist(product.id) ? 'fill-[#ff3e6c] text-[#ff3e6c]' : 'text-gray-700'}`} />
                    {product && isInWishlist(product.id) ? 'WISHLISTED' : 'WISHLIST'}
                  </motion.button>
                </div>
                <motion.button type="button" onClick={handleBuyNow} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full h-13 rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#698156] hover:bg-[#546944] text-white border-2 border-[#698156]">
                  <CreditCard className="w-4 h-4" /> Buy Now
                </motion.button>
              </div>

              {/* Best Offers — only when admin enabled */}
              {offerEnabled && offerDetails.coupon_code && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-900">
                    <Tag className="w-4 h-4 text-[#698156]" /> <span>BEST OFFERS</span>
                  </div>
                  {offerDetails.offer_price && (
                    <div className="text-sm font-bold text-gray-900">
                      Best Price: <span className="text-[#698156] font-black text-base">Rs. {Number(offerDetails.offer_price).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                    {offerDetails.coupon_discount && (
                      <li>Coupon Discount: <strong className="text-gray-900">{offerDetails.coupon_discount}% off</strong>
                        {offerDetails.offer_price && product.compare_at_price && (
                          <span> (Your total saving: Rs. {(product.compare_at_price - Number(offerDetails.offer_price)).toLocaleString('en-IN')})</span>
                        )}
                      </li>
                    )}
                    {offerDetails.applicable_on && <li>Applicable on: {offerDetails.applicable_on}</li>}
                    <li className="flex items-center gap-2 flex-wrap pt-0.5">
                      <span>Coupon code: <strong className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-300">{offerDetails.coupon_code}</strong></span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(offerDetails.coupon_code); setIsCopiedCoupon(true); toast.success(`Coupon code ${offerDetails.coupon_code} copied!`); setTimeout(() => setIsCopiedCoupon(false), 2000); }} className="text-[11px] font-bold text-[#698156] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded shadow-xs border border-[#DCE4D7]">
                        {isCopiedCoupon ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        {isCopiedCoupon ? 'Copied!' : 'Copy Code'}
                      </button>
                    </li>
                  </ul>
                </div>
              )}

              {/* Value Badges */}
              <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-100 text-center">
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/70">
                  <Truck className="w-4 h-4 text-[#698156]" />
                  <span className="text-[10px] font-bold text-gray-700">Fast Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/70">
                  <RotateCcw className="w-4 h-4 text-[#698156]" />
                  <span className="text-[10px] font-bold text-gray-700">Easy 7-Day Returns</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50/70">
                  <Shield className="w-4 h-4 text-[#698156]" />
                  <span className="text-[10px] font-bold text-gray-700">100% Authentic</span>
                </div>
              </div>

              {/* Product Details & Specifications */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#698156]" />
                  <h3 className="font-serif text-base font-bold text-[#1A1A1A]">PRODUCT DETAILS</h3>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">ABOUT THE BRAND</h4>
                  <p className="text-xs text-gray-600 leading-relaxed text-justify">
                    {specs.brand || 'Aanya Fashions'} is a luxury heritage couture brand that focuses on modern, empowered women. Our designs celebrate signature artisanal weaves, rich color palettes, and intricate embroidery with a contemporary take on traditional Indian motifs.
                  </p>
                </div>
                <div className="pt-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 mb-2.5">SPECIFICATIONS</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {specAttributes.map((attr, aIdx) => (
                      <div key={aIdx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">{attr.label}</span>
                        <span className="font-semibold text-gray-800">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {product.description && (
                  <div className="pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 mb-2">DESCRIPTION</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              FULL-WIDTH BOTTOM SECTION: Customer Reviews (centered)
              ═══════════════════════════════════════════════════════════ */}
          <div className="max-w-4xl mx-auto mt-12 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-[#698156]" />
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">CUSTOMER REVIEWS</h3>
              </div>
              {reviews.length > 0 && (
                <span className="text-sm font-bold text-[#698156] bg-[#F4F6F2] px-3 py-1 rounded-full border border-[#DCE4D7]">
                  {avgRating} ★ ({reviews.length})
                </span>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#698156]"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-gray-600">No reviews yet</p>
                <p className="text-sm text-gray-400 mt-1">Be the first to review this product!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#698156]/15 flex items-center justify-center text-[#698156] text-sm font-bold">
                          {review.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-800">{review.user_name}</span>
                          {review.verified && (
                            <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ Verified</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-[#698156] text-[#698156]' : 'text-gray-300 fill-gray-200'}`} />
                      ))}
                      <span className="text-xs font-bold text-[#698156] ml-1">{review.rating}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ RELATED PRODUCTS — Mobile only (below reviews) ═══ */}
          {relatedProducts.length > 0 && (
            <div className="lg:hidden mt-10 space-y-4">
              <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#698156]" />
                You May Also Like
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {relatedProducts.slice(0, 6).map(p => (
                  <RelatedProductCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ FULLSCREEN LIGHTBOX ═══ */}
      <AnimatePresence>
        {isLightboxOpen && product && images && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLightboxOpen(false)} className="fixed inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-4xl max-h-[92vh] w-full flex flex-col items-center z-10">
              <div className="w-full flex items-center justify-between text-white pb-3 px-2">
                <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                  <span className="text-[#698156] font-serif font-black">{product.name}</span>
                  <span className="text-gray-400">• Photo {lightboxIndex + 1} of {images.length}</span>
                </div>
                <button onClick={() => setIsLightboxOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative w-full aspect-[3/4] max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
                <img src={images[lightboxIndex]} alt={`${product.name} view ${lightboxIndex + 1}`} className="w-full h-full object-contain" />
                {lightboxIndex > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev - 1); }} className="absolute left-4 p-3 bg-black/60 hover:bg-[#546944] text-white rounded-full transition-all cursor-pointer backdrop-blur-md">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {lightboxIndex < images.length - 1 && (
                  <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev + 1); }} className="absolute right-4 p-3 bg-black/60 hover:bg-[#546944] text-white rounded-full transition-all cursor-pointer backdrop-blur-md">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 pt-4 overflow-x-auto max-w-full justify-center">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setLightboxIndex(i)} className={`relative w-14 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${lightboxIndex === i ? 'border-[#698156] scale-105 shadow-md' : 'border-white/30 opacity-60 hover:opacity-100'}`}>
                    <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
} 
