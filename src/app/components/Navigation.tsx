import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Package, Heart, ChevronDown, ArrowRight, X, Phone, Plus, Minus, Trash2, Menu, Clock, ArrowLeft, ShoppingBag, Camera } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Link, useLocation, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Product, fetchProducts } from '../data/products';
import { toast } from 'sonner';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems, cartCount, addToCart, updateQuantity, removeItem } = useCart();
  const { wishlistItems, wishlistCount, removeFromWishlist } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isMobileCollectionOpen, setIsMobileCollectionOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('search_history') || '[]'); } catch { return []; }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [profileDetails, setProfileDetails] = useState(() => {
    try {
      const saved = localStorage.getItem('user_profile_details');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Aanya Dev',
      gender: 'Female',
      phone: '+91 88382 26394',
      email: 'aanya.dev@example.com',
      address: '12, Luxury Heritage Lane, Silk Weaver Colony, Chennai, Tamil Nadu - 600001'
    };
  });
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('user_profile_image') || 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?q=80&w=300';
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
    
    const queryLower = query.trim().toLowerCase();
    const matchedProduct = allProducts.find(product => {
      const nameLower = (product.name || '').toLowerCase();
      const categoryLower = (product.category || '').toLowerCase();
      return nameLower.includes(queryLower) || categoryLower.includes(queryLower);
    });

    const targetCategory = matchedProduct?.category || query.trim();
    navigate(`/category/${encodeURIComponent(targetCategory.toLowerCase())}`);
  };

  // Load all catalog products when search opens
  useEffect(() => {
    if (!isSearchOpen) return;
    fetchProducts().then(products => setAllProducts(products));
  }, [isSearchOpen]);

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

    const handleOpenCart = () => {
      setIsCartOpen(true);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('open-cart', handleOpenCart);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-cart', handleOpenCart);
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
        const queryLower = queryTrimmed.toLowerCase();
        
        // Synonym & category expansion helper (handles spellings like kurtha, kurti, saree, sari, lehanga, etc.)
        const getSearchTerms = (query: string): string[] => {
          const q = query.toLowerCase().trim();
          const terms = [q];

          if (q.endsWith('es')) terms.push(q.slice(0, -2));
          if (q.endsWith('s')) terms.push(q.slice(0, -1));

          // Kurtas / Kurtis / Kurthas / Anarkali
          if (q.includes('kurt') || q.includes('kurtah') || q.includes('anarkali')) {
            terms.push('kurti', 'kurta', 'kurtis', 'kurtas', 'kurtha', 'kurthas', 'anarkali');
          }

          // Sarees / Sari / Sare
          if (q.includes('sare') || q.includes('sari')) {
            terms.push('saree', 'sari', 'sarees', 'saris');
          }

          // Lehengas / Lehanga / Ghagra / Choli
          if (q.includes('leheng') || q.includes('lehang') || q.includes('choli')) {
            terms.push('lehenga', 'lehanga', 'lehengas', 'lehangas', 'choli');
          }

          // Salwar / Suit / Suits / Patiala / Set
          if (q.includes('salwar') || q.includes('suit') || q.includes('patiala')) {
            terms.push('salwar', 'suit', 'suits', 'set', 'sets', 'patiala');
          }

          // Maxi / Gown
          if (q.includes('maxi') || q.includes('gown')) {
            terms.push('maxi', 'gown', 'gowns');
          }

          // Western
          if (q.includes('west') || q.includes('western') || q.includes('blouse')) {
            terms.push('western', 'blouse', 'culottes');
          }

          return Array.from(new Set(terms.filter(Boolean)));
        };

        const searchTerms = getSearchTerms(queryLower);
        const primaryStem = searchTerms[1] || queryLower;

        // 1. Always load mock catalog
        const mockProducts = await fetchProducts();

        // 2. Also query Supabase in parallel using primary search term
        const { data: dbData } = await supabase
          .from('products')
          .select('id, name, category, description, price, images, image_url, status')
          .or(`name.ilike.%${primaryStem}%,category.ilike.%${primaryStem}%`);

        // 3. Combine and deduplicate
        const allItems = [...mockProducts, ...(dbData || [])];
        const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

        // 4. Filter: match ANY search term in name, category, or description
        const results = uniqueItems.filter(product => {
          const nameLower = (product.name || '').toLowerCase();
          const categoryLower = (product.category || '').toLowerCase();
          const descLower = (product.description || '').toLowerCase();

          return searchTerms.some(term =>
            nameLower.includes(term) ||
            categoryLower.includes(term) ||
            descLower.includes(term)
          );
        });

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

    const timer = setTimeout(searchProducts, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Sarees', path: '/category/sarees' },
    { name: 'Kurtis', path: '/category/kurtis' },
    { name: 'Lehengas', path: '/category/lehengas' },
    { name: 'Salwar Sets', path: '/category/salwar-sets' },
    { name: 'Western', path: '/category/western' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];


  return (
    <>
      {/* 1. Standalone Logo (Left corner, transparent and crisp) */}
      <Link to="/" className="hidden lg:block absolute top-0 left-0 z-[40] pointer-events-none">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center h-20 sm:h-28 lg:h-44 cursor-pointer pointer-events-auto"
        >
          <img
            src="/logo_aanya.png"
            alt="Aanya Fashions Logo"
            className="h-full w-auto object-contain"
          />
        </motion.div>
      </Link>

      {/* 2. Desktop Standalone Center Navigation Pill Bar */}
      <div className="hidden lg:flex fixed top-6 left-1/2 -translate-x-1/2 z-[40] items-center space-x-1 bg-white/90 backdrop-blur-md p-1 px-2 rounded-full border border-white/30 shadow-md">
        <Link to="/">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`px-4 py-2 text-[11px] sm:text-[13px] font-black uppercase tracking-wide rounded-full transition-all inline-block ${
              location.pathname === '/' ? 'bg-[#FFF0F5] text-[#D4AF37] border border-[#F5E6BE] shadow-sm' : 'text-gray-950 hover:bg-[#FFF0F5] hover:text-[#D4AF37]'
            }`}
          >
            Home
          </motion.span>
        </Link>
        <Link to="/about">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`px-4 py-2 text-[11px] sm:text-[13px] font-black uppercase tracking-wide rounded-full transition-all inline-block ${
              location.pathname === '/about' ? 'bg-[#FFF0F5] text-[#D4AF37] border border-[#F5E6BE] shadow-sm' : 'text-gray-950 hover:bg-[#FFF0F5] hover:text-[#D4AF37]'
            }`}
          >
            About
          </motion.span>
        </Link>

        {/* Collection Category Dropdown (Desktop) */}
        <div 
          className="relative"
          onMouseEnter={() => setIsCollectionOpen(true)}
          onMouseLeave={() => setIsCollectionOpen(false)}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            className={`px-4 py-2 text-[11px] sm:text-[13px] font-black uppercase tracking-wide rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              location.pathname.startsWith('/category/') ? 'bg-[#FFF0F5] text-[#D4AF37] border border-[#F5E6BE] shadow-sm' : 'text-gray-950 hover:bg-[#FFF0F5] hover:text-[#D4AF37]'
            }`}
          >
            Collection
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollectionOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isCollectionOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100/80 p-2 space-y-1 z-50"
              >
                {[
                  { name: 'Kurti', path: '/category/kurtis' },
                  { name: 'Saree', path: '/category/sarees' },
                  { name: 'Salwar Set', path: '/category/salwar-sets' },
                  { name: 'Maxi', path: '/category/maxi' },
                  { name: 'Lehengas', path: '/category/lehengas' },
                  { name: 'Western', path: '/category/western' },
                ].map((category) => (
                  <Link
                    key={category.name}
                    to={category.path}
                    onClick={() => setIsCollectionOpen(false)}
                    className={`block px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      location.pathname === category.path
                        ? 'bg-[#FFF0F5] text-[#D4AF37] font-black border border-[#F5E6BE]'
                        : 'text-gray-700 hover:bg-[#FFF0F5] hover:text-[#D4AF37]'
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link to="/contact">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`px-4 py-2 text-[11px] sm:text-[13px] font-black uppercase tracking-wide rounded-full transition-all inline-block ${
              location.pathname === '/contact' ? 'bg-[#FFF0F5] text-[#D4AF37] border border-[#F5E6BE] shadow-sm' : 'text-gray-950 hover:bg-[#FFF0F5] hover:text-[#D4AF37]'
            }`}
          >
            Contact
          </motion.span>
        </Link>
      </div>

      {/* 3. Desktop Standalone Quick Action Pill (Top Right Corner) */}
      <div className="hidden lg:flex fixed top-6 right-8 z-[40] items-center space-x-1 bg-white/90 backdrop-blur-md p-1.5 px-3 rounded-full border border-white/30 shadow-md">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSearchOpen(true)}
          className="p-1.5 text-gray-700 hover:text-[#800000] hover:bg-white rounded-full transition-all"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="p-1.5 text-gray-700 hover:text-[#800000] hover:bg-white rounded-full transition-all relative cursor-pointer"
          aria-label="Cart"
        >
          <ShoppingBag className="w-4 h-4 text-gray-700" />
        </motion.button>
        <Link to="/orders">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="p-1.5 text-gray-700 hover:text-emerald-700 hover:bg-white rounded-full transition-all relative group cursor-pointer"
            aria-label="My Orders"
          >
            <Package className="w-4 h-4 text-emerald-700" />
          </motion.button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAccountOpen(true)}
          className="p-1.5 text-gray-700 hover:text-[#800000] hover:bg-white rounded-full transition-all cursor-pointer"
          aria-label="Account"
        >
          <User className="w-4 h-4 text-gray-700" />
        </motion.button>
      </div>

      {/* 4. Mobile Unified Navigation Pill (Mobile only) */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`lg:hidden fixed z-[40] transition-all duration-500 top-4 left-4 right-4 bg-white border border-gray-200/60 shadow-[0_4px_15px_rgba(0,0,0,0.06)] ${
          isMobileMenuOpen ? 'rounded-[2rem]' : 'rounded-full'
        }`}
      >
        <div className="w-full px-3 py-1 bg-white rounded-full">
          <div className="flex items-center justify-between h-14">
            
            {/* Left side: Logo */}
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center flex-shrink-0 ml-1">
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="flex items-center h-8 sm:h-9"
              >
                <img
                  src="/logo_aanya.png"
                  alt="Aanya Fashions Logo"
                  className="h-full w-auto object-contain brightness-[1.02] contrast-110 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.05)]"
                />
              </motion.div>
            </Link>

            {/* Center: Navigation Links (Home, About, Collection, Contact) */}
            <div className="flex-1 flex items-center justify-center gap-2 xs:gap-3 sm:gap-4 px-1.5 overflow-hidden">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-1 py-1 text-[10px] xs:text-[11px] sm:text-xs font-black uppercase tracking-wide whitespace-nowrap text-center transition-all ${
                  location.pathname === '/' ? 'text-[#800000]' : 'text-[#002D62] hover:text-[#800000]'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/about" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-1 py-1 text-[10px] xs:text-[11px] sm:text-xs font-black uppercase tracking-wide whitespace-nowrap text-center transition-all ${
                  location.pathname === '/about' ? 'text-[#800000]' : 'text-[#002D62] hover:text-[#800000]'
                }`}
              >
                About
              </Link>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsMobileCollectionOpen(!isMobileCollectionOpen);
                }} 
                className={`px-1 py-1 text-[10px] xs:text-[11px] sm:text-xs font-black uppercase tracking-wide whitespace-nowrap text-center transition-all flex items-center gap-0.5 ${
                  location.pathname.startsWith('/category/') ? 'text-[#800000]' : 'text-[#002D62] hover:text-[#800000]'
                }`}
              >
                Collection <ChevronDown className={`w-3 h-3 stroke-[3.5] transition-transform duration-300 ${location.pathname.startsWith('/category/') ? 'text-[#800000]' : 'text-[#002D62]'}`} style={{ transform: isMobileCollectionOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              <Link 
                to="/contact" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-1 py-1 text-[10px] xs:text-[11px] sm:text-xs font-black uppercase tracking-wide whitespace-nowrap text-center transition-all ${
                  location.pathname === '/contact' ? 'text-[#800000]' : 'text-[#002D62] hover:text-[#800000]'
                }`}
              >
                Contact
              </Link>
            </div>

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

                  {/* Cart Action */}
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="w-11 h-11 bg-rose-100/90 border border-rose-300 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm hover:bg-rose-200/90 transition-all relative cursor-pointer"
                      aria-label="Cart"
                    >
                      <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                    </motion.button>
                    <span className="text-[9px] font-black text-rose-700 uppercase tracking-wider">Cart</span>
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
                <div className="space-y-0.5">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => { addToHistory(product.name); setIsSearchOpen(false); setSearchQuery(''); }}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-rose-50 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-[#800000] transition-colors">{product.name}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#800000] transition-colors flex-shrink-0 ml-2" />
                    </Link>
                  ))}
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
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 sm:px-12 py-5 border-b border-gray-100 flex items-center justify-between shadow-sm">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Saved Wishlist Collection</h2>
                <p className="text-gray-500 text-xs sm:text-sm">{wishlistItems.length} Saved Fashion Styles</p>
              </div>
              <button 
                onClick={() => setIsWishlistOpen(false)}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
                aria-label="Close Wishlist"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
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
                        <button 
                          onClick={() => removeFromWishlist(item.id)}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md hover:bg-rose-600 hover:text-white transition-all text-gray-700"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
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

      {/* Cart Full Screen Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 z-[200] bg-[#FDFBF7] flex flex-col overflow-hidden animate-fade-in"
          >            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 pt-12 sm:pt-10 pb-4 border-b border-gray-100 bg-white shadow-sm">
              <Link to="/" onClick={() => setIsCartOpen(false)} className="flex items-center">
                <img src="/logo_aanya.png" alt="Aanya Fashions" className="h-10 sm:h-12 w-auto object-contain" />
              </Link>
              <h2 className="text-base font-serif text-lg sm:text-xl font-bold text-gray-900 tracking-wide">My Shopping Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 flex justify-center">
              <div className="w-full max-w-xl space-y-6 h-fit my-4">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center border border-gray-100">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 aspect-square">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow flex items-center justify-between min-w-0">
                        <div className="space-y-1 min-w-0 pr-4">
                          <h3 className="font-serif text-base text-gray-900 truncate">
                            {item.name}
                          </h3>
                          <div className="text-sm font-bold text-[#D4AF37]">
                            ₹{item.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl shadow-sm p-8">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                    <h2 className="text-2xl font-serif text-gray-800 mb-4">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8">Explore our collections and add your favorite styles.</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-8 py-3 bg-[#800000] text-white rounded-full font-medium"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Full Screen Overlay */}
      <AnimatePresence>
        {isAccountOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 z-[200] bg-[#FDFBF7] flex flex-col overflow-hidden animate-fade-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 pt-12 sm:pt-10 pb-4 border-b border-gray-100 bg-white shadow-sm">
              <Link to="/" onClick={() => setIsAccountOpen(false)} className="flex items-center">
                <img src="/logo_aanya.png" alt="Aanya Fashions" className="h-10 sm:h-12 w-auto object-contain" />
              </Link>
              <h2 className="text-base font-serif text-lg sm:text-xl font-bold text-gray-900 tracking-wide">My Account Profile</h2>
              <button
                onClick={() => setIsAccountOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                aria-label="Close profile"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 flex justify-center">
              <div className="w-full max-w-xl space-y-8 h-fit my-4 p-4">

                {/* Form Details */}
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={profileDetails.name}
                        onChange={(e) => setProfileDetails({ ...profileDetails, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">Gender</label>
                      <select 
                        value={profileDetails.gender}
                        onChange={(e) => setProfileDetails({ ...profileDetails, gender: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all cursor-pointer"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">Phone Number</label>
                      <input 
                        type="text" 
                        value={profileDetails.phone}
                        onChange={(e) => setProfileDetails({ ...profileDetails, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">Email ID</label>
                      <input 
                        type="email" 
                        value={profileDetails.email}
                        onChange={(e) => setProfileDetails({ ...profileDetails, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1.5">Shipping Address</label>
                    <textarea 
                      value={profileDetails.address}
                      rows={3}
                      onChange={(e) => setProfileDetails({ ...profileDetails, address: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#800000]/25 outline-none transition-all resize-none"
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-50">
                    <motion.button 
                      onClick={handleSaveProfile}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#800000] to-[#990000] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:from-black hover:to-[#800000] transition-all cursor-pointer text-center block"
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
    </>
  );
}
