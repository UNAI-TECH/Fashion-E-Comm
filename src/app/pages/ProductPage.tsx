import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { 
  Star, Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, 
  ChevronLeft, ChevronRight, ZoomIn, CreditCard, CheckCircle2, 
  Loader2, DollarSign, MapPin, Calendar, Sparkles, X, Tag, 
  Copy, Check, FileText, Layers, Camera, Maximize2, Ruler
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
import { api } from '../../lib/api';
import { ProfileModal } from '../components/ProfileModal';
import { isUserProfileComplete, getUserProfileDetails, UserProfileDetails } from '../../lib/userProfile';

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
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [buyNowStep, setBuyNowStep] = useState<'phone' | 'otp' | 'checkout' | 'success'>('phone');
  const [buyNowPhone, setBuyNowPhone] = useState('');
  const [buyNowOtp, setBuyNowOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [buyNowCooldown, setBuyNowCooldown] = useState(0);

  useEffect(() => {
    if (buyNowCooldown <= 0) return;
    const interval = setInterval(() => {
      setBuyNowCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [buyNowCooldown]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderReference, setOrderReference] = useState<{ id: string; method: string; total: number } | null>(null);

  // Gallery, Lightbox, Size Chart & Coupon states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isCopiedCoupon, setIsCopiedCoupon] = useState(false);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);

  const [orderForm, setOrderForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    cardNumber: '',
    cardHolder: '',
  });

  // Lock background page scroll & pre-fill saved user details from Account section
  useEffect(() => {
    if (isBuyNowModalOpen) {
      document.body.style.overflow = 'hidden';

      async function loadSavedAccountProfile() {
        let name = '';
        let phone = '';
        let address = '';
        let city = '';
        let pincode = '';

        // A. Load from localStorage user_profile_details (saved via Account modal)
        try {
          const stored = localStorage.getItem('user_profile_details');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.name) name = data.name;
            if (data.fullName) name = data.fullName;
            if (data.phone) phone = data.phone;
            if (data.address) address = data.address;
            if (data.city) city = data.city;
            if (data.pincode) pincode = data.pincode;
          }
        } catch (e) {
          console.error('LocalStorage profile error:', e);
        }

        // B. Load from Supabase auth user & profiles table
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            if (!name && user.user_metadata?.full_name) name = user.user_metadata.full_name;
            if (!name && user.user_metadata?.name) name = user.user_metadata.name;
            if (!phone && user.phone) phone = user.phone;
            if (!phone && user.user_metadata?.phone) phone = user.user_metadata.phone;
            if (!address && user.user_metadata?.address) address = user.user_metadata.address;

            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (dbProfile) {
              if (dbProfile.full_name) name = dbProfile.full_name;
              if (dbProfile.phone) phone = dbProfile.phone;
              if (dbProfile.address) address = dbProfile.address;
              if (dbProfile.city) city = dbProfile.city;
              if (dbProfile.pincode) pincode = dbProfile.pincode;
            }
          }
        } catch (e) {
          console.error('Supabase profile error:', e);
        }

        // Pre-fill form fields with user's actual account details
        setOrderForm(prev => ({
          ...prev,
          fullName: prev.fullName || name,
          phone: prev.phone || phone || buyNowPhone,
          address: prev.address || address,
          city: prev.city || city,
          pincode: prev.pincode || pincode,
        }));

        if (phone && !buyNowPhone) {
          setBuyNowPhone(phone);
        }
      }

      loadSavedAccountProfile();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isBuyNowModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderForm({ ...orderForm, [e.target.name]: e.target.value });
  };

  const handleBuyNow = () => {
    if (!product) return;

    const isSaree = (product.category || '').toLowerCase().includes('saree') || (product.name || '').toLowerCase().includes('saree');
    if (!isSaree && !selectedSize) {
      setSizeError(true);
      toast.error('Please select a size before proceeding to Buy Now!');
      return;
    }

    setSizeError(false);
    setIsBuyNowModalOpen(true);
    setBuyNowStep('checkout');
    setBuyNowPhone(orderForm.phone || '');
    setBuyNowOtp('');
  };

  const handleSendOTP = async () => {
    const cleanPhone = buyNowPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setOrderForm(prev => ({ ...prev, phone: buyNowPhone }));
    setBuyNowStep('checkout');
  };

  const handleVerifyOTP = async () => {
    setOrderForm(prev => ({ ...prev, phone: buyNowPhone }));
    setBuyNowStep('checkout');
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
      // 1. Try unified authoritative backend API
      try {
        const createRes = await api.orders.create({
          orderItems: [{
            product_id: product.id,
            name: product.name,
            qty: quantity,
            price: product.price,
            size: selectedSize || 'Regular',
            color: (product as any).color || null
          }],
          address: {
            first_name: orderForm.fullName.split(' ')[0],
            last_name: orderForm.fullName.split(' ').slice(1).join(' '),
            phone: orderForm.phone,
            address: orderForm.address,
            city: orderForm.city,
            pincode: orderForm.pincode,
            country: 'India'
          },
          paymentMethod: paymentType === 'Card' ? 'Card' : 'COD',
          taxPrice: 0,
          shippingPrice: 0,
          totalAmount: (product.price || 0) * quantity
        });

        if (createRes?.success && createRes.order) {
          toast.success(`Order Placed! Tracking #${createRes.order.tracking_number}`);
          window.dispatchEvent(new Event('orders_updated'));
          navigate('/orders');
          return;
        }
      } catch (apiErr: any) {
        if (apiErr.code === 'INSUFFICIENT_STOCK') {
          toast.error(apiErr.message);
          return;
        }
        console.warn('Backend API fallback to direct Supabase:', apiErr.message);
      }

      // 2. Direct Supabase Order Insertion fallback
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } catch (e) {
        console.warn('Auth check skipped:', e);
      }

      const totalAmount = (product.price || 0) * quantity;
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const trackingNumber = `AANYA-${datePart}-${randomSuffix}`;
      const generatedOrderId = 'ord_' + Math.random().toString(36).substring(2, 10);

      const shippingDetails = {
        full_name: orderForm.fullName,
        phone: orderForm.phone,
        address: orderForm.address,
        city: orderForm.city,
        pincode: orderForm.pincode,
        tracking_number: trackingNumber,
        card_holder: orderForm.cardHolder || undefined,
        card_number: orderForm.cardNumber ? `•••• •••• •••• ${orderForm.cardNumber.slice(-4)}` : undefined,
      };

      const orderPayload = {
        id: generatedOrderId,
        status: 'Pending',
        payment_method: paymentType === 'Card' ? 'Card' : 'COD',
        payment_status: paymentType === 'Card' ? 'Success' : 'Pending',
        total_amount: totalAmount,
        total_price: totalAmount,
        shipping_address: shippingDetails,
        ...(user?.id ? { user_id: user.id } : {})
      };

      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload]);

      if (orderError) {
        delete (orderPayload as any).user_id;
        const { error: retryError } = await supabase.from('orders').insert([orderPayload]);
        if (retryError) throw retryError;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const orderItemPayload = {
        order_id: generatedOrderId,
        product_id: uuidRegex.test(product.id) ? product.id : null,
        quantity: quantity,
        price_at_time: product.price,
        total_price: (product.price || 0) * quantity
      };
      await supabase.from('order_items').insert([orderItemPayload]);

      // Atomic stock deduction
      if (uuidRegex.test(product.id)) {
        try {
          const { error: rpcErr } = await supabase.rpc('decrement_stock', {
            p_product_id: product.id,
            p_qty: quantity
          });
          if (rpcErr) throw rpcErr;
        } catch {
          const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', product.id).single();
          if (prod && prod.stock_quantity != null) {
            await supabase.from('products').update({ stock_quantity: Math.max(0, prod.stock_quantity - quantity) }).eq('id', product.id);
          }
        }
      }

      toast.success(
        paymentType === 'Card'
          ? `Order Placed! Tracking #${trackingNumber}`
          : `Cash on Delivery Booked! Tracking #${trackingNumber}`
      );

      window.dispatchEvent(new Event('orders_updated'));
      navigate('/orders');
    } catch (err: any) {
      console.error('Order creation handler error:', err);
      toast.error('Order Error: ' + (err.message || 'Check database connection'));
      setIsBuyNowModalOpen(false);
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

                    {/* SELECT SIZE Section */}
                    {!isSaree ? (
                      <div className={`space-y-3 p-3.5 rounded-2xl transition-all ${sizeError ? 'bg-red-50/70 border border-red-300 ring-2 ring-red-200' : 'bg-gray-50/50 border border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-widest text-gray-800 font-bold flex items-center gap-1.5">
                            SELECT SIZE
                            <span className="text-red-500 font-bold">*</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsSizeChartOpen(true)}
                            className="text-xs font-bold text-[#698156] hover:text-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Ruler className="w-3.5 h-3.5 text-[#698156]" />
                            SIZE CHART &gt;
                          </button>
                        </div>

                        {sizeError && (
                          <p className="text-xs font-bold text-red-600 animate-pulse flex items-center gap-1">
                            ⚠️ Please select a size before proceeding to Buy Now or Cart!
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2.5">
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size, sIdx) => {
                            const isSelected = selectedSize === size;
                            const isLowStock = size === 'XS' || size === 'S';

                            return (
                              <div key={size} className="flex flex-col items-center">
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedSize(size);
                                    setSizeError(false);
                                  }}
                                  className={`w-12 h-12 rounded-full border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                                    isSelected
                                      ? 'border-[#698156] bg-[#698156] text-white shadow-md ring-2 ring-[#698156]/30'
                                      : 'border-gray-300 text-gray-800 hover:border-gray-900 bg-white'
                                  }`}
                                >
                                  {size}
                                </motion.button>
                                {isLowStock && (
                                  <span className="text-[10px] font-bold text-orange-600 mt-1">
                                    {sIdx === 0 ? '4 left' : '2 left'}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-800 block">Drape Size</span>
                          <span className="text-xs text-gray-500">Traditional 5.5m Saree + 0.8m Blouse Piece</span>
                        </div>
                        <span className="text-xs font-bold text-[#698156] bg-white px-3 py-1 rounded-full border border-[#DCE4D7]">
                          Free Size
                        </span>
                      </div>
                    )}

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
                        className={`w-full h-13 rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          !isSaree && !selectedSize
                            ? 'bg-[#F4F6F2] hover:bg-[#EBF0E6] text-[#698156] border-2 border-[#DCE4D7]'
                            : 'bg-[#698156] hover:bg-[#546944] text-white border-2 border-[#698156]'
                        }`}
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

      {/* ═══ INTERACTIVE SIZE CHART MODAL ═══ */}
      <AnimatePresence>
        {isSizeChartOpen && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeChartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-[#698156]" />
                  <h3 className="font-serif text-xl font-bold text-gray-900">Garment Size Chart</h3>
                </div>
                <button
                  onClick={() => setIsSizeChartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                All measurements are in inches. Standard tailored Indian sizing.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5">Size</th>
                      <th className="px-3 py-2.5">Bust (in)</th>
                      <th className="px-3 py-2.5">Waist (in)</th>
                      <th className="px-3 py-2.5">Hip (in)</th>
                      <th className="px-3 py-2.5">Length (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800">
                    {[
                      { size: 'XS', bust: '32', waist: '26', hip: '35', length: '44' },
                      { size: 'S', bust: '34', waist: '28', hip: '37', length: '45' },
                      { size: 'M', bust: '36', waist: '30', hip: '39', length: '45.5' },
                      { size: 'L', bust: '38', waist: '32', hip: '41', length: '46' },
                      { size: 'XL', bust: '40', waist: '34', hip: '43', length: '46.5' },
                      { size: 'XXL', bust: '42', waist: '36', hip: '45', length: '47' },
                    ].map((row) => (
                      <tr key={row.size} className={selectedSize === row.size ? 'bg-amber-50/60 font-bold text-[#698156]' : 'hover:bg-gray-50'}>
                        <td className="px-3 py-2.5 font-black">{row.size}</td>
                        <td className="px-3 py-2.5">{row.bust}"</td>
                        <td className="px-3 py-2.5">{row.waist}"</td>
                        <td className="px-3 py-2.5">{row.hip}"</td>
                        <td className="px-3 py-2.5">{row.length}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setIsSizeChartOpen(false)}
                  className="w-full py-3 bg-[#1A1A1A] hover:bg-[#546944] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />

      {/* Buy Now Process Modal */}
      <AnimatePresence>
        {isBuyNowModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] flex flex-col overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                buyNowStep === 'checkout' ? 'max-w-4xl' : 'max-w-lg'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsBuyNowModalOpen(false)}
                className="absolute top-5 right-5 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full transition-colors z-20"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* ════════ Step 1: Mobile Number Verification (Phone Step) ════════ */}
              {buyNowStep === 'phone' && (
                <div className="space-y-6 text-center py-2">
                  {/* Top Aanya Fashions Logo */}
                  <div className="flex justify-center mb-2">
                    <img src="/logo.png" alt="Aanya Fashions" className="h-14 w-auto object-contain" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-gray-900">Mobile Number Verification</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1.5 max-w-sm mx-auto">
                      Enter your mobile number to receive verification code via SMS OTP.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-sm mx-auto text-left">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                        Mobile Number (+91)
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-sm font-bold text-gray-500">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          value={buyNowPhone}
                          onChange={(e) => setBuyNowPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-sm font-semibold pl-14 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20 transition-all"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSendingOtp}
                      onClick={handleSendOTP}
                      className="w-full py-4 bg-[#698156] hover:bg-[#546944] text-white font-black uppercase tracking-wider rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Sending OTP Code...
                        </>
                      ) : (
                        <>
                          Send OTP Verification Code <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ════════ Step 2: OTP Verification Step ════════ */}
              {buyNowStep === 'otp' && (
                <div className="space-y-6 text-center py-2">
                  {/* Top Aanya Fashions Logo */}
                  <div className="flex justify-center mb-2">
                    <img src="/logo.png" alt="Aanya Fashions" className="h-14 w-auto object-contain" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-gray-900">Enter Verification Code</h3>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1">
                      OTP sent to the entered mobile number: <span className="font-black text-[#698156]">+91 {buyNowPhone}</span>
                      <button onClick={() => setBuyNowStep('phone')} className="ml-2 text-xs font-bold text-[#698156] underline">
                        Edit
                      </button>
                    </p>
                  </div>

                  <div className="space-y-4 max-w-sm mx-auto text-left">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                        6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP (e.g. 123456)"
                        value={buyNowOtp}
                        onChange={(e) => setBuyNowOtp(e.target.value)}
                        className="w-full text-center text-lg font-mono font-bold tracking-[0.3em] px-4 py-3.5 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20 transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs px-1">
                      <button
                        type="button"
                        onClick={() => setBuyNowStep('phone')}
                        className="text-gray-500 hover:text-gray-800 underline cursor-pointer"
                      >
                        Change number
                      </button>
                      <button
                        type="button"
                        disabled={buyNowCooldown > 0 || isSendingOtp}
                        onClick={handleSendOTP}
                        className="text-[#698156] font-bold hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {buyNowCooldown > 0 ? `Resend Code (${buyNowCooldown}s)` : 'Resend Code'}
                      </button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isVerifyingOtp}
                      onClick={handleVerifyOTP}
                      className="w-full py-4 bg-[#698156] hover:bg-[#546944] text-white font-black uppercase tracking-wider rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Verifying OTP...
                        </>
                      ) : (
                        <>
                          Verify & Proceed to Checkout <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ════════ Step 3: Checkout Main View (2-Column Cards + Price Breakdown) ════════ */}
              {buyNowStep === 'checkout' && (
                <div className="space-y-5 overflow-y-auto pr-1">
                  {/* Top Header with Aanya Fashions Logo */}
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-100 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <img src="/logo.png" alt="Aanya Fashions" className="h-11 w-auto object-contain" />
                      <div>
                        <h3 className="font-serif text-xl sm:text-2xl text-gray-900">Order Summary & Shipping</h3>
                        <p className="text-xs text-gray-500">Verified Mobile: +91 {buyNowPhone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#698156] bg-[#F4F6F2] px-3 py-1 rounded-full border border-[#DCE4D7]">
                      Express Buy Now
                    </span>
                  </div>

                  {/* Main Grid: Left Side (Product Details & User Details) vs Right Side (Full Price Breakdown) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: Top Left Product Details Card + Bottom Left User Details Card */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* TOP LEFT CARD: Details of Product */}
                      <div className="bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
                        <span className="text-[10px] font-black text-[#698156] uppercase tracking-wider block">
                          📦 Product Details
                        </span>
                        <div className="flex gap-4 items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-white rounded-xl border border-gray-200 p-1 flex-shrink-0"
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="font-serif text-base sm:text-lg text-gray-900 truncate leading-snug">{product.name}</h4>
                            <p className="text-xs text-gray-500">Category: <span className="font-semibold text-gray-700">{product.category}</span></p>
                            <p className="text-xs text-gray-500">Selected Size: <span className="font-semibold text-[#698156]">{selectedSize || 'Standard Free Size'}</span> | Qty: <span className="font-semibold text-gray-900">{quantity}</span></p>
                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-1">
                              <Truck className="w-3.5 h-3.5" /> Estimated Delivery: <span className="underline">{new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BOTTOM LEFT CARD: User Details */}
                      <div className="bg-[#F4F6F2]/30 p-4 sm:p-5 rounded-2xl border border-[#DCE4D7]/80 shadow-sm space-y-3">
                        <span className="text-[10px] font-black text-[#698156] uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Customer & Shipping Contact
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Customer Full Name *</label>
                            <input
                              type="text"
                              name="fullName"
                              placeholder="Enter Full Name"
                              value={orderForm.fullName}
                              onChange={handleInputChange}
                              className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-[#698156]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Verified Phone *</label>
                            <input
                              type="text"
                              name="phone"
                              value={orderForm.phone || buyNowPhone}
                              onChange={handleInputChange}
                              className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-gray-50 text-gray-700 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Delivery Street Address *</label>
                          <input
                            type="text"
                            name="address"
                            placeholder="Flat No / House No / Street Address"
                            value={orderForm.address}
                            onChange={handleInputChange}
                            className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-[#698156]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">City *</label>
                            <input
                              type="text"
                              name="city"
                              placeholder="City"
                              value={orderForm.city}
                              onChange={handleInputChange}
                              className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-[#698156]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Pincode *</label>
                            <input
                              type="text"
                              name="pincode"
                              placeholder="Pincode"
                              value={orderForm.pincode}
                              onChange={handleInputChange}
                              className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-[#698156]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE FULL SECTION: Full Price Section Card */}
                    <div className="lg:col-span-5 bg-[#FFFDF9] p-5 rounded-2xl border-2 border-[#F5E6BE] shadow-md flex flex-col justify-between space-y-4">
                      <div>
                        <div className="border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
                          <h4 className="font-serif text-lg text-gray-900">Price Breakdown</h4>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Inclusive of Taxes
                          </span>
                        </div>

                        {(() => {
                          const basePrice = product.price * quantity;
                          const comparePrice = (product.compare_at_price || product.price * 1.3) * quantity;
                          const discountVal = Math.max(0, comparePrice - basePrice);
                          const totalGst = Math.round(basePrice * 0.18);
                          const cgst = Math.round(totalGst / 2);
                          const sgst = totalGst - cgst;

                          return (
                            <div className="space-y-3 text-xs">
                              <div className="flex justify-between text-gray-600">
                                <span>Product MRP (Full Price):</span>
                                <span className="font-semibold text-gray-900">₹{comparePrice.toLocaleString('en-IN')}</span>
                              </div>

                              {discountVal > 0 && (
                                <div className="flex justify-between text-emerald-700 font-semibold">
                                  <span>Instant Discount:</span>
                                  <span>- ₹{discountVal.toLocaleString('en-IN')}</span>
                                </div>
                              )}

                              <div className="flex justify-between text-gray-600">
                                <span>Subtotal (Base Price):</span>
                                <span className="font-semibold text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
                              </div>

                              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1 text-[11px] text-gray-500">
                                <div className="flex justify-between">
                                  <span>CGST (9%):</span>
                                  <span className="font-medium text-gray-800">₹{cgst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>SGST (9%):</span>
                                  <span className="font-medium text-gray-800">₹{sgst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-gray-200 font-bold text-gray-700">
                                  <span>Total GST Included (18%):</span>
                                  <span>₹{totalGst.toLocaleString('en-IN')}</span>
                                </div>
                              </div>

                              <div className="flex justify-between text-gray-600">
                                <span>Delivery Fee:</span>
                                <span className="font-bold text-emerald-600 uppercase">Free</span>
                              </div>

                              <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-2 flex justify-between items-center text-sm">
                                <span className="font-black text-gray-900 uppercase tracking-wider">Total Amount:</span>
                                <span className="font-serif text-2xl font-black text-[#698156]">₹{basePrice.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Main Continue Button */}
                      <div className="pt-4 border-t border-gray-200">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isSubmitting}
                          onClick={() => {
                            if (!isUserProfileComplete()) {
                              setShowProfileModal(true);
                              return;
                            }
                            setBuyNowStep('success');
                          }}
                          className="w-full py-4 bg-[#698156] hover:bg-[#546944] text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          Place Order <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ Step 4: Success View ════════ */}
              {buyNowStep === 'success' && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-serif text-3xl text-gray-900">Confirm Your Order</h3>
                    <p className="text-gray-500 text-xs mt-1">Please review your details and confirm to place your order securely.</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl text-left space-y-2 border border-gray-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Verified Contact:</span>
                      <span className="font-bold text-gray-900">+91 {orderForm.phone || buyNowPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer Name:</span>
                      <span className="font-bold text-gray-900">{orderForm.fullName}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-sm">
                      <span className="text-gray-700">Total Amount Paid:</span>
                      <span className="text-[#698156]">₹{(product.price * quantity).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setIsBuyNowModalOpen(false)}
                      className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs"
                    >
                      Close
                    </button>
                    <button
                      disabled={isSubmitting}
                      onClick={() => {
                        if (!isUserProfileComplete()) {
                          setShowProfileModal(true);
                          return;
                        }
                        handleCreateOrder('COD');
                      }}
                      className="flex-1 py-3 bg-[#698156] hover:bg-[#546944] text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : (
                        "Confirm Order"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile completion modal when placing order */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSaveSuccess={(details) => {
          setOrderForm(prev => ({
            ...prev,
            fullName: details.name || prev.fullName,
            phone: details.phone || prev.phone,
            address: details.address || prev.address,
            city: details.city || prev.city,
            pincode: details.pincode || prev.pincode,
          }));
          if (buyNowStep === 'success') {
            handleCreateOrder('COD');
          } else {
            setBuyNowStep('success');
          }
        }}
        title="My Profile"
        subtitle="Please enter your profile information to continue"
        actionButtonText="Save & Place Order"
      />
    </div>
  );
} 
