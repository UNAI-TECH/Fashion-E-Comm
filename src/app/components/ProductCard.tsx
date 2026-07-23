import { motion } from 'motion/react';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { Link } from 'react-router';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="group relative bg-transparent h-full flex flex-col"
    >
      {/* Badge */}
      {badge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-[#D4AF37] text-white text-xs tracking-wider rounded-full"
        >
          {badge}
        </motion.div>
      )}



      {/* Image Container */}
      <Link to={`/product/${id}`} className="block relative">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 rounded-[2rem] group/img">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            src={image}
            alt={name}
            className="w-full h-full object-cover object-top"
          />

          {/* Quick Action Overlay (Desktop) */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full lg:group-hover/img:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-black/50 to-transparent flex flex-col gap-2">
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 bg-white text-gray-900 rounded-lg flex items-center justify-center gap-2 shadow-sm text-xs font-bold"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Bag
            </motion.button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="pt-4 pb-2 px-1 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          <Link to={`/product/${id}`}>
            <h3 className="text-sm sm:text-base font-medium text-gray-800 line-clamp-2 hover:text-[#D4AF37] transition-colors leading-tight min-h-[2.5rem]">
              {name}
            </h3>
          </Link>

          {/* Price & Add to Cart (Mobile optimized) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#1A1A1A]">₹{price}</span>
              {originalPrice && (
                <span className="text-xs text-gray-400 line-through">₹{originalPrice}</span>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product);
              }}
              className="lg:hidden p-2 bg-[#1A1A1A] text-white rounded-lg shadow-sm active:scale-95 transition-transform"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rating and Colors */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
            <span className="text-xs text-gray-500 font-medium">{rating}</span>
          </div>
          
          <div className="flex -space-x-1.5 overflow-hidden">
            {colors.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            {colors.length > 3 && (
              <span className="text-[10px] text-gray-400 pl-1">+{colors.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      {/* Shimmer Effect */}
      <motion.div
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
        className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
      />
    </motion.div>
  );
}
