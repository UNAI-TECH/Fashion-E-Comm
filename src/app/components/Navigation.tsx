import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Package, Heart, ChevronDown, ArrowRight, X, Phone, Plus, Minus, Trash2, Menu, Clock, ArrowLeft, ShoppingBag, Camera, LogOut } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Link, useLocation, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Product, fetchProducts } from '../data/products';
import { toast } from 'sonner';
import { intelligentSearch, getRecommendedFallback, getSearchSuggestions } from '../../lib/aiSearchEngine';
import { ProfileModal } from './ProfileModal';
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
    const handleOpenProfileModal = () => setIsAccountOpen(true);
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

  // Load all catalog products when search opens
  useEffect(() => {
    if (!isSearchOpen) return;
    fetchProducts().then(products => setAllProducts(products));
  }, [isSearchOpen]);

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
      {/* First Page: Welcome to Aanya Fashions Splash Screen */}
      <WelcomeSplashScreen />

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
                className="w-full pl-10 pr-3 py-2 text-xs border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#698156] focus:ring-1 focus:ring-[#698156]/20 transition-all"
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
                        <div className="space-y-0.5">
                          {searchResults.map((product) => (
                            <Link
                              key={product.id}
                              to={`/product/${product.id}`}
                              onClick={() => { addToHistory(product.name); setIsSearchDropdownOpen(false); setSearchQuery(''); }}
                              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[#F4F6F2] transition-colors group"
                            >
                              <div>
                                <p className="text-xs font-medium text-gray-800 group-hover:text-[#698156] transition-colors">
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
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#698156] transition-colors cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Wishlist</span>
            </motion.button>

            <Link to="/orders">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#698156] transition-colors cursor-pointer"
              >
                <Package className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Orders</span>
              </motion.div>
            </Link>


            {/* Account / Profile with Myntra-style dropdown */}
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
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-[#F4F6F2]/50">
                      <p className="text-xs font-bold text-gray-900 truncate">{profile?.full_name || 'Customer'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{profile?.email || user?.email}</p>
                    </div>

                    <Link
                      to="/orders"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F4F6F2] hover:text-[#698156] transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#698156]" />
                      <span>My Orders</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        setIsWishlistOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F4F6F2] hover:text-[#698156] transition-colors text-left cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Saved Wishlist</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        setIsAccountOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F4F6F2] hover:text-[#698156] transition-colors text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span>Delivery Address & Profile</span>
                    </button>

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
                className="w-9 h-9 flex items-center justify-center bg-[#F4F6F2] border border-[#DCE4D7]/80 text-[#698156] rounded-full shadow-sm hover:bg-[#DCE4D7]/30 transition-all"
                aria-label="Toggle Menu Features"
              >
                {isMobileMenuOpen ? (
                  <X className="w-[18px] h-[18px] text-[#698156]" />
                ) : (
                  <Menu className="w-[18px] h-[18px] text-[#698156]" />
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
                      ? 'bg-[#698156] text-white border-[#698156]'
                      : 'bg-gray-50 hover:bg-[#F4F6F2] text-gray-800 hover:text-[#698156] border-gray-200/80 hover:border-[#698156]/30'
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
                        if (!isAuthenticated) {
                          setIsAuthModalOpen(true);
                        } else {
                          setIsAccountOpen(true);
                        }
                      }}
                      className="w-11 h-11 bg-indigo-100/90 border border-indigo-300 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-indigo-200/90 transition-all cursor-pointer"
                      aria-label="Account"
                    >
                      <User className="w-5 h-5 stroke-[2.5]" />
                    </motion.button>
                    <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">
                      {isAuthenticated ? 'Account' : 'Sign In'}
                    </span>
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
                    <div className="space-y-0.5">
                      {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => { addToHistory(product.name); setIsSearchOpen(false); setSearchQuery(''); }}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#F4F6F2] transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-[#698156] transition-colors">
                          <HighlightText text={product.name} highlight={searchQuery} />
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#698156] transition-colors flex-shrink-0 ml-2" />
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


      {/* Account / Profile Modal */}
      <ProfileModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        title="My Profile"
        subtitle="Manage your personal profile and shipping address"
        actionButtonText="Save Profile Details"
      />

      {/* Customer Authentication Modal (Myntra-style) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
