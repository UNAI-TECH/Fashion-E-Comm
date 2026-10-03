import { motion } from 'motion/react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  colors: string[];
  badge?: string;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  colors,
  badge,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const product = { id, name, price, originalPrice, image, rating, colors, badge } as any;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(id)) {
      await removeFromWishlist(id);
    } else {
      await addToWishlist(product);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product, 1);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product, 1);
    navigate('/checkout');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative bg-transparent h-full flex flex-col select-none"
    >
      {/* Top Floating Controls: Badge & Wishlist Button */}
      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
        {badge ? (
          <span className="px-3 py-1 bg-[#698156] text-white text-[11px] font-bold tracking-wider rounded-full shadow-sm pointer-events-auto">
            {badge}
          </span>
        ) : <span />}

        <button
          onClick={handleWishlistToggle}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center shadow-md text-gray-700 hover:text-[#698156] transition-all cursor-pointer pointer-events-auto active:scale-90"
          aria-label={isInWishlist(id) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 transition-colors ${isInWishlist(id) ? 'fill-[#698156] text-[#698156]' : 'text-gray-600'}`} />
        </button>
      </div>

      {/* Image Container */}
      <Link to={`/product/${id}`} className="block relative">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 rounded-[1.75rem] sm:rounded-[2rem] group/img shadow-sm group-hover:shadow-md transition-shadow">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            src={image}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="pt-3 pb-2 px-1 flex flex-col flex-1 justify-between gap-2">
        <div className="space-y-1.5">
          <Link to={`/product/${id}`}>
            <h3 className="text-sm sm:text-base font-medium text-gray-800 line-clamp-2 hover:text-[#698156] transition-colors leading-tight min-h-[2.4rem]">
              {name}
            </h3>
          </Link>

          {/* Price & Rating Row */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-[#1A1A1A]">₹{price}</span>
              {originalPrice && (
                <span className="text-xs text-gray-400 line-through">₹{originalPrice}</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-[#698156] text-[#698156]" />
              <span className="text-xs text-gray-600 font-semibold">{rating}</span>
            </div>
          </div>

          {/* Two Buttons Near the Price: ADD TO CART & BUY NOW */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-1">
            {/* Add to Cart */}
            <motion.button
              onClick={handleAddToCart}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="w-full py-2 px-1.5 bg-white border border-[#698156] text-[#698156] hover:bg-[#F4F6F2] rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
              title="Add to Cart"
            >
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="truncate">Add to Cart</span>
            </motion.button>

            {/* Buy Now */}
            <motion.button
              onClick={handleBuyNow}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="w-full py-2 px-1.5 bg-[#698156] hover:bg-[#546944] text-white rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-sm shadow-[#698156]/20 cursor-pointer"
              title="Buy Now"
            >
              <span className="truncate">Buy Now</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Shimmer Effect on hover */}
      <motion.div
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
        className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
      />
    </motion.div>
  );
}
