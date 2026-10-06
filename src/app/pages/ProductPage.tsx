import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { 
  Star, Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, 
  ChevronLeft, ChevronRight, ZoomIn, CreditCard, 
  Sparkles, X, Tag, 
  Copy, Check, FileText, Layers, Camera, Maximize2
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { CompactCustomerReviews } from '../components/CompactCustomerReviews';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase } from '../../lib/supabase';
import { fetchProducts, Product, ensureProductImages } from '../data/products';
import { toast } from 'sonner';


interface ProductDetailsData {
  attributes: { label: string; value: string }[];
  occasions: string[];
  pairWith: string[];
}

function getProductFullDetails(prod: Product): ProductDetailsData {
  const name = (prod.name || '').toLowerCase();
  const category = (prod.category || '').toLowerCase();

  const extractedColor = (() => {
    const colorList = "Forest Green, Moss Green, Olive Green, Sage Green, Fern Green, Emerald Green, Mint Green, Sea Green, Sky Blue, Ocean Blue, Aqua Blue, Sand Beige, Desert Sand, Stone Gray, Slate Gray, Clay Brown, Earth Brown, Coffee Brown, Chocolate Brown, Bark Brown, Sunset Orange, Sunrise Yellow, Rose Pink, Snow White, Ice Blue, Pastel Pink, Baby Pink, Blush Pink, Powder Blue, Baby Blue, Pastel Green, Pale Yellow, Lemon Chiffon, Light Coral, Pale Turquoise, Sky Mist, Ruby Red, Sapphire Blue, Amethyst Purple, Topaz Yellow, Garnet Red, Opal White, Jade Green, Onyx Black, Pearl White, Diamond White, Navy Blue, Royal Blue, Apple Red, Cherry Red, Strawberry Pink, Watermelon Pink, Mango Yellow, Lemon Yellow, Plum Purple, Blueberry Blue, Grape Purple, Kiwi Green, Lime Green, Rose Gold, Metallic Blue, Metallic Gray, Metallic Black, Metallic Green, Off White, Ash Gray, Jet Black, Dusty Rose, Hot Pink, Alice Blue, Antique White, Blue Violet, Cadet Blue, Cornflower Blue, Dark Blue, Dark Cyan, Dark Gray, Dark Green, Deep Pink, Dodger Blue, Ghost White, Indian Red, Lawn Green, Light Blue, Light Gray, Midnight Blue, Mint Cream, Misty Rose, Old Lace, Pale Green, Peach Puff, Rosy Brown, Sandy Brown, Slate Blue, Spring Green, Steel Blue, White Smoke, Yellow Green, Aquamarine, Chartreuse, Goldenrod, Firebrick, Gainsboro, Burlywood, Turquoise, Chocolate, Raspberry, Terracotta, Vermilion, Tangerine, Champagne, Periwinkle, Amethyst, Sapphire, Emerald, Crimson, Scarlet, Mustard, Marigold, Chestnut, Mahogany, Platinum, Burgundy, Lavender, Fuchsia, Magenta, Thistle, Orchid, Sienna, Tomato, Bisque, Moccasin, Silver, Bronze, Copper, Maroon, Purple, Orange, Yellow, Indigo, Violet, Orchid, Coral, Peach, Amber, Honey, Olive, Navy, Teal, Cyan, Aqua, Mint, Lime, Gold, Pearl, Wine, Plum, Rust, Clay, Mocha, Cocoa, Taupe, Sand, Camel, Khaki, Beige, Ivory, Cream, Brown, Black, White, Gray, Snow, Tan, Red, Blue, Green, Pink".split(', ');
    
    let n = name.toLowerCase();
    const foundColors = [];
    
    for (const color of colorList) {
      if (n.includes(color.toLowerCase())) {
        foundColors.push(color);
        n = n.replace(color.toLowerCase(), ''); // prevent matching parts of this color again
      }
    }
    
    if (foundColors.length === 0) return 'Vibrant';
    if (foundColors.length === 1) return foundColors[0];
    if (foundColors.length === 2) return foundColors.join(' and ');
    return foundColors.slice(0, -1).join(', ') + ' and ' + foundColors[foundColors.length - 1];
  })();

  // 1. Shirt & Trousers / Western Coordinates (e.g. Chocolate Silk Shirt & Beige Trousers)
  if (name.includes('shirt') || name.includes('trouser') || category.includes('western')) {
    return {
      attributes: [
        { label: 'Color', value: extractedColor },
        { label: 'Material', value: 'Premium Silk Feel Fabric' },
        { label: 'Design', value: 'Western Coordinates' },
        { label: 'Pattern', value: 'Solid Classic' },
        { label: 'Style', value: 'Modern Elegance' }
      ],
      occasions: [
        'Office Wear',
        'Brunch',
        'Business Casual',
        'Dinner',
        'Smart Casual Events'
      ],
      pairWith: [
        'Nude heels',
        'Gold accessories',
        'Structured handbag'
      ]
    };
  }

  // 2. Sarees
  if (category.includes('saree') || name.includes('saree') || name.includes('sari')) {
    return {
      attributes: [
        { label: 'Color', value: extractedColor },
        { label: 'Material', value: 'Pure Silk Blend / Georgette' },
        { label: 'Design', value: 'Heavy Border & Pallu' },
        { label: 'Pattern', value: 'Zari Woven & Traditional Motifs' },
        { label: 'Style', value: 'Classic Saree Drape' }
      ],
      occasions: [
        'Weddings & Receptions',
        'Festive Celebrations',
        'Cultural Functions',
        'Formal Evenings',
        'Grand Celebrations'
      ],
      pairWith: [
        'Metallic high heels',
        'Kundans or Gold jewelry set',
        'Embroidered potli or clutch'
      ]
    };
  }

  // 3. Kurtis & Anarkalis
  if (category.includes('kurti') || name.includes('kurti') || name.includes('kurta') || name.includes('anarkali')) {
    return {
      attributes: [
        { label: 'Color', value: extractedColor },
        { label: 'Material', value: 'Cotton Silk Blend' },
        { label: 'Design', value: 'Straight / Flared Cut' },
        { label: 'Pattern', value: 'Embroidered Yoke / Floral Print' },
        { label: 'Style', value: 'Casual & Festive Wear' }
      ],
      occasions: [
        'Festive Gatherings',
        'Office & Business Casual',
        'Daytime Brunch',
        'Family Celebrations',
        'Smart Casual Events'
      ],
      pairWith: [
        'Strappy block heels or Mojris',
        'Terracotta or Gold hoop earrings',
        'Classic tote or leather handbag'
      ]
    };
  }

  // 4. Lehengas
  if (category.includes('lehenga') || name.includes('lehenga') || name.includes('choli')) {
    return {
      attributes: [
        { label: 'Color', value: extractedColor },
        { label: 'Material', value: 'Silk Organza / Velvet' },
        { label: 'Design', value: 'Flared Skirt with Dupatta' },
        { label: 'Pattern', value: 'Heavy Hand Embroidery & Zari' },
        { label: 'Style', value: 'Bridal & Festive Lehenga' }
      ],
      occasions: [
        'Bridal Wear & Weddings',
        'Sangeet & Mehendi Nights',
        'Royal Galas',
        'Festive Celebrations',
        'Formal Reception Dinners'
      ],
      pairWith: [
        'Embellished high heels',
        'Statement Polki choker & bangles',
        'Raw silk embroidered clutch'
      ]
    };
  }

  // 5. Salwar Sets & Suits
  if (category.includes('salwar') || name.includes('suit') || name.includes('salwar') || name.includes('set')) {
    return {
      attributes: [
        { label: 'Color', value: extractedColor },
        { label: 'Material', value: 'Silk Blend / Georgette' },
        { label: 'Design', value: '3-Piece Salwar Suit' },
        { label: 'Pattern', value: 'Embroidered Neckline & Dupatta' },
        { label: 'Style', value: 'Traditional Ethnic Wear' }
      ],
      occasions: [
        'Puja & Traditional Functions',
        'Family Gatherings',
        'Daytime Events',
        'Festive Occasions',
        'Smart Ethnic Events'
      ],
      pairWith: [
        'Traditional Punjabi juttis',
        'Filigree gold earrings',
        'Structured shoulder bag'

      ]
    };
  }

  // 6. Maxi Gowns
  if (category.includes('maxi') || name.includes('maxi') || name.includes('gown')) {
    return {
      attributes: [
        { label: 'Color', value: 'As per selection' },
        { label: 'Material', value: 'Premium Chiffon / Georgette' },
        { label: 'Design', value: 'A-Line Maxi Silhouette' },
        { label: 'Pattern', value: 'Solid / Subtle Embellishments' },
        { label: 'Style', value: 'Western Evening Wear' }
      ],
      occasions: [
        'Evening Cocktail Dinners',
        'Sunset Brunches',
        'Resort Galas',
        'Special Anniversary Dinners',
        'Formal Receptions'
      ],
      pairWith: [
        'Minimalist strappy heels',
        'Delicate gold or crystal drop earrings',
        'Sleek designer clutch'
      ]
    };
  }

  // Default fallback for any clothing item
  return {
    attributes: [
      { label: 'Color', value: 'As per selection' },
      { label: 'Material', value: 'Premium Blended Fabric' },
      { label: 'Design', value: 'Elegant Modern Cut' },
      { label: 'Pattern', value: 'Classic Solid / Print' },
      { label: 'Style', value: 'Contemporary Luxury' }
    ],
    occasions: [
      'Office Wear',
      'Brunch',
      'Business Casual',
      'Dinner',
      'Smart Casual Events'
    ],
    pairWith: [
      'Nude heels',
      'Gold accessories',
      'Structured handbag'
    ]
  };
}

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);


  // Gallery, Lightbox, Size Chart & Coupon states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [isCopiedCoupon, setIsCopiedCoupon] = useState(false);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);


  const handleBuyNow = () => {
    if (!product) return;
    // Navigate to full-page checkout with buy-now params
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

  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Navigation />

      <div className="pt-24 sm:pt-28 lg:pt-14 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb on Top Left */}
          <div className="text-[#698156] uppercase tracking-wider text-xs font-bold flex items-center gap-1.5 mb-6 flex-wrap">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to={`/category/${(product.category || 'all').toLowerCase()}`} className="hover:underline">{product.category || 'Product'}</Link>
            <span>/</span>
            <span className="truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
          </div>
          {/* Myntra-Inspired Showcase Layout: 12-column grid on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* ═══ LEFT 7 COLS: MYNTRA MULTI-IMAGE 2-COLUMN GRID + REVIEWS ═══ */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Desktop 2-Column Multi-Angle Gallery */}
              <div className="hidden lg:grid grid-cols-2 gap-3.5">
                {product.images && product.images.map((imgUrl, idx) => {
                  const angleLabel = idx === 0 
                    ? 'Front Shot' 
                    : idx === 1 
                      ? 'Model Pose' 
                      : idx === 2 
                        ? 'Fabric Detail' 
                        : idx === 3 
                          ? 'Back View' 
                          : `Angle #${idx + 1}`;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.35 }}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setIsLightboxOpen(true);
                      }}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200/80 bg-[#FAF9F6] shadow-2xs hover:shadow-xl transition-all duration-300 cursor-zoom-in"
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} - View ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Angle Tag Pill in Top Left */}
                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white shadow-xs">
                          {angleLabel}
                        </span>
                      </div>

                      {/* Myntra-style Double-Card / Inspect Button in Bottom Right */}
                      <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                        <div className="p-2.5 bg-white/95 hover:bg-white text-gray-900 rounded-2xl shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 flex items-center gap-1.5 text-xs font-bold">
                          <Maximize2 className="w-3.5 h-3.5 text-[#698156]" />
                          <span>Zoom</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Mobile Swipeable Gallery Carousel (screen < lg) */}
              <div className="lg:hidden space-y-3">
                <div 
                  className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const index = Math.round(el.scrollLeft / (el.offsetWidth * 0.88));
                    if (index >= 0 && index < (product.images?.length || 1)) {
                      setMobileActiveIndex(index);
                    }
                  }}
                >
                  {product.images && product.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setIsLightboxOpen(true);
                      }}
                      className="snap-center shrink-0 w-[88vw] max-w-[420px] aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 bg-[#FAF9F6] relative shadow-sm cursor-pointer"
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} - View ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Counter Badge */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/75 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#698156]" />
                        <span>{idx + 1} / {product.images.length}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Thumbnail Navigation Strip */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
                  {product.images && product.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setIsLightboxOpen(true);
                      }}
                      className={`relative w-14 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        mobileActiveIndex === idx ? 'border-[#698156] scale-105 shadow-sm' : 'border-gray-200 opacity-70'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Reviews Section */}
              <CompactCustomerReviews product={product} />
            </div>

            {/* ═══ RIGHT 5 COLS: STICKY PRODUCT SUMMARY (MYNTRA INSPIRED) ═══ */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:pr-3 space-y-5 scrollbar-thin">
              {(() => {
                const details = getProductFullDetails(product);
                const isSaree = (product.category || '').toLowerCase().includes('saree') || (product.name || '').toLowerCase().includes('saree');
                const discountPercent = product.compare_at_price 
                  ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) 
                  : 45;
                const bestOfferPrice = Math.round(product.price * 0.65);
                const totalSaving = product.compare_at_price 
                  ? product.compare_at_price - bestOfferPrice 
                  : Math.round(product.price * 0.35);

                return (
                  <>
                    {/* Header: Brand Name & Title */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-[#698156] font-black">
                          Aanya Fashions • Sangria Heritage
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                      </div>
                      <h1 className="font-serif text-2xl sm:text-3xl text-gray-900 leading-snug font-bold">
                        {product.name}
                      </h1>
                    </div>

                    {/* Rating Badge (Exact Myntra border pill) */}
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-800 shadow-2xs">
                        <span className="flex items-center gap-1 font-bold">
                          {product.rating} <Star className="w-3.5 h-3.5 fill-[#698156] text-[#698156]" />
                        </span>
                        <span className="w-px h-3.5 bg-gray-300"></span>
                        <span className="text-gray-500 font-medium">19 Ratings</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        In Stock & Ready to Ship
                      </span>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    {/* Price Block */}
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
                        <span className="text-sm font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                          ({discountPercent}% OFF)
                        </span>
                      </div>
                      <span className="text-xs text-emerald-700 font-semibold block">
                        inclusive of all taxes
                      </span>
                    </div>

                    {/* Free Size Label */}
                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-800 block">Size</span>
                        <span className="text-xs text-gray-500">{isSaree ? 'Traditional 5.5m Saree + 0.8m Blouse Piece' : 'Standard fit for all body types'}</span>
                      </div>
                      <span className="text-xs font-bold text-[#698156] bg-white px-3 py-1 rounded-full border border-[#DCE4D7]">
                        Free Size
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <span className="text-xs uppercase tracking-widest text-gray-600 font-bold">Quantity</span>
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden h-10 bg-white">
                        <button 
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                          className="w-10 h-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold cursor-pointer transition-colors"
                        > - </button>
                        <span className="w-10 text-center font-bold text-sm text-gray-900">{quantity}</span>
                        <button 
                          type="button"
                          onClick={() => setQuantity(quantity + 1)} 
                          className="w-10 h-full hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold cursor-pointer transition-colors"
                        > + </button>
                      </div>
                    </div>

                    {/* Action Buttons (Horizontal layout like Myntra screenshot) */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex gap-3">
                        <motion.button 
                          type="button"
                          onClick={handleAddToCart}
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }} 
                          className="flex-1 h-14 bg-[#ff3e6c] hover:bg-[#e0355d] text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4 text-white" />
                          ADD TO BAG
                        </motion.button>

                        <motion.button 
                          type="button"
                          onClick={handleWishlistToggle} 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }} 
                          className="px-6 h-14 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-800 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Heart className={`w-4 h-4 ${product && isInWishlist(product.id) ? 'fill-[#ff3e6c] text-[#ff3e6c]' : 'text-gray-700'}`} />
                          {product && isInWishlist(product.id) ? 'WISHLISTED' : 'WISHLIST'}
                        </motion.button>
                      </div>

                      {/* Direct Buy Now Button */}
                      <motion.button 
                        type="button"
                        onClick={handleBuyNow} 
                        whileHover={{ scale: 1.01 }} 
                        whileTap={{ scale: 0.99 }} 
                        className="w-full h-13 rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#698156] hover:bg-[#546944] text-white border-2 border-[#698156]"
                      >
                        <CreditCard className="w-4 h-4" /> 
                        Buy Now
                      </motion.button>
                    </div>

                    {/* ═══ BEST OFFERS SECTION (MYNTRA SCREENSHOT MATCH) ═══ */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-900">
                        <Tag className="w-4 h-4 text-[#698156]" />
                        <span>BEST OFFERS</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        Best Price: <span className="text-[#698156] font-black text-base">Rs. {bestOfferPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                        <li>
                          Coupon Discount: <strong className="text-gray-900">35% off</strong> (Your total saving: Rs. {totalSaving.toLocaleString('en-IN')})
                        </li>
                        <li>Applicable on: Orders above Rs. 300 (only on first purchase)</li>
                        <li className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span>Coupon code: <strong className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-300">AANYAEXCLUSIVE1</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('AANYAEXCLUSIVE1');
                              setIsCopiedCoupon(true);
                              toast.success('Coupon code AANYAEXCLUSIVE1 copied!');
                              setTimeout(() => setIsCopiedCoupon(false), 2000);
                            }}
                            className="text-[11px] font-bold text-[#698156] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded shadow-xs border border-[#DCE4D7]"
                          >
                            {isCopiedCoupon ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                            {isCopiedCoupon ? 'Copied!' : 'Copy Code'}
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Value Badges: Fast Shipping, Easy Returns, Authenticity */}
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

                    {/* ═══ PRODUCT DETAILS & ABOUT THE BRAND (MYNTRA SCREENSHOT MATCH) ═══ */}
                    <div className="pt-2 space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#698156]" />
                        <h3 className="font-serif text-base font-bold text-[#1A1A1A]">PRODUCT DETAILS</h3>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">ABOUT THE BRAND</h4>
                        <p className="text-xs text-gray-600 leading-relaxed text-justify">
                          Aanya Fashions is a luxury heritage couture brand that focuses on modern, empowered women. Our designs celebrate signature artisanal weaves, rich color palettes, and intricate embroidery with a contemporary take on traditional Indian motifs.
                        </p>
                      </div>

                      {/* Specifications Grid */}
                      <div className="pt-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 mb-2.5">SPECIFICATIONS</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {details.attributes.map((attr, aIdx) => (
                            <div key={aIdx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">{attr.label}</span>
                              <span className="font-semibold text-gray-800">{attr.value}</span>
                            </div>
                          ))}
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Occasion</span>
                            <span className="font-semibold text-gray-800">{details.occasions[0] || 'Festive & Party'}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Wash Care</span>
                            <span className="font-semibold text-gray-800">Dry Clean Only</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ INTERACTIVE FULLSCREEN LIGHTBOX MODAL ═══ */}
      <AnimatePresence>
        {isLightboxOpen && product && product.images && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLightboxOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[92vh] w-full flex flex-col items-center z-10"
            >
              {/* Top Bar with Counter and Close */}
              <div className="w-full flex items-center justify-between text-white pb-3 px-2">
                <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                  <span className="text-[#698156] font-serif font-black">{product.name}</span>
                  <span className="text-gray-400">• Photo {lightboxIndex + 1} of {product.images.length}</span>
                </div>
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Image Display */}
              <div className="relative w-full aspect-[3/4] max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
                <img
                  src={product.images[lightboxIndex]}
                  alt={`${product.name} view ${lightboxIndex + 1}`}
                  className="w-full h-full object-contain"
                />

                {/* Left Navigation Arrow */}
                {lightboxIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(prev => prev - 1);
                    }}
                    className="absolute left-4 p-3 bg-black/60 hover:bg-[#546944] text-white rounded-full transition-all cursor-pointer backdrop-blur-md"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {/* Right Navigation Arrow */}
                {lightboxIndex < product.images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(prev => prev + 1);
                    }}
                    className="absolute right-4 p-3 bg-black/60 hover:bg-[#546944] text-white rounded-full transition-all cursor-pointer backdrop-blur-md"
                    title="Next photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnail Strip */}
              <div className="flex gap-2 pt-4 overflow-x-auto max-w-full justify-center">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`relative w-14 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      lightboxIndex === i ? 'border-[#698156] scale-105 shadow-md' : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      <Footer />

      {/* Buy Now navigates to /checkout?buyNow=ID — no modal needed */}
    </div>
  );
} 


