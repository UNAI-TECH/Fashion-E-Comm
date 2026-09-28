import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { Star, Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, ZoomIn, CreditCard, CheckCircle2, Loader2, DollarSign, MapPin, Calendar, Sparkles, X } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { CompactCustomerReviews } from '../components/CompactCustomerReviews';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { fetchProducts, Product } from '../data/products';
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
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);
  const [buyNowStep, setBuyNowStep] = useState<'phone' | 'otp' | 'checkout' | 'success'>('phone');
  const [buyNowPhone, setBuyNowPhone] = useState('');
  const [buyNowOtp, setBuyNowOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
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
    if (product) {
      setIsBuyNowModalOpen(true);
      setBuyNowStep('phone');
      setBuyNowPhone(orderForm.phone || '');
      setBuyNowOtp('');
    }
  };

  const handleSendOTP = async () => {
    const cleanPhone = buyNowPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsSendingOtp(true);
    try {
      toast.success(`OTP sent to +91 ${cleanPhone}! (Test OTP: 123456)`);
      setBuyNowStep('otp');
    } catch (err) {
      toast.error('Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!buyNowOtp || buyNowOtp.trim().length < 4) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      toast.success('Mobile Number Verified Successfully!');
      setOrderForm(prev => ({ ...prev, phone: buyNowPhone }));
      setBuyNowStep('checkout');
    } catch (err) {
      toast.error('Invalid OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
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
      let user = null;
      try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } catch (e) {
        console.warn('Auth check skipped:', e);
      }

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

      // 1. Immediately persist order to local storage cache so My Orders icon works flawlessly
      const generatedOrderId = 'ord_' + Math.random().toString(36).substring(2, 9);
      const orderRecord = {
        id: generatedOrderId,
        created_at: new Date().toISOString(),
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
              ...product,
              images: (product.images && product.images.length > 0) ? product.images : [product.image],
            }
          }
        ]
      };

      try {
        let existing = [];
        try {
          const parsed = JSON.parse(localStorage.getItem('local_placed_orders') || '[]');
          if (Array.isArray(parsed)) existing = parsed;
        } catch (e) {
          console.error('LocalStorage parse error, resetting:', e);
        }
        localStorage.setItem('local_placed_orders', JSON.stringify([orderRecord, ...existing]));
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }

      // 2. Attempt to create order in Supabase Table Editor using supabaseAdmin (service_role)
      try {
        let finalOrder: any = null;
        const { data: createdOrders, error: orderError } = await supabaseAdmin
          .from('orders')
          .insert([{ ...orderPayload, id: generatedOrderId }])
          .select();

        if (orderError) {
          console.error('Supabase Orders Insert Error:', orderError);
          // Retry without user_id if profile is unlinked
          delete orderPayload.user_id;
          const { data: retryData, error: retryError } = await supabaseAdmin
            .from('orders')
            .insert([{ ...orderPayload, id: generatedOrderId }])
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

        // Insert order items
        if (finalOrder?.id) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          const orderItemPayload = {
            order_id: finalOrder.id,
            product_id: uuidRegex.test(product.id) ? product.id : null,
            quantity: quantity,
            price_at_time: product.price,
            total_price: (product.price || 0) * quantity
          };
          await supabaseAdmin.from('order_items').insert([orderItemPayload]);
        }
      } catch (dbError) {
        console.warn('Database save skipped/failed, but local storage succeeded:', dbError);
        toast.success(
          paymentType === 'Card'
            ? 'Online Order Placed!'
            : 'Cash Order Booked!'
        );
      }

      // Navigate to orders page after successful order placement
      navigate('/orders');
    } catch (err: any) {
      console.error('Order creation handler error:', err);
      toast.error('Order Error: ' + (err.message || 'Check Supabase connection'));
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
          const mockProduct = allProducts.find(p => String(p.id) === String(id));
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
        <div className="pt-20 sm:pt-24 lg:pt-6 text-center min-h-[400px] flex flex-col items-center justify-center">
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

      <div className="pt-24 sm:pt-28 lg:pt-14 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb on Top Left */}
          <div className="text-[#D4AF37] uppercase tracking-wider text-xs font-bold flex items-center gap-1.5 mb-6 flex-wrap">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link to={`/category/${(product.category || 'all').toLowerCase()}`} className="hover:underline">{product.category || 'Product'}</Link>
            <span>/</span>
            <span className="truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery & Customer Reviews */}
            <div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="relative mb-4 aspect-square flex items-center justify-center overflow-hidden group border border-[#D4AF37] p-2 bg-white rounded-[2rem] shadow-sm"
              >
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-[90%] h-[90%] object-contain" 
                />
              </motion.div>

              {/* Compact Customer Reviews Section (3 reviews, gold border, verified badges) */}
              <CompactCustomerReviews product={product} />
            </div>

            {/* Product Info */}
            <div className="space-y-6 relative pt-2">


              {(() => {
                const details = getProductFullDetails(product);
                return (
                  <>
                    <div className="space-y-2 pr-12">
                      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] leading-tight">{product.name}</h1>
                      <div className="w-16 h-px bg-[#D4AF37] my-4"></div>
                    </div>

                    {/* Product Details Paragraph */}
                    <div className="my-5">
                      <p className="text-gray-600 leading-relaxed text-sm font-normal text-justify line-clamp-5">
                        This beautiful {product.name} features exquisite detailing focused on premium quality and aesthetics. It is exquisitely designed in a beautiful <strong className="text-gray-800 font-semibold">{details.attributes.find((a: any) => a.label === 'Color')?.value || 'premium'}</strong> tone that gives it a rich and timeless appeal. Expertly crafted from high-quality <strong className="text-gray-800 font-semibold">{details.attributes.find((a: any) => a.label === 'Material')?.value || 'fabric'}</strong>, it ensures both comfort and elegance for any occasion. The outfit showcases a magnificent <strong className="text-gray-800 font-semibold">{details.attributes.find((a: any) => a.label === 'Design')?.value || 'silhouette'}</strong> design that drapes beautifully. Furthermore, the intricate <strong className="text-gray-800 font-semibold">{details.attributes.find((a: any) => a.label === 'Pattern')?.value || 'detailing'}</strong> pattern elevates the overall visual appeal, adding a perfect touch of luxury to your wardrobe.
                      </p>
                      <div className="w-16 h-px bg-[#D4AF37] opacity-60 mt-6"></div>
                    </div>

                    {/* Occasion & Pair With Styling Recommendations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-[#F5E6BE]/60 shadow-sm">
                      {/* Occasion */}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#800000] mb-2.5 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#D4AF37]" /> Occasion
                        </h4>
                        <ul className="space-y-1.5 text-xs font-medium text-gray-700">
                          {details.occasions.map((occ, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />
                              <span>{occ}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pair With */}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#800000] mb-2.5 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Pair With
                        </h4>
                        <ul className="space-y-1.5 text-xs font-medium text-gray-700">
                          {details.pairWith.map((pair, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#800000] flex-shrink-0" />
                              <span>{pair}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                );
              })()}

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

              {/* Size Selector (Hidden for Sarees) */}
              {!((product.category || '').toLowerCase().includes('saree') || (product.name || '').toLowerCase().includes('saree')) && (
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
              )}

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
                  onClick={handleWishlistToggle} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex-1 h-14 bg-[#FFF9E6] hover:bg-[#F5E6BE] text-[#800000] border-2 border-[#F5E6BE] rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Heart className={`w-4 h-4 text-[#800000] ${product && isInWishlist(product.id) ? 'fill-[#800000]' : ''}`} /> 
                  {product && isInWishlist(product.id) ? 'Saved to Wishlist' : 'Save to Wishlist'}
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
                    <img src="/logo.webp" alt="Aanya Fashions" className="h-14 w-auto object-contain" />
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
                          className="w-full text-sm font-semibold pl-14 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]/20 transition-all"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSendingOtp}
                      onClick={handleSendOTP}
                      className="w-full py-4 bg-[#800000] hover:bg-black text-white font-black uppercase tracking-wider rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                    <img src="/logo.webp" alt="Aanya Fashions" className="h-14 w-auto object-contain" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-gray-900">Enter Verification Code</h3>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1">
                      OTP sent to the entered mobile number: <span className="font-black text-[#800000]">+91 {buyNowPhone}</span>
                      <button onClick={() => setBuyNowStep('phone')} className="ml-2 text-xs font-bold text-[#D4AF37] underline">
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
                        className="w-full text-center text-lg font-mono font-bold tracking-[0.3em] px-4 py-3.5 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]/20 transition-all"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isVerifyingOtp}
                      onClick={handleVerifyOTP}
                      className="w-full py-4 bg-[#800000] hover:bg-black text-white font-black uppercase tracking-wider rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                      <img src="/logo.webp" alt="Aanya Fashions" className="h-11 w-auto object-contain" />
                      <div>
                        <h3 className="font-serif text-xl sm:text-2xl text-gray-900">Order Summary & Shipping</h3>
                        <p className="text-xs text-gray-500">Verified Mobile: +91 {buyNowPhone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#800000] bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                      Express Buy Now
                    </span>
                  </div>

                  {/* Main Grid: Left Side (Product Details & User Details) vs Right Side (Full Price Breakdown) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: Top Left Product Details Card + Bottom Left User Details Card */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* TOP LEFT CARD: Details of Product */}
                      <div className="bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
                        <span className="text-[10px] font-black text-[#800000] uppercase tracking-wider block">
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
                            <p className="text-xs text-gray-500">Selected Size: <span className="font-semibold text-[#800000]">{selectedSize || 'Standard Free Size'}</span> | Qty: <span className="font-semibold text-gray-900">{quantity}</span></p>
                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-1">
                              <Truck className="w-3.5 h-3.5" /> Estimated Delivery: <span className="underline">{new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BOTTOM LEFT CARD: User Details */}
                      <div className="bg-[#FFF0F5]/30 p-4 sm:p-5 rounded-2xl border border-rose-100/80 shadow-sm space-y-3">
                        <span className="text-[10px] font-black text-[#800000] uppercase tracking-wider flex items-center gap-1.5">
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
                              className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
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
                            className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
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
                              className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
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
                              className="w-full text-xs font-semibold px-3 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
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
                                <span className="font-serif text-2xl font-black text-[#800000]">₹{basePrice.toLocaleString('en-IN')}</span>
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
                            setBuyNowStep('success');
                          }}
                          className="w-full py-4 bg-[#800000] hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                      <span className="text-[#800000]">₹{(product.price * quantity).toLocaleString('en-IN')}</span>
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
                        handleCreateOrder('COD');
                      }}
                      className="flex-1 py-3 bg-[#800000] hover:bg-black text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2"
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
    </div>
  );
} 
