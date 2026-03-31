import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, ShoppingBag, Menu, X, Heart, ChevronDown, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Link, useLocation } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Product } from '../data/products';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartCount, addToCart } = useCart();
  const { wishlistItems, wishlistCount, removeFromWishlist } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'Published')
          .ilike('name', `%${searchQuery}%`)
          .limit(6);

        if (error) throw error;

        setSearchResults((data || []).map((p: any) => ({
          ...p,
          image: (p.images && p.images.length > 0) ? p.images[0] : (p.image_url || '')
        })));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Sarees', path: '/category/sarees' },
    { name: 'Kurtis', path: '/category/kurtis' },
    { name: 'Lehengas', path: '/category/lehengas' },
    { name: 'Salwar Sets', path: '/category/salwar-sets' },
    { name: 'Western', path: '/category/western' },
    { name: 'Contact', path: '/contact' },
  ];


  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed left-0 right-0 z-[40] transition-all duration-500 ${isScrolled
            ? 'top-0 bg-white shadow-lg'
            : 'top-12 bg-white/40 backdrop-blur-md border-b border-white/20'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="font-serif text-3xl sm:text-4xl tracking-tighter font-extrabold"
                style={{
                  background: 'linear-gradient(135deg, var(--maroon) 0%, var(--gold) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                AfforX
              </motion.div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-8">
              {menuItems.map((item) => (
                <Link key={item.name} to={item.path}>
                  <motion.span
                    whileHover={{ y: -2 }}
                    className={`text-sm font-bold tracking-wide cursor-pointer transition-colors ${location.pathname === item.path
                        ? 'text-[#800000]'
                        : 'text-gray-900 hover:text-[#800000]'
                      }`}
                  >
                    {item.name}
                  </motion.span>
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-900 hover:text-[#800000] transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsWishlistOpen(true)}
                className="hidden sm:block text-gray-900 hover:text-[#800000] transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: wishlistCount > 0 ? 1 : 0 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-[#800000] text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white"
                >
                  {wishlistCount}
                </motion.span>
              </motion.button>
              <Link to="/cart">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 text-gray-700 hover:text-[#D4AF37] transition-colors group"
                  aria-label="Cart"
                >
                  <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: cartCount > 0 ? 1 : 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  >
                    {cartCount}
                  </motion.span>
                </motion.button>
              </Link>
              <Link to="/orders">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:block text-gray-900 hover:text-[#800000] transition-colors"
                  aria-label="Profile/Orders"
                >
                  <User className="w-5 h-5" />
                </motion.button>
              </Link>

              {/* Mobile menu button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-gray-900"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden overflow-hidden bg-white border-t border-gray-100 shadow-2xl"
            >
              <div className="px-6 py-10 space-y-8">
                {/* Mobile Quick Links */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: Search, label: 'Search', onClick: () => { setIsSearchOpen(true); setIsMobileMenuOpen(false); } },
                    { icon: Heart, label: 'Wishlist', onClick: () => { setIsWishlistOpen(true); setIsMobileMenuOpen(false); } },
                    { icon: ShoppingBag, label: 'Cart', path: '/cart' },
                    { icon: User, label: 'Account', path: '/orders' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (item.onClick) item.onClick();
                          if (item.path) {
                            setIsMobileMenuOpen(false);
                            // Navigation handled by Link wrapper if path exists
                          }
                        }}
                        className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 shadow-sm"
                      >
                        {item.path ? (
                          <Link to={item.path} className="w-full h-full flex items-center justify-center">
                            <item.icon className="w-6 h-6" />
                          </Link>
                        ) : (
                          <item.icon className="w-6 h-6" />
                        )}
                      </motion.button>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {menuItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block"
                    >
                      <motion.div
                        whileHover={{ x: 10 }}
                        className={`text-2xl font-serif py-2 flex items-center justify-between group ${location.pathname === item.path
                            ? 'text-[#800000]'
                            : 'text-gray-900'
                          }`}
                      >
                        {item.name}
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    </Link>
                  ))}
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block py-4 px-6 bg-[#800000] text-white rounded-2xl text-center font-bold shadow-lg">
                    Contact Us
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-lg flex items-start justify-center pt-20 px-4"
          >
            <motion.div 
              initial={{ y: -50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -50, scale: 0.95 }}
              className="w-full max-w-3xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close search"
              >
                <X className="w-8 h-8 text-gray-400 hover:text-gray-900" />
              </button>
              
              <div className="mb-10">
                <h2 className="font-serif text-4xl mb-4 text-gray-900">Search Products</h2>
                <p className="text-gray-500">Find your perfect fashion piece in seconds.</p>
              </div>
              
              <div className="relative mb-10">
                <input
                  type="text"
                  autoFocus
                  placeholder="What are you looking for?"
                  className="w-full text-2xl py-6 px-10 pr-20 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#800000] text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all hover:scale-105 shadow-xl">
                  <Search className="w-8 h-8" />
                </button>
              </div>
              
              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4 -mr-4">
                {isSearching ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.map((product) => (
                      <Link 
                        key={product.id} 
                        to={`/product/${product.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="group flex gap-4 p-4 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                      >
                        <div className="w-20 h-28 aspect-[3/4] rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        </div>
                        <div className="flex-1 py-1">
                          <h3 className="font-serif text-lg text-gray-900 group-hover:text-[#800000] transition-colors">{product.name}</h3>
                          <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-[#800000] font-bold">₹{product.price.toLocaleString()}</p>
                            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">View Styles</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-10 opacity-40">
                    <p className="text-xl font-serif">No styles found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Popular Tags</p>
                    <div className="flex flex-wrap gap-3">
                      {['Wedding Saree', 'Anarkali Kurti', 'Bridal Lehenga', 'Western Gown', 'Silk', 'Embroidered'].map((tag) => (
                        <button 
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className="px-6 py-3 bg-gray-50 hover:bg-[#FFF0F5] hover:text-[#800000] rounded-full text-sm font-semibold transition-all border border-gray-100 hover:border-[#800000]/20"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wishlist Overlay */}
      <AnimatePresence>
        {isWishlistOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-lg flex justify-end"
          >
            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col pt-20"
            >
              <div className="px-8 pb-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-3xl text-gray-900 mb-1">My Wishlist</h2>
                  <p className="text-gray-500 text-sm">{wishlistItems.length} styles saved</p>
                </div>
                <button 
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
                {wishlistItems.length > 0 ? (
                  wishlistItems.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-24 h-32 rounded-2xl bg-gray-50 overflow-hidden relative border border-gray-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <button 
                          onClick={() => removeFromWishlist(item.id)}
                          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                          <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                      <div className="flex-1 py-1">
                        <h3 className="font-serif text-lg text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-[#800000] font-bold mb-3">₹{item.price.toLocaleString()}</p>
                        <button 
                          onClick={async () => {
                            await addToCart(item);
                            await removeFromWishlist(item.id);
                          }}
                          className="text-sm font-bold text-[#D4AF37] hover:text-[#800000] flex items-center gap-2 underline underline-offset-4 decoration-2"
                        >
                          Move to Bag <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Heart className="w-20 h-20 mb-4 stroke-1" />
                    <p className="text-xl font-serif">Your wishlist is empty</p>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                <button 
                  onClick={() => setIsWishlistOpen(false)}
                  className="w-full py-4 bg-[#800000] text-white rounded-2xl font-bold hover:bg-black transition-all hover:shadow-xl active:scale-95"
                >
                  Continue Shopping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
