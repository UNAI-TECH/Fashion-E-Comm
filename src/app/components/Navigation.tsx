import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Package, Heart, ChevronDown, ArrowRight, X, Phone, Plus, Minus, Trash2, Menu, Clock, ArrowLeft, ShoppingBag, Camera, LogOut, Truck, MapPin } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Link, useLocation, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Product, fetchProducts } from '../data/products';
import { toast } from 'sonner';
import { intelligentSearch, getRecommendedFallback, getSearchSuggestions } from '../../lib/aiSearchEngine';
import { AuthModal } from './AuthModal';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { WelcomeSplashScreen } from './WelcomeSplashScreen';
import { getUserProfileImage } from '../../lib/userProfile';

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
          <span key={i} className="text-[#698156] font-black bg-[#698156]/10 px-0.5 rounded">{part}</span>
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
  const { cartCount } = useCart();
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
  const { user, profile, isAuthenticated, signOut } = useCustomerAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(() => getUserProfileImage());

  // Keep nav profile avatar in sync with profile updates from anywhere
  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfileImage(getUserProfileImage());
    };
    window.addEventListener('user_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    const handleOpenProfileModal = () => navigate('/profile');
    window.addEventListener('open-profile-modal', handleOpenProfileModal);
    const handleSignedOut = () => {
      setIsAccountDropdownOpen(false);
      setIsAccountOpen(false);
      setProfileImage('');
    };
    window.addEventListener('user-signed-out', handleSignedOut);

    return () => {
      window.removeEventListener('user_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('open-profile-modal', handleOpenProfileModal);
      window.removeEventListener('user-signed-out', handleSignedOut);
    };
  }, []);

  // Always navigate to full collection / category page on search submit
  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    addToHistory(query.trim());
    setIsSearchOpen(false);
    setSearchQuery('');
    
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  // Preload all catalog products immediately on mount for instant real-time search
  useEffect(() => {
    fetchProducts().then(products => setAllProducts(products));
  }, []);

  // Listen for 'open-search' event from HeroSection search button
  useEffect(() => {
    const handler = () => setIsSearchOpen(true);
    window.addEventListener('open-search', handler);
    return () => window.removeEventListener('open-search', handler);
  }, []);

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
    const queryTrimmed = searchQuery.trim();
    if (queryTrimmed.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const runSearch = (items: Product[]) => {
      let results = intelligentSearch(queryTrimmed, items);
      if (results.length === 0) {
        results = getRecommendedFallback(items);
        setIsFallbackSearch(true);
        setSearchSuggestions([]);
      } else {
        setIsFallbackSearch(false);
        setSearchSuggestions(getSearchSuggestions(queryTrimmed, items));
      }

      setSearchResults(
        results.map((p: any) => ({
          ...p,
          image: (p.images && p.images.length > 0) ? p.images[0] : (p.image_url || p.image || ''),
        }))
      );
      setIsSearching(false);
    };

    if (allProducts.length > 0) {
      runSearch(allProducts);
    } else {
      setIsSearching(true);
      fetchProducts()
        .then((products) => {
          setAllProducts(products);
          runSearch(products);
        })
        .catch((err) => {
          console.error('Search error:', err);
          setIsSearching(false);
        });
    }
  }, [searchQuery, allProducts]);



  return (
    <>
      {/* First Page: Welcome to Aanya Fashions Splash Screen */}
      <WelcomeSplashScreen />

      {/* ══════════ DESKTOP HEADER (Myntra & Meesho style) ══════════ */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 z-[40] bg-white shadow-xs border-b border-gray-100">
        {/* Row: Logo | Centered Search Bar | Actions */}
        <div className="max-w-[1440px] mx-auto px-6 py-2 flex items-center justify-between gap-6">

          {/* Logo — Sleek, bold & compact height */}
          <Link to="/" className="flex items-center flex-shrink-0 h-14 sm:h-16 py-1 overflow-visible">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src="/logo.png"
              alt="Aanya Fashions"
              className="h-full w-auto object-contain object-left"
            />
          </Link>

          {/* Search Bar Box in Center (Myntra & Meesho style) */}
          <div className="flex-1 max-w-xl xl:max-w-2xl mx-auto relative px-2 sm:px-4">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Try Saree, Silk, Banarasi or Search by Product..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchDropdownOpen(false), 200)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(searchQuery); }}
                className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-full bg-[#F9FAF8] hover:bg-white focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#698156] focus:ring-2 focus:ring-[#698156]/20 transition-all shadow-2xs"
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
                      <div className="w-6 h-6 rounded-full border-2 border-[#698156]/20 border-t-[#698156] animate-spin" />
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
                                className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#F4F6F2] transition-colors group text-left"
                              >
                                <Search className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                <span className="flex-1 text-xs font-medium text-gray-700 group-hover:text-[#698156] capitalize">
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
                        <div className="space-y-1">
                          {searchResults.map((product) => (
                            <Link
                              key={product.id}
                              to={`/product/${product.id}`}
                              onClick={() => { addToHistory(product.name); setIsSearchDropdownOpen(false); setSearchQuery(''); }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4F6F2] transition-colors group cursor-pointer"
                            >
                              <div className="w-10 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200/60 shadow-2xs">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-bold">AF</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#698156] bg-[#698156]/10 px-1.5 py-0.5 rounded">
                                    {product.category || 'Saree'}
                                  </span>
                                  {product.material && (
                                    <span className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[90px]">
                                      {product.material}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-gray-800 group-hover:text-[#698156] transition-colors truncate">
                                  <HighlightText text={product.name} highlight={searchQuery} />
                                </p>
                                <p className="text-xs font-bold text-gray-900 mt-0.5">
                                  ₹{(product.price || 0).toLocaleString('en-IN')}
                                </p>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#698156] transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
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

          {/* Right Actions: Wishlist | Orders | Cart | Profile */}
          <div className="flex items-center gap-5 sm:gap-6 flex-shrink-0">
            {/* 1. Wishlist */}
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsWishlistOpen(true)}
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#698156] transition-colors cursor-pointer relative"
              aria-label="Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">Wishlist</span>
            </motion.button>

            {/* 2. Orders */}
            <Link to="/orders">
              <motion.div
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#698156] transition-colors cursor-pointer"
              >
                <Package className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Orders</span>
              </motion.div>
            </Link>

            {/* 3. Cart / Bag */}
            <Link to="/cart">
              <motion.div
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#698156] transition-colors cursor-pointer relative"
                aria-label="Shopping Cart"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2 bg-[#698156] text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">Cart</span>
              </motion.div>
            </Link>

            {/* 4. Profile / Account with dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsAccountDropdownOpen(!isAccountDropdownOpen);
                  }
                }}
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#698156] transition-colors cursor-pointer"
                aria-label="Account"
              >
                {isAuthenticated && profile?.full_name ? (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#698156] to-[#88a570] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                ) : profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="text-[10px] font-semibold max-w-[65px] truncate">
                  {isAuthenticated ? (profile?.full_name?.split(' ')[0] || 'Profile') : 'Profile'}
                </span>
              </motion.button>

              {/* Account Dropdown for Logged In User */}
              <AnimatePresence>
                {isAuthenticated && isAccountDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                  >
                    <div
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        navigate('/profile?tab=profile');
                      }}
                      className="px-4 py-3 border-b border-gray-100 bg-[#F4F6F2]/50 hover:bg-[#F4F6F2] cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-bold text-gray-900 truncate">{profile?.full_name || 'Customer'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{profile?.email || user?.email}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#698156] mt-1 hover:underline">
                        View Full Profile →
                      </span>
                    </div>

                    <Link
                      to="/profile?tab=orders"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F4F6F2] hover:text-[#698156] transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#698156]" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/profile?tab=track"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F4F6F2] hover:text-[#698156] transition-colors"
                    >
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>Track Order</span>
                    </Link>

                    <Link
                      to="/profile?tab=wishlist"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F4F6F2] hover:text-[#698156] transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Saved Wishlist</span>
                    </Link>

                    <Link
                      to="/profile?tab=addresses"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F4F6F2] hover:text-[#698156] transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span>Delivery Addresses</span>
                    </Link>

                    <Link
                      to="/profile?tab=profile"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F4F6F2] hover:text-[#698156] transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span>Profile Details</span>
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsAccountDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer font-bold"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer so content sits below the fixed desktop header (~64px) */}
      <div className="hidden lg:block h-[64px]" aria-hidden="true" />

      {/* ══════════ MOBILE & TABLET HEADER (Edge-to-edge, Professional full-width bar) ══════════ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 w-full z-40 bg-white border-b border-gray-200/80 shadow-xs">
        {/* Row 1: Menu Button | Logo | Search | Wishlist | Cart */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-5 gap-2">
          {/* Left: Hamburger menu + Brand Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-700 hover:text-[#698156] hover:bg-gray-100 transition-colors cursor-pointer active:scale-95"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center h-9 sm:h-11">
              <img
                src="/logo.png"
                alt="Aanya Fashions Logo"
                className="h-full w-auto object-contain object-left"
              />
            </Link>
          </div>

          {/* Right: Search | Wishlist | Cart */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-[#698156] rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Search Sarees"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              to="/profile?tab=wishlist"
              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-[#698156] rounded-xl hover:bg-gray-100 transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-black rounded-full h-3.5 min-w-[14px] px-1 flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-[#698156] rounded-xl hover:bg-gray-100 transition-colors relative"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#698156] text-white text-[9px] font-black rounded-full h-3.5 min-w-[14px] px-1 flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2: Search Bar Input Box on Mobile (Myntra & Meesho style) */}
        <div className="px-3 pb-2.5 pt-0">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-[#F6F7F5] border border-gray-200/90 rounded-xl text-xs text-gray-400 cursor-pointer shadow-2xs hover:border-[#698156]/40 transition-colors"
          >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate text-gray-500">Search saree, silk, banarasi, pure zari...</span>
          </div>
        </div>
      </header>

      {/* Spacer below mobile/tablet fixed header */}
      <div className="lg:hidden h-[98px]" aria-hidden="true" />

      {/* ══════════ PROPER MOBILE SLIDE-OVER NAVIGATION DRAWER ══════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-out Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-[84%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drawer Top: User Profile / Welcome Header */}
              <div className="p-5 bg-gradient-to-br from-[#1C2417] via-[#2A3723] to-[#1C2417] text-white flex items-center justify-between">
                <div
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isAuthenticated) {
                      navigate('/profile');
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-base font-bold overflow-hidden shadow-xs">
                    {isAuthenticated && profile?.full_name ? (
                      profile.full_name.charAt(0).toUpperCase()
                    ) : profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-white/90" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {isAuthenticated ? (profile?.full_name || 'My Account') : 'Welcome to Aanya'}
                    </h3>
                    <p className="text-[11px] text-white/70">
                      {isAuthenticated ? 'View & Edit Profile →' : 'Sign In / Create Account →'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Store Sections */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-3 mb-2">
                    Shop Collection
                  </p>
                  <div className="space-y-1">
                    <Link
                      to="/category/sarees"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 hover:bg-amber-50 text-gray-900 font-bold text-sm transition-all border border-amber-200/50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">🥻</span>
                        <span>Sale Sarees Collection</span>
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-gray-900">
                        HOT SALE
                      </span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsSearchOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-gray-400" />
                        <span>Search Sarees by Fabric / Color</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Customer Account & Orders */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-3 mb-2">
                    My Account & Activity
                  </p>
                  <div className="space-y-1">
                    <Link
                      to="/cart"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-[#698156]" />
                        <span>My Shopping Cart</span>
                      </span>
                      {cartCount > 0 && (
                        <span className="bg-[#698156] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {cartCount} items
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span>My Orders</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                    </Link>

                    <Link
                      to="/profile?tab=track"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span>Track Order Shipment</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                    </Link>

                    <Link
                      to="/profile?tab=wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>My Saved Wishlist</span>
                      </span>
                      {wishlistCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/profile?tab=addresses"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span>Delivery Addresses</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                    </Link>
                  </div>
                </div>

                {/* Customer Service / Contact */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-200/50 space-y-1.5 text-xs">
                    <p className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-700" /> Need Help Ordering?
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Our customer team is available 10 AM – 7 PM to help you choose the right drape.
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Bottom: Sign Out or Brand Note */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                {isAuthenticated ? (
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <div className="text-center text-[10px] text-gray-400 font-medium">
                    Aanya Fashions • Authentic Handcrafted Saree Weaves
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

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
                  className="w-full pl-11 pr-10 py-3.5 bg-[#F4F6F2] rounded-2xl text-sm text-gray-800 placeholder:text-[#698156]/50 outline-none focus:bg-white focus:ring-2 focus:ring-[#698156]/25 border border-[#DCE4D7] focus:border-[#698156]/30 transition-all"
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
                        <button onClick={clearHistory} className="text-xs font-medium text-[#698156] hover:underline">
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {searchHistory.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 py-3 px-1 group hover:bg-[#F4F6F2] rounded-xl transition-colors cursor-pointer"
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
                  <div className="w-8 h-8 rounded-full border-2 border-[#698156]/20 border-t-[#698156] animate-spin" />
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
                            className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[#F4F6F2] transition-colors group text-left"
                          >
                            <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-[#698156] capitalize">
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
                    <div className="space-y-1">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          onClick={() => { addToHistory(product.name); setIsSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F2] transition-colors group cursor-pointer"
                        >
                          <div className="w-12 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200/60 shadow-2xs">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">AF</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#698156] bg-[#698156]/10 px-1.5 py-0.5 rounded">
                                {product.category || 'Saree'}
                              </span>
                              {product.material && (
                                <span className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                                  {product.material}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-[#698156] transition-colors truncate">
                              <HighlightText text={product.name} highlight={searchQuery} />
                            </p>
                            <p className="text-xs font-bold text-gray-900 mt-0.5">
                              ₹{(product.price || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#698156] transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
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
                          <p className="text-2xl font-black text-[#698156] mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            to={`/product/${item.id}`}
                            onClick={() => setIsWishlistOpen(false)}
                            className="flex-1 py-3 bg-gradient-to-r from-[#698156] via-[#546944] to-[#698156] text-white rounded-xl text-xs font-black uppercase tracking-wider text-center shadow-md shadow-[#698156]/20 flex items-center justify-center gap-1.5 cursor-pointer hover:from-[#546944] hover:to-[#435436] transition-all"
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
                  <Heart className="w-24 h-24 mb-4 text-[#698156] stroke-1 fill-[#F4F6F2]" />
                  <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Your Wishlist is Empty</h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-6">Explore our latest handcrafted sarees, kurtis, and lehengas to save your favorite styles.</p>
                  <button
                    onClick={() => setIsWishlistOpen(false)}
                    className="px-8 py-3 bg-[#698156] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#546944] transition-all"
                  >
                    Browse Collections
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Customer Authentication Modal (Myntra-style) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
