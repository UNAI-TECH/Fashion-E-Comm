import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Package, Heart, ChevronDown, ArrowRight, X, Phone, Plus, Minus, Trash2, Menu, Clock, ArrowLeft, ShoppingBag, Camera } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Link, useLocation, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Product, fetchProducts } from '../data/products';
import { toast } from 'sonner';
import { intelligentSearch, getRecommendedFallback, getSearchSuggestions } from '../../lib/aiSearchEngine';

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  const terms = highlight.toLowerCase().split(/\s+/).filter(w => w.length > 2); // only highlight words > 2 chars
  if (terms.length === 0) return <>{text}</>;
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-[#800000] font-black bg-[#800000]/10 px-0.5 rounded">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { wishlistItems, wishlistCount, removeFromWishlist } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isMobileCollectionOpen, setIsMobileCollectionOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isFallbackSearch, setIsFallbackSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('search_history') || '[]'); } catch { return []; }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showMobileAppOpening, setShowMobileAppOpening] = useState(false);
  const [mobileAppOpeningStep, setMobileAppOpeningStep] = useState<1 | 2>(1);
  const [profileDetails, setProfileDetails] = useState(() => {
    try {
      const saved = localStorage.getItem('user_profile_details');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: '',
      gender: '',
      phone: '',
      email: '',
      address: ''
    };
  });
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('user_profile_image') || '';
  });

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setProfileImage(resultStr);
        localStorage.setItem('user_profile_image', resultStr);
        toast.success('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem('user_profile_details', JSON.stringify(profileDetails));
    toast.success('Profile details saved successfully!');
    setIsAccountOpen(false);
  };  // Always navigate to full collection / category page on search submit
  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    addToHistory(query.trim());
    setIsSearchOpen(false);
    setSearchQuery('');
    
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  // Load all catalog products when search opens
  useEffect(() => {
    if (!isSearchOpen) return;
    fetchProducts().then(products => setAllProducts(products));
  }, [isSearchOpen]);

  // Check & show mobile app opening onboarding screen on app launch (<640px)
  useEffect(() => {
    try {
      const hasOpened = localStorage.getItem('has_opened_mobile_app_onboarding');
      if (!hasOpened && window.innerWidth < 640) {
        setShowMobileAppOpening(true);
      }
    } catch (e) {}
  }, []);

  // Automatically transition Screen 1 to Screen 2 after 2 seconds
  useEffect(() => {
    if (showMobileAppOpening && mobileAppOpeningStep === 1) {
      const timer = setTimeout(() => {
        setMobileAppOpeningStep(2);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showMobileAppOpening, mobileAppOpeningStep]);

  // Listen for 'open-search' event from HeroSection search button
  useEffect(() => {
    const handler = () => setIsSearchOpen(true);
    window.addEventListener('open-search', handler);
    return () => window.removeEventListener('open-search', handler);
  }, []);

  const handleFinishMobileAppOpening = () => {
    try {
      localStorage.setItem('user_profile_details', JSON.stringify(profileDetails));
      localStorage.setItem('has_opened_mobile_app_onboarding', 'true');
    } catch (e) {}
    toast.success('Welcome to Aanya Fashions!');
    setShowMobileAppOpening(false);
  };

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    setSearchHistory(prev => {
      const updated = [query, ...prev.filter(h => h !== query)].slice(0, 8);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (item: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(h => h !== item);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search_history');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleOpenWishlist = () => {
      setIsWishlistOpen(true);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('open-wishlist', handleOpenWishlist);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-wishlist', handleOpenWishlist);
    };
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      const queryTrimmed = searchQuery.trim();
      if (queryTrimmed.length === 0) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // 1. Load mock catalog
        const mockProducts = await fetchProducts();

        // 2. Fetch from Supabase (broad search to allow client-side AI to filter)
        // We fetch a larger pool so the AI can score them
        const { data: dbData } = await supabase
          .from('products')
          .select('id, name, category, description, price, images, image_url, status')
          .limit(200);

        // 3. Combine and deduplicate
        const allItems = [...mockProducts, ...(dbData || [])];
        const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values()) as Product[];

        // 4. Run AI Semantic Search
        let results = intelligentSearch(queryTrimmed, uniqueItems);

        // 5. Fallback Recommendations if no results
        if (results.length === 0) {
          results = getRecommendedFallback(uniqueItems);
          setIsFallbackSearch(true);
          setSearchSuggestions([]);
        } else {
          setIsFallbackSearch(false);
          setSearchSuggestions(getSearchSuggestions(queryTrimmed, uniqueItems));
        }

        setSearchResults(
          results.map((p: any) => ({
            ...p,
            image: (p.images && p.images.length > 0) ? p.images[0] : (p.image_url || p.image || ''),
          }))
        );
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);



  return (
    <>
      {/* ══════════ DESKTOP HEADER (2-row, Meesho style) ══════════ */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 z-[40] bg-white shadow-sm border-b border-gray-100">
        {/* Row 1: Logo | Search | Actions */}
        <div className="max-w-[1400px] mx-auto px-6 py-1 flex items-center gap-6">

          {/* Logo — Sleek, bold & compact height */}
          <Link to="/" className="flex items-center flex-shrink-0 h-14 sm:h-16 py-1 overflow-visible">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src="/logo.png"
              alt="Aanya Fashions"
              className="h-full w-auto object-contain object-left"
            />
          </Link>

          {/* Search Bar — compact height */}
          <div className="w-80 flex-shrink-0 relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Try Saree, Kurti or Search…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchDropdownOpen(false), 200)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(searchQuery); }}
                className="w-full pl-10 pr-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000]/20 transition-all"
              />
            </div>

            {/* Desktop Search Dropdown */}
            <AnimatePresence>
              {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-[80vh] overflow-y-auto z-50 p-3"
                >
                  {isSearching ? (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 rounded-full border-2 border-[#800000]/20 border-t-[#800000] animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-4">
                      {searchSuggestions.length > 0 && !isFallbackSearch && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Related Searches</p>
                          <div className="space-y-0.5">
                            {searchSuggestions.map(suggestion => (
                              <button
                                key={suggestion}
                                onClick={() => handleSearchSubmit(suggestion)}
                                className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-rose-50 transition-colors group text-left"
                              >
                                <Search className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                <span className="flex-1 text-xs font-medium text-gray-700 group-hover:text-[#800000] capitalize">
                                  <HighlightText text={suggestion} highlight={searchQuery} />
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Products</p>
                        {isFallbackSearch && (
                          <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50 rounded-lg mb-2 border border-gray-100">
                            No exact matches found. Showing recommendations:
                          </div>
                        )}
                        <div className="space-y-0.5">
                          {searchResults.map((product) => (
                            <Link
                              key={product.id}
                              to={`/product/${product.id}`}
                              onClick={() => { addToHistory(product.name); setIsSearchDropdownOpen(false); setSearchQuery(''); }}
                              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-rose-50 transition-colors group"
                            >
                              <div>
                                <p className="text-xs font-medium text-gray-800 group-hover:text-[#800000] transition-colors">
                                  <HighlightText text={product.name} highlight={searchQuery} />
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-gray-400">No results for &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsWishlistOpen(true)}
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#800000] transition-colors cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Wishlist</span>
            </motion.button>

            <Link to="/orders">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#800000] transition-colors cursor-pointer"
              >
                <Package className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Orders</span>
              </motion.div>
            </Link>


            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsAccountOpen(true)}
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#800000] transition-colors cursor-pointer"
              aria-label="Account"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span className="text-[10px] font-semibold">Profile</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Spacer so content sits below the fixed desktop header (~64px) */}
      <div className="hidden lg:block h-[64px]" aria-hidden="true" />

      {/* 4. Mobile Unified Navigation Pill (Mobile only) */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`lg:hidden fixed z-[40] transition-all duration-500 top-3.5 left-3 right-3 bg-white border border-gray-200/80 shadow-[0_6px_20px_rgba(0,0,0,0.08)] overflow-hidden ${
          isMobileMenuOpen ? 'rounded-[2rem]' : 'rounded-full'
        }`}
      >
        <div className="w-full pl-0.5 pr-2 py-0 bg-white flex items-center justify-between h-14 sm:h-16 rounded-full overflow-hidden">
          
          {/* Left side: Logo filling left side curve */}
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center h-10 sm:h-12 flex-shrink-0 overflow-visible pl-1">
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="flex items-center h-full py-0.5"
            >
              <img
                src="/logo.png"
                alt="Aanya Fashions Logo"
                className="h-full w-auto object-contain object-left"
              />
            </motion.div>
          </Link>

            {/* Center: Spacer for clean mobile layout */}
            <div className="flex-1"></div>

            {/* Right side: 3-Line Menu CTA Button */}
            <div className="flex items-center flex-shrink-0 mr-1">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-9 h-9 flex items-center justify-center bg-[#FEF5E7] border border-[#EAD5A0]/80 text-[#800000] rounded-full shadow-sm hover:bg-[#EAD5A0]/30 transition-all"
                aria-label="Toggle Menu Features"
              >
                {isMobileMenuOpen ? (
                  <X className="w-[18px] h-[18px] text-[#800000]" />
                ) : (
                  <Menu className="w-[18px] h-[18px] text-[#800000]" />
                )}
              </motion.button>
            </div>
        </div>

        {/* Inline Mobile Collection Categories Dropdown Menu */}
        <AnimatePresence>
          {isMobileCollectionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="px-3 py-3.5 bg-white rounded-b-[2rem] border-t border-gray-100 flex flex-wrap justify-center gap-2 shadow-lg"
            >
              {[
                { name: 'Kurti', path: '/category/kurtis' },
                { name: 'Saree', path: '/category/sarees' },
                { name: 'Salwar Set', path: '/category/salwar-sets' },
                { name: 'Maxi', path: '/category/maxi' },
                { name: 'Lehengas', path: '/category/lehengas' },
                { name: 'Western', path: '/category/western' },
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileCollectionOpen(false)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                    location.pathname === item.path
                      ? 'bg-[#800000] text-white border-[#800000]'
                      : 'bg-gray-50 hover:bg-[#FFF0F5] text-gray-800 hover:text-[#800000] border-gray-200/80 hover:border-[#800000]/30'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-white border-t border-gray-100 rounded-b-[2rem] shadow-xl"
            >
              <div className="px-6 py-6 space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Quick Actions</p>
                <div className="grid grid-cols-4 gap-3 justify-items-center">
                  {/* Search Action */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsSearchOpen(true);
                      }}
                      className="w-11 h-11 bg-amber-100/90 border border-amber-300 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-amber-200/90 transition-all"
                      aria-label="Search"
                    >
                      <Search className="w-5 h-5 stroke-[2.5]" />
                    </motion.button>
                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Search</span>
                  </div>


                  {/* My Orders Action */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-11 h-11 bg-emerald-100/90 border border-emerald-300 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-emerald-200/90 transition-all relative"
                      aria-label="My Orders"
                    >
                      <Package className="w-5 h-5 stroke-[2.5]" />
                    </Link>
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Orders</span>
                  </div>

                  {/* Account Action */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsAccountOpen(true);
                      }}
                      className="w-11 h-11 bg-indigo-100/90 border border-indigo-300 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-indigo-200/90 transition-all cursor-pointer"
                      aria-label="Account"
                    >
                      <User className="w-5 h-5 stroke-[2.5]" />
                    </motion.button>
                    <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">Account</span>
                  </div>

                  {/* Wishlist Action */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsWishlistOpen(true);
                      }}
                      className="w-11 h-11 bg-rose-100/90 border border-rose-300 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-rose-200/90 transition-all cursor-pointer"
                      aria-label="Wishlist"
                    >
                      <Heart className="w-5 h-5 stroke-[2.5]" />
                    </motion.button>
                    <span className="text-[9px] font-black text-rose-700 uppercase tracking-wider">Wishlist</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Full-Screen Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-4 sm:px-8 pt-12 sm:pt-10 pb-4 border-b border-gray-100">
              <button
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h2 className="flex-1 text-center text-base font-semibold text-gray-900 tracking-wide">Search</h2>
              <div className="w-9" />
            </div>

            {/* Search Input */}
            <div className="px-4 sm:px-8 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search women's wear..."
                  className="w-full pl-11 pr-10 py-3.5 bg-rose-50 rounded-2xl text-sm text-gray-800 placeholder:text-rose-300 outline-none focus:bg-white focus:ring-2 focus:ring-[#800000]/25 border border-rose-100 focus:border-[#800000]/30 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(searchQuery); }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">

              {searchQuery.trim().length === 0 ? (
                <>
                  {/* Suggestions */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-800 mb-3">Suggestions</p>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { label: 'Sarees',       bg: '#FEF2F2', color: '#991B1B' },
                        { label: 'Kurtis',       bg: '#FFFBEB', color: '#92400E' },
                        { label: 'Lehengas',     bg: '#F5F3FF', color: '#5B21B6' },
                        { label: 'Salwar Set',   bg: '#ECFDF5', color: '#065F46' },
                        { label: 'Western',      bg: '#EFF6FF', color: '#1D4ED8' },
                        { label: 'Maxi',         bg: '#FDF2F8', color: '#9D174D' },
                      ].map(({ label, bg, color }) => (
                        <button
                          key={label}
                          onClick={() => handleSearchSubmit(label)}
                          className="px-5 py-2 rounded-2xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95 shadow-sm"
                          style={{ background: bg, color }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* History */}
                  {searchHistory.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-800">History</p>
                        <button onClick={clearHistory} className="text-xs font-medium text-[#800000] hover:underline">
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {searchHistory.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 py-3 px-1 group hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            onClick={() => handleSearchSubmit(item)}
                          >
                            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="flex-1 text-sm text-gray-700">{item}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFromHistory(item); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : isSearching ? (
                <div className="flex justify-center pt-16">
                  <div className="w-8 h-8 rounded-full border-2 border-[#800000]/20 border-t-[#800000] animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {/* Search Suggestions Section */}
                  {searchSuggestions.length > 0 && !isFallbackSearch && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Related Searches</p>
                      <div className="space-y-0.5">
                        {searchSuggestions.map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => handleSearchSubmit(suggestion)}
                            className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-rose-50 transition-colors group text-left"
                          >
                            <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-[#800000] capitalize">
                              <HighlightText text={suggestion} highlight={searchQuery} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Results Section */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Products</p>
                    {isFallbackSearch && (
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 rounded-lg mb-2 border border-gray-100">
                        No exact matches found. Showing recommendations:
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => { addToHistory(product.name); setIsSearchOpen(false); setSearchQuery(''); }}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-rose-50 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-[#800000] transition-colors">
                          <HighlightText text={product.name} highlight={searchQuery} />
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#800000] transition-colors flex-shrink-0 ml-2" />
                    </Link>
                  ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-16">
                  <p className="text-sm text-gray-400">No results for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-xs text-gray-300 mt-1">Try Sarees, Kurtis, Lehengas or Salwar Suits</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Wishlist Overlay */}
      <AnimatePresence>
        {isWishlistOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-white w-full h-full overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 sm:px-12 py-5 border-b border-gray-100 flex items-center justify-between shadow-sm relative">
              <div className="absolute left-6 sm:left-12 flex items-center">
                <img src="/logo.png" alt="Aanya Fashions Logo" className="h-14 sm:h-16 w-auto object-contain mix-blend-multiply drop-shadow-sm hidden sm:block" />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 text-center">Saved Wishlist Collection</h2>
                <p className="text-gray-500 text-xs sm:text-sm text-center">{wishlistItems.length} Saved Fashion Styles</p>
              </div>
              <div className="absolute right-6 sm:right-12 flex items-center gap-4">
                <button 
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
                  aria-label="Close Wishlist"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Grid Content with Full Box Images */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10">
              {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {wishlistItems.map((item) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group relative"
                    >
                      {/* Full Box Image */}
                      <div className="w-full h-80 sm:h-96 bg-gray-50 overflow-hidden relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </div>

                      {/* Product Details Only */}
                      <div className="p-5 flex flex-col flex-1 justify-between space-y-3 bg-white">
                        <div>
                          <h3 className="font-serif text-lg font-bold text-gray-900 leading-snug line-clamp-1">{item.name}</h3>
                          <p className="text-2xl font-black text-[#800000] mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            to={`/product/${item.id}`}
                            onClick={() => setIsWishlistOpen(false)}
                            className="flex-1 py-3 bg-gradient-to-r from-[#800000] via-[#990000] to-[#800000] text-white rounded-xl text-xs font-black uppercase tracking-wider text-center shadow-md shadow-[#800000]/20 flex items-center justify-center gap-1.5 cursor-pointer hover:from-black hover:to-[#800000] transition-all"
                          >
                            Buy Now <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="px-3 py-3 bg-rose-100/90 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider border border-rose-200 transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            aria-label="Delete saved dress"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center opacity-60">
                  <Heart className="w-24 h-24 mb-4 text-[#800000] stroke-1 fill-rose-50" />
                  <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Your Wishlist is Empty</h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-6">Explore our latest handcrafted sarees, kurtis, and lehengas to save your favorite styles.</p>
                  <button
                    onClick={() => setIsWishlistOpen(false)}
                    className="px-8 py-3 bg-[#800000] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:bg-black transition-all"
                  >
                    Browse Collections
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Account Full Screen Overlay (Direct Account Details Form - Perfect Viewport Fit) */}
      <AnimatePresence>
        {isAccountOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-[#FDFBF7] overflow-y-auto sm:overflow-hidden flex flex-col justify-start items-center p-2 sm:p-5 select-none"
          >
            {/* Header - Logo on Top Left, Centered My Profile Title, Cross Icon at Top Right */}
            <div className="grid grid-cols-3 items-center w-full flex-shrink-0 px-1 sm:px-2 py-1 mb-1">
              {/* Left: Official Logo */}
              <div className="flex items-center justify-start">
                <img 
                  src="/logo.png" 
                  alt="Aanya Fashions Logo" 
                  className="h-14 sm:h-16 max-h-16 w-auto object-contain mix-blend-multiply drop-shadow-sm flex-shrink-0"
                />
              </div>

              {/* Center: My Profile Title (Big & Bold) */}
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 tracking-tight">My Profile</h2>
              </div>

              {/* Right: Close Button */}
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setIsAccountOpen(false)}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer"
                  aria-label="Close profile"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Body - Account Details (Minimal space at bottom) */}
            <div className="w-full max-w-lg mx-auto pt-0.5 pb-2 flex flex-col items-center justify-start">
              <div className="w-full space-y-3 sm:space-y-4">
                {/* Center Full Round Circle Profile Image with Upload */}
                <div className="flex flex-col items-center justify-center space-y-1 pb-1">
                  <div className="relative group w-28 h-28 sm:w-32 sm:h-32 aspect-square rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-lg bg-gray-100 flex items-center justify-center flex-shrink-0 cursor-pointer">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt={profileDetails.name || 'User Profile'} 
                        className="w-full h-full object-cover object-top rounded-full" 
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity duration-300">
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>{profileImage ? 'CHANGE' : 'UPLOAD'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleProfileImageUpload} 
                      />
                    </label>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400">Click avatar image to upload photo</span>
                </div>

                {/* Form Details */}
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 font-bold mb-0.5">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter full name"
                        value={profileDetails.name}
                        onChange={(e) => setProfileDetails({ ...profileDetails, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs sm:text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 font-bold mb-0.5">Gender</label>
                      <select 
                        value={profileDetails.gender}
                        onChange={(e) => setProfileDetails({ ...profileDetails, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs sm:text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all cursor-pointer text-gray-900"
                      >
                        <option value="" disabled>Select Gender</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 font-bold mb-0.5">Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="Enter phone number"
                        value={profileDetails.phone}
                        onChange={(e) => setProfileDetails({ ...profileDetails, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs sm:text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 font-bold mb-0.5">Email ID</label>
                      <input 
                        type="email" 
                        placeholder="Enter email address"
                        value={profileDetails.email}
                        onChange={(e) => setProfileDetails({ ...profileDetails, email: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs sm:text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 font-bold mb-0.5">Shipping Address</label>
                    <textarea 
                      placeholder="Enter shipping address"
                      value={profileDetails.address}
                      rows={2}
                      onChange={(e) => setProfileDetails({ ...profileDetails, address: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs sm:text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all resize-none text-gray-900"
                    />
                  </div>
                  
                  <div className="pt-1 sm:pt-2">
                    <motion.button 
                      onClick={handleSaveProfile}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-[#FFF0F5] border border-[#FFD6E8] text-[#800000] font-black rounded-xl text-xs uppercase tracking-wider shadow-sm hover:bg-[#FFE4EF] hover:border-[#800000]/30 transition-all cursor-pointer text-center block"
                    >
                      Save Profile Details
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile App Opening Initial Onboarding Overlay (< 640px) */}
      <AnimatePresence>
        {showMobileAppOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[300] bg-[#FDFBF7] overflow-y-auto overflow-x-hidden sm:hidden flex flex-col min-h-screen select-none"
          >
            {/* Screen 1: App Opening Welcome Screen with Big Transparent Logo & 5s Auto-transition */}
            {mobileAppOpeningStep === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={() => setMobileAppOpeningStep(2)}
                className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center min-h-screen cursor-pointer overflow-hidden"
              >
                <div className="w-full max-w-sm flex flex-col items-center justify-center">
                  {/* Big Transparent Logo - No Background Box */}
                  <motion.img
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    src="/logo.png"
                    alt="Aanya Fashions Logo"
                    className="h-44 sm:h-56 w-auto object-contain mix-blend-multiply drop-shadow-xl mb-8"
                  />

                  {/* Welcome Message Only */}
                  <motion.h2
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-3xl font-serif font-bold text-gray-900 tracking-tight text-center"
                  >
                    Welcome to Aanya Fashions
                  </motion.h2>
                </div>
              </motion.div>
            )}

            {/* Screen 2: Initial Account Details Form (No Back Button, Clean Inputs) */}
            {mobileAppOpeningStep === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-6 py-8 flex justify-center flex-1 min-h-screen"
              >
                <div className="w-full max-w-xl space-y-6 h-fit my-auto">
                  <div className="text-center space-y-1 mb-6">
                    <h3 className="text-xl font-serif font-bold text-gray-900">My Profile</h3>
                    <p className="text-xs text-gray-500 font-medium">Please enter your profile information to continue</p>
                  </div>

                  {/* Center Profile Image with Upload */}
                  <div className="flex flex-col items-center justify-center space-y-2 pb-2">
                    <div className="relative group w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-xl bg-gray-100 flex items-center justify-center cursor-pointer">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt={profileDetails.name || 'User Profile'} 
                          className="w-full h-full object-cover object-top" 
                        />
                      ) : (
                        <User className="w-16 h-16 text-gray-400" />
                      )}
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity duration-300">
                        <Camera className="w-4 h-4 mb-1" />
                        <span>{profileImage ? 'CHANGE' : 'UPLOAD'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleProfileImageUpload} 
                        />
                      </label>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400">Click photo to upload</span>
                  </div>

                  {/* Form Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter full name"
                        value={profileDetails.name}
                        onChange={(e) => setProfileDetails({ ...profileDetails, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Gender</label>
                      <select 
                        value={profileDetails.gender}
                        onChange={(e) => setProfileDetails({ ...profileDetails, gender: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all cursor-pointer text-gray-900"
                      >
                        <option value="" disabled>Select Gender</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="Enter phone number"
                        value={profileDetails.phone}
                        onChange={(e) => setProfileDetails({ ...profileDetails, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Email ID</label>
                      <input 
                        type="email" 
                        placeholder="Enter email address"
                        value={profileDetails.email}
                        onChange={(e) => setProfileDetails({ ...profileDetails, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Shipping Address</label>
                      <textarea 
                        placeholder="Enter shipping address"
                        value={profileDetails.address}
                        rows={3}
                        onChange={(e) => setProfileDetails({ ...profileDetails, address: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all resize-none text-gray-900"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <motion.button 
                        onClick={handleFinishMobileAppOpening}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-[#FFF0F5] border border-[#FFD6E8] text-[#800000] font-black rounded-xl text-xs uppercase tracking-wider shadow-sm hover:bg-[#FFE4EF] transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        <span>Save & Open Full App</span>
                        <ArrowRight className="w-4 h-4 text-[#800000]" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
