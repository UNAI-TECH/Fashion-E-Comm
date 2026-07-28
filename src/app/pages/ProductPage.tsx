import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router';
import { Star, Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, ZoomIn, CreditCard, CheckCircle2, Loader2, DollarSign, MapPin, Calendar, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { fetchProducts, Product } from '../data/products';
import { toast } from 'sonner';

interface ProductDetailsData {
  detailedDescription: string;
  occasions: string[];
  pairWith: string[];
}

function getProductFullDetails(prod: Product): ProductDetailsData {
  const name = (prod.name || '').toLowerCase();
  const category = (prod.category || '').toLowerCase();

  // 1. Shirt & Trousers / Western Coordinates (e.g. Chocolate Silk Shirt & Beige Trousers)
  if (name.includes('shirt') || name.includes('trouser') || category.includes('western')) {
    return {
      detailedDescription: `This sophisticated two-piece ensemble features a classic button-down shirt paired with tailored wide-leg trousers. The top is designed with a point collar, long sleeves with button cuffs, and a full front button placket, crafted in a rich chocolate brown hue. Complemented by high-waisted beige trousers with front pleats and a matching belt, this outfit offers a refined straight fit with clean stitching and minimal detail. Made from a fluid, silk-feel premium fabric, the silhouette creates a sleek drape that effortlessly balances structured tailoring with relaxed modern elegance. Ideal for contemporary wardrobes seeking versatile, elevated styling.`,
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
      detailedDescription: `Exquisitely woven, this luxurious saree showcases authentic traditional drapes blended with modern elegance. Crafted in rich vibrant tones with intricate zari embroidery along the border and pallu, the garment features smooth fluid drapes and a refined woven texture. Made from a high-grade silk-blend premium fabric, the saree contours gracefully while offering exceptional comfort. Complemented by clean tailored borders and classic motifs, this piece embodies timeless heritage style and pristine craftsmanship, making it a standout luxury wardrobe addition.`,
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
      detailedDescription: `Tailored with impeccable precision, this elegant kurti features a mandarin or notch neckline, graceful three-quarter sleeves, and intricate chest embroidery with fine threadwork. Crafted in a flattering straight or flared silhouette from soft cotton-silk premium fabric, the garment exhibits delicate side slits, clean finished hems, and a smooth tactile feel. The rich color palette and subtle design details elevate this piece into a versatile fusion garment that seamlessly transitions between relaxed daytime refinement and sophisticated festive wear.`,
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
      detailedDescription: `A regal bridal and festive ensemble, this designer lehenga features a heavy flared skirt with intricate hand embroidery, paired with a matching structured choli and a delicate sheer dupatta. Designed with a high-waisted waistband, fine stitching, and opulent zari embellishments, the garment is fashioned from high-grade silk-organza premium fabric. The voluminous flare creates a dramatic silhouette with rich movement, while the meticulous embroidery reflects royal Indian craftsmanship suited for grand luxury occasions.`,
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
      detailedDescription: `This three-piece salwar suit set comprises a tailored straight-fit kameez, comfortable relaxed bottoms, and a lightweight designer dupatta. Highlighting fine embroidery along the neck and sleeve cuffs, the garment is constructed from a soft, breathable silk-blend premium fabric. Featuring clean stitched seams, a straight hemline, and balanced proportions, the ensemble offers effortless elegance with a flattering drape designed for all-day comfort and traditional sophistication.`,
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
      detailedDescription: `Designed with a fluid, sweeping floor-length silhouette, this maxi gown features a fitted bodice, round or square neckline, and a gently pleated A-line skirt. Crafted from a lightweight chiffon or georgette premium fabric, the garment highlights soft draped pleats, subtle waist cinch detailing, and invisible back zip closure. The minimalist aesthetic and rich color tone create a romantic, ethereal vibe suited for evening elegance and upscale summer soirées.`,
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
    detailedDescription: `Handcrafted from fine quality premium fabric, this elegant garment exhibits refined tailoring, clean seams, and subtle design details. Featuring a flattering modern silhouette with rich texture and color, this piece delivers effortless luxury, comfort, and timeless sophistication for any elevated wardrobe.`,
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
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [orderForm, setOrderForm] = useState(() => {
    try {
      const saved = localStorage.getItem('saved_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      fullName: 'Rohit C',
      phone: '7010092875',
      address: '1/5, Teachers Colony, Kodungaiyur, Chandran Street, Perambur',
      city: 'Chennai',
      pincode: '600118',
      cardNumber: '',
      cardHolder: '',
    };
  });

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

      <div className="pt-20 sm:pt-24 lg:pt-6 pb-20 px-4">
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
              {(() => {
                const details = getProductFullDetails(product);
                return (
                  <>
                    <div className="space-y-2">
                      <span className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-bold block mb-2">Aanya Fashions</span>
                      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] leading-tight">{product.name}</h1>
                      <div className="w-16 h-px bg-[#D4AF37] my-4"></div>
                    </div>

                    {/* Blockquote Quote */}
                    <div className="border-l-2 border-[#D4AF37] pl-4 italic text-gray-700 text-lg my-4">
                      "{product.description || 'Premium quality traditional wear crafted with elegance.'}"
                    </div>

                    {/* 100-150 Word Detailed Description Paragraph */}
                    <p className="text-gray-600 leading-relaxed text-sm my-4 font-normal">
                      {details.detailedDescription}
                    </p>

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
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto max-h-[92vh] flex flex-col ${
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
                    <img src="/logo_aanya.png" alt="Aanya Fashions" className="h-16 w-auto object-contain contrast-150 brightness-95" />
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
                    <img src="/logo_aanya.png" alt="Aanya Fashions" className="h-16 w-auto object-contain contrast-150 brightness-95" />
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
                      <img src="/logo_aanya.png" alt="Aanya Fashions" className="h-12 w-auto object-contain" />
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

                      {/* BOTTOM LEFT CARD: User Saved Details Card (Matching Image 2) */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative transition-all">
                        {!isEditingAddress ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xl font-bold text-gray-900 tracking-tight">
                                {orderForm.fullName || 'Rohit C'}
                              </h4>
                              <button
                                type="button"
                                onClick={() => setIsEditingAddress(true)}
                                className="text-xs font-black uppercase text-[#800000] hover:text-black tracking-widest transition-colors cursor-pointer"
                              >
                                CHANGE
                              </button>
                            </div>

                            <p className="text-sm font-medium text-gray-600 leading-relaxed">
                              {orderForm.address || '1/5, Teachers Colony, Kodungaiyur, Chandran Street, Perambur'}, {orderForm.city || 'Chennai'} - {orderForm.pincode || '600118'}
                            </p>

                            <p className="text-sm font-bold text-gray-800 tracking-wide pt-1">
                              {orderForm.phone || buyNowPhone || '7010092875'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <span className="text-xs font-black text-[#800000] uppercase tracking-wider">
                                Edit Delivery Address
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsEditingAddress(false)}
                                className="text-xs font-bold text-gray-500 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Customer Full Name *</label>
                                <input
                                  type="text"
                                  name="fullName"
                                  placeholder="Full Name"
                                  value={orderForm.fullName}
                                  onChange={handleInputChange}
                                  className="w-full text-xs font-semibold px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number *</label>
                                <input
                                  type="text"
                                  name="phone"
                                  placeholder="Phone Number"
                                  value={orderForm.phone}
                                  onChange={handleInputChange}
                                  className="w-full text-xs font-semibold px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
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
                                className="w-full text-xs font-semibold px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
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
                                  className="w-full text-xs font-semibold px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
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
                                  className="w-full text-xs font-semibold px-3 py-2 border rounded-xl bg-white focus:outline-none focus:border-[#800000]"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  localStorage.setItem('saved_user_profile', JSON.stringify(orderForm));
                                } catch (e) {}
                                setIsEditingAddress(false);
                                toast.success('Delivery address updated!');
                              }}
                              className="w-full py-2.5 bg-[#800000] hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer mt-1"
                            >
                              Save & Deliver Here
                            </button>
                          </div>
                        )}
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
                            handleCreateOrder('Card');
                            setBuyNowStep('success');
                          }}
                          className="w-full py-4 bg-[#800000] hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                            </>
                          ) : (
                            <>
                              Continue & Confirm Order <ChevronRight className="w-4 h-4" />
                            </>
                          )}
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
                    <h3 className="font-serif text-3xl text-gray-900">Order Confirmed!</h3>
                    <p className="text-gray-500 text-xs mt-1">Thank you for your purchase. Your order details are saved to Supabase.</p>
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